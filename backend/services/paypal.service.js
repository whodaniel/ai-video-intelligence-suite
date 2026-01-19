import { createRequire } from 'module';
const require = createRequire(import.meta.url);
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

  async getAccessToken() {
    // Basic caching for token
    if (this.token && this.tokenExpires > Date.now()) {
      return this.token;
    }

    const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const baseUrl = this.environment.constructor.name === 'LiveEnvironment'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('Failed to retrieve PayPal access token');
    }

    this.token = data.access_token;
    this.tokenExpires = Date.now() + (data.expires_in * 1000) - 60000; //Buffer 1 min
    return this.token;
  }

  async createSubscription(planId, customId = '') {
    const accessToken = await this.getAccessToken();
    const baseUrl = this.environment.constructor.name === 'LiveEnvironment'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: customId,
        application_context: {
          brand_name: 'AI Video Intelligence',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.API_URL}/api/subscriptions/success`,
          cancel_url: `${process.env.API_URL}/api/subscriptions/cancel`
        }
      })
    });

    const data = await response.json();
    return data;
  }

  // Verify webhook signature (helper)
  async verifyWebhookSignature(headers, body, webhookId) {
    // Implementation would use verify-webhook-signature endpoint
    // verifying locally or via API
    return true; // Placeholder
  }
}

export default new PayPalService();
