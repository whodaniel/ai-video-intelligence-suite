import express from 'express';
import Stripe from 'stripe';
import { query } from '../config/database.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (verified by Stripe signature)
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📨 Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Handler functions

async function handleCheckoutCompleted(session) {
  console.log('✅ Checkout completed:', session.id);

  const userId = session.metadata.userId;
  const tier = session.metadata.tier;
  const billingPeriod = session.metadata.billingPeriod;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Create subscription record in database
  await query(
    `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_price_id, tier, status, billing_period, current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), to_timestamp($8))
     ON CONFLICT (stripe_subscription_id) DO UPDATE
     SET status = $5, current_period_start = to_timestamp($7), current_period_end = to_timestamp($8), updated_at = NOW()`,
    [
      userId,
      subscription.id,
      subscription.items.data[0].price.id,
      tier,
      subscription.status,
      billingPeriod,
      subscription.current_period_start,
      subscription.current_period_end
    ]
  );

  // Update user tier
  await query('UPDATE users SET tier = $1 WHERE id = $2', [tier, userId]);

  console.log(`✅ User ${userId} subscribed to ${tier} tier`);
}

async function handleSubscriptionCreated(subscription) {
  console.log('✅ Subscription created:', subscription.id);

  // Get user ID from customer
  const customer = await stripe.customers.retrieve(subscription.customer);
  const userId = customer.metadata.userId;

  if (!userId) {
    console.error('❌ No userId found in customer metadata');
    return;
  }

  // Determine tier from price
  const priceId = subscription.items.data[0].price.id;
  const tier = determineTierFromPrice(priceId);
  const billingPeriod = subscription.items.data[0].price.recurring.interval === 'year' ? 'yearly' : 'monthly';

  await query(
    `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_price_id, tier, status, billing_period, current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, $5, $6, to_timestamp($7), to_timestamp($8))
     ON CONFLICT (stripe_subscription_id) DO UPDATE
     SET status = $5, updated_at = NOW()`,
    [
      userId,
      subscription.id,
      priceId,
      tier,
      subscription.status,
      billingPeriod,
      subscription.current_period_start,
      subscription.current_period_end
    ]
  );
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  await query(
    `UPDATE subscriptions
     SET status = $1, current_period_start = to_timestamp($2), current_period_end = to_timestamp($3),
         cancel_at_period_end = $4, updated_at = NOW()
     WHERE stripe_subscription_id = $5`,
    [
      subscription.status,
      subscription.current_period_start,
      subscription.current_period_end,
      subscription.cancel_at_period_end,
      subscription.id
    ]
  );

  // If subscription is no longer active, downgrade user to free
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    const result = await query('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1', [
      subscription.id
    ]);

    if (result.rows.length > 0) {
      await query('UPDATE users SET tier = $1 WHERE id = $2', ['free', result.rows[0].user_id]);
      console.log(`⬇️  User ${result.rows[0].user_id} downgraded to free tier`);
    }
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  // Get user
  const result = await query('SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1', [
    subscription.id
  ]);

  if (result.rows.length > 0) {
    const userId = result.rows[0].user_id;

    // Update subscription status
    await query(
      `UPDATE subscriptions
       SET status = 'canceled', canceled_at = NOW(), updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    // Downgrade user to free tier
    await query('UPDATE users SET tier = $1 WHERE id = $2', ['free', userId]);

    console.log(`⬇️  User ${userId} downgraded to free tier`);
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log('✅ Payment succeeded:', invoice.id);

  // Update subscription status if needed
  if (invoice.subscription) {
    await query(
      `UPDATE subscriptions SET status = 'active', updated_at = NOW() WHERE stripe_subscription_id = $1`,
      [invoice.subscription]
    );
  }
}

async function handlePaymentFailed(invoice) {
  console.log('❌ Payment failed:', invoice.id);

  // Update subscription status
  if (invoice.subscription) {
    await query(
      `UPDATE subscriptions SET status = 'past_due', updated_at = NOW() WHERE stripe_subscription_id = $1`,
      [invoice.subscription]
    );
  }

  // TODO: Send email notification to user
}

// Helper function
function determineTierFromPrice(priceId) {
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_PRO_YEARLY) {
    return 'pro';
  }
  if (priceId === process.env.STRIPE_PRICE_TNF_MONTHLY || priceId === process.env.STRIPE_PRICE_TNF_YEARLY) {
    return 'tnf';
  }
  return 'free';
}

export default router;
