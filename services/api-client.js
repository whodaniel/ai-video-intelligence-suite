class APIClient {
  constructor() {
    this.baseURL = 'https://aivideointel.thenewfuse.com/api';
    this.maxRetries = 3;
    this.retryDelayMs = 2000;
    this.retryableStatuses = [502, 503, 504];
    this.isBackendDown = false;
    this.lastBackendCheck = 0;
    this.backendCheckIntervalMs = 30000;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async isBackendAvailable() {
    const now = Date.now();
    if (this.isBackendDown && (now - this.lastBackendCheck) < this.backendCheckIntervalMs) {
      return false;
    }
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      this.isBackendDown = !response.ok;
      this.lastBackendCheck = now;
      return response.ok;
    } catch {
      this.isBackendDown = true;
      this.lastBackendCheck = now;
      return false;
    }
  }

  async request(endpoint, options = {}, retryCount = 0) {
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
        if (this.retryableStatuses.includes(response.status) && retryCount < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, retryCount);
          console.warn(`⚠️ ${response.status} from ${endpoint} - retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
          await this.sleep(delay);
          return await this.request(endpoint, options, retryCount + 1);
        }

        if (this.retryableStatuses.includes(response.status) && retryCount >= this.maxRetries) {
          this.isBackendDown = true;
          this.lastBackendCheck = Date.now();
          const err = new Error('Backend is temporarily unavailable. Please try again in a few minutes.');
          err.isBackendDown = true;
          err.status = response.status;
          throw err;
        }

        if (response.status === 401 && retryCount === 0) {
          console.warn('⚠️ 401 Unauthorized - JWT token may be expired');

          const stored = await chrome.storage.local.get(['userProfile']);
          if (stored.userProfile) {
            console.log('🔄 Attempting to refresh JWT token...');
            try {
              await this.login({
                googleId: stored.userProfile.id,
                email: stored.userProfile.email,
                displayName: stored.userProfile.name,
                avatarUrl: stored.userProfile.picture
              });

              console.log('✅ JWT refreshed, retrying original request...');
              return await this.request(endpoint, options, retryCount + 1);
            } catch (refreshError) {
              console.error('❌ Failed to refresh JWT:', refreshError);
              await chrome.storage.local.set({
                token: null,
                isAuthenticated: false
              });
            }
          }
        }

        console.error('API Error Response:', JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          data: data,
          endpoint: endpoint
        }, null, 2));

        throw new Error(data.error?.message || data.message || `API request failed: ${response.status} ${response.statusText}`);
      }

      this.isBackendDown = false;
      return data;
    } catch (error) {
      if (error.isBackendDown) throw error;

      if (error.name === 'TypeError' && retryCount < this.maxRetries) {
        const delay = this.retryDelayMs * Math.pow(2, retryCount);
        console.warn(`⚠️ Network error on ${endpoint} - retrying in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.sleep(delay);
        return await this.request(endpoint, options, retryCount + 1);
      }

      console.error('API Request Failed:', JSON.stringify({
        endpoint: `${this.baseURL}${endpoint}`,
        error: error.message,
        stack: error.stack
      }, null, 2));
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

  async getReports(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/reports?${query}`);
  }
}

export default new APIClient();
