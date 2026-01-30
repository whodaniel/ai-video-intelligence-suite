class APIClient {
  constructor() {
    this.baseURL = 'https://backend-production-ee16.up.railway.app/api';
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          endpoint: endpoint
        });
        throw new Error(data.error?.message || data.message || `API request failed: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Failed:', {
        endpoint: `${this.baseURL}${endpoint}`,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getToken() {
    const { token } = await chrome.storage.local.get('token');
    return token;
  }

  // Auth
  async login(googleAuthData) {
    const data = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleAuthData)
    });

    await chrome.storage.local.set({ token: data.data.token });
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Queue
  async addToQueue(videos) {
    return this.request('/queue', {
      method: 'POST',
      body: JSON.stringify({ videos })
    });
  }

  async getQueue(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/queue?${query}`);
  }

  async updateVideoStatus(videoId, status, errorMessage) {
    return this.request(`/queue/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, errorMessage })
    });
  }

  // Subscriptions
  async getSubscriptionStatus() {
    return this.request('/subscriptions/status');
  }

  async createCheckoutSession(tier, billingPeriod) {
    return this.request('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier, billingPeriod })
    });
  }

  // Reports
  async createReport(videoQueueId, segmentIndex, contentMarkdown, contentJson) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify({
        videoQueueId,
        segmentIndex,
        contentMarkdown,
        contentJson
      })
    });
  }
}

export default new APIClient();
