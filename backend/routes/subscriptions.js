import express from 'express';
import paypal from '../services/paypal.service.js';
import { query } from '../config/database.js';
import { protect, requireTier } from '../middleware/auth.js';

const router = express.Router();


/**
 * @route   GET /api/subscriptions/status
 * @desc    Get user's subscription status
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, u.tier as user_tier, u.daily_usage, u.daily_limit
       FROM subscriptions s
       RIGHT JOIN users u ON s.user_id = u.id
       WHERE u.id = $1 AND (s.status = 'active' OR s.id IS NULL)
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    const row = result.rows[0];
    // Prioritize subscription tier if active, otherwise fallback to user tier (which might be pro via manual grant)
    const tier = (row && row.status === 'active' && row.tier) ? row.tier : (row ? row.user_tier : 'free');
    
    // Get feature limits based on tier
    const features = getFeaturesByTier(tier);

    // IMPORTANT: If the user record has a daily_limit that is high (like 1000 or Infinity), respect that overrides the standard tier limit
    // This handles manual overrides in the database for specific users
    if (row && row.daily_limit && row.daily_limit > features.dailyLimit) {
        features.dailyLimit = row.daily_limit;
    }

    const subscription = row ? { ...row, tier } : { tier: 'free' };

    // Get feature limits based on tier
    // REMOVED duplicate declaration
 
    res.json({
      success: true,
      data: {
        subscription,
        features: {
          ...features,
          dailyUsage: row ? row.daily_usage : 0, // Pass actual usage from DB
          dailyLimit: features.dailyLimit // Pass the resolved limit (tier-based or override)
        }
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get subscription status' }
    });
  }
});

/**
 * @route   POST /api/subscriptions/checkout
 * @desc    Create Stripe checkout session
 * @access  Private
 */
router.post('/checkout', protect, async (req, res) => {
  try {
    const { tier, billingPeriod = 'monthly' } = req.body;

    if (!['pro', 'tnf'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid tier. Must be "pro" or "tnf"' }
      });
    }
    
    // Get Plan ID from Env based on tier/billing
    let planId;
    const key = `PAYPAL_PLAN_${tier.toUpperCase()}_${billingPeriod.toUpperCase() === 'YEARLY' ? 'YEARLY' : 'MONTHLY'}`;
    planId = process.env[key];

    if (!planId) {
      console.warn(`Plan ID not found for ${key}, falling back to creation logic or error`);
       return res.status(500).json({
        success: false,
        error: { message: 'Subscription Plan not configured' }
      });
    }

    const subscription = await paypal.createSubscription(planId, req.user.id);

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        approvalUrl: subscription.links.find(link => link.rel === 'approve').href
      }
    });
  } catch (error) {
    console.error('PayPal checkout error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create PayPal subscription' }
    });
  }
});

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Cancel subscription
 * @access  Private
 */
router.post('/cancel', protect, requireTier('pro', 'tnf'), async (req, res) => {
  try {
    // Get active subscription
    const result = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
      [req.user.id, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'No active subscription found' }
      });
    }

    const subscription = result.rows[0];

    // Cancel at period end (don't immediately revoke access)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update database
    await query(
      'UPDATE subscriptions SET cancel_at_period_end = true, updated_at = NOW() WHERE id = $1',
      [subscription.id]
    );

    res.json({
      success: true,
      data: {
        message: 'Subscription will be canceled at the end of the billing period',
        currentPeriodEnd: subscription.current_period_end
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel subscription' }
    });
  }
});

/**
 * @route   GET /api/subscriptions/pricing
 * @desc    Get pricing information
 * @access  Public
 */
router.get('/pricing', (req, res) => {
  res.json({
    success: true,
    data: {
      tiers: {
        free: {
          name: 'Free',
          price: 0,
          features: [
            '20 videos per day',
            '1 concurrent process',
            'Basic prompts (3 templates)',
            'Manual report download',
            'Basic retry logic'
          ]
        },
        pro: {
          name: 'Pro',
          monthly: 9.99,
          yearly: 99,
          yearlyDiscount: '17%',
          features: [
            'Unlimited videos',
            '3 concurrent processes',
            'Custom prompts (50 templates)',
            'NotebookLM integration',
            'Podcast creation (5/month)',
            'Personal knowledge base browser',
            'Topic extraction & organization',
            'Cloud sync',
            'Advanced retry logic',
            'Auto-download reports',
            'Analytics dashboard',
            'Priority support'
          ]
        },
        tnf: {
          name: 'The New Fuse',
          monthly: 30,
          yearly: 300,
          yearlyDiscount: '17%',
          description: 'Separate premium product suite',
          isExternalProduct: true,
          learnMoreUrl: 'https://thenewfuse.com',
          features: [
            'Everything in Pro',
            'The New Fuse Chrome extension',
            '10 concurrent processes',
            'Unlimited custom prompts',
            'Unlimited podcasts',
            'API access',
            'RAG semantic search',
            'Personal AI assistant',
            'Agent integration',
            'Knowledge base as agent memory',
            'Team collaboration',
            'White-label option',
            'Dedicated support'
          ]
        }
      }
    }
  });
});

// Helper functions
function getPriceId(tier, billingPeriod) {
  const priceMap = {
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY
    },
    tnf: {
      monthly: process.env.STRIPE_PRICE_TNF_MONTHLY,
      yearly: process.env.STRIPE_PRICE_TNF_YEARLY
    }
  };

  return priceMap[tier][billingPeriod];
}

function getFeaturesByTier(tier) {
  const features = {
    free: {
      dailyLimit: 20,
      concurrentProcesses: 1,
      customPrompts: false,
      maxCustomPrompts: 0,
      notebooklmIntegration: false,
      podcasts: false,
      knowledgeBaseBrowser: false,
      cloudSync: false,
      apiAccess: false
    },
    pro: {
      dailyLimit: Infinity,
      concurrentProcesses: 3,
      customPrompts: true,
      maxCustomPrompts: 50,
      notebooklmIntegration: true,
      podcasts: true,
      maxPodcasts: 5,
      knowledgeBaseBrowser: true,
      cloudSync: true,
      apiAccess: false
    },
    tnf: {
      dailyLimit: Infinity,
      concurrentProcesses: 10,
      customPrompts: true,
      maxCustomPrompts: Infinity,
      notebooklmIntegration: true,
      podcasts: true,
      maxPodcasts: Infinity,
      knowledgeBaseBrowser: true,
      cloudSync: true,
      apiAccess: true,
      ragSearch: true,
      agentIntegration: true
    }
  };

  return features[tier] || features.free;
}

export default router;
