const paypal = require('@paypal/checkout-server-sdk');

class PayPalService {
  constructor() {
    this.environment = process.env.NODE_ENV === 'production'
      ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
    
    this.client = new paypal.core.PayPalHttpClient(this.environment);
  }

  async createOrder(price, currency = 'USD') {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: price
        }
      }]
    });

    try {
      const order = await this.client.execute(request);
      return order.result;
    } catch (err) {
      console.error('PayPal Create Order Error:', err);
      throw err;
    }
  }

  async captureOrder(orderId) {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    try {
      const capture = await this.client.execute(request);
      return capture.result;
    } catch (err) {
      console.error('PayPal Capture Order Error:', err);
      throw err;
    }
  }

  async createSubscription(planId) {
    // PayPal Subscriptions API logic would go here
    // Note: The Checkout SDK handles one-time payments primarily. 
    // Subscriptions usually require a different integration flow or the Subscriptions API directly.
    // For MVP, simple recurring invoices or just one-time generic "Pro" purchases might be easier.
    // We will assume standard subscription flow for now.
    throw new Error('Subscription creation not fully implemented in MVP');
  }
}

module.exports = new PayPalService();
