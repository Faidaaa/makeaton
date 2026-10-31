/**
 * Brightloop API Client
 * Connects frontend to Express backend, with automatic fallback for seamless testing.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP error ${res.status}`);
    }
    return data;
  } catch (error) {
    console.warn(`API request to ${endpoint} failed, falling back to local client state:`, error.message);
    throw error;
  }
}

export const api = {
  // Helper to build clean query string without undefined or empty values
  buildQuery(params = {}) {
    const cleaned = {};
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        cleaned[key] = val;
      }
    }
    const qs = new URLSearchParams(cleaned).toString();
    return qs ? `?${qs}` : '';
  },

  // Staff Workspace
  async getStaffOverview() {
    return fetchJson('/staff/overview');
  },

  // Quotations
  async getQuotations(params = {}) {
    return fetchJson(`/quotations${this.buildQuery(params)}`);
  },

  async getQuotationTemplates() {
    return fetchJson('/quotations/templates');
  },

  async getQuotationById(id) {
    return fetchJson(`/quotations/${id}`);
  },

  async createQuotation(quotationData) {
    return fetchJson('/quotations', {
      method: 'POST',
      body: JSON.stringify(quotationData)
    });
  },

  async updateQuotation(id, updateData) {
    return fetchJson(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  async convertQuotation(id) {
    return fetchJson(`/quotations/${id}/convert`, {
      method: 'POST'
    });
  },

  // Subscriptions
  async getSubscriptions(params = {}) {
    return fetchJson(`/subscriptions${this.buildQuery(params)}`);
  },

  async getSubscriptionById(id) {
    return fetchJson(`/subscriptions/${id}`);
  },

  async createSubscription(subscriptionData) {
    return fetchJson('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
  },

  async transitionSubscriptionStatus(id, nextStatus, note, staffName = 'Vishnu (Staff)') {
    return fetchJson(`/subscriptions/${id}/transition`, {
      method: 'PATCH',
      body: JSON.stringify({ nextStatus, note, staffName })
    });
  },

  async togglePauseSubscription(id) {
    return fetchJson(`/subscriptions/${id}/pause`, {
      method: 'POST'
    });
  },

  async renewSubscription(id, additionalMonths = 12) {
    return fetchJson(`/subscriptions/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ additionalMonths })
    });
  },

  // Catalog & Shared Data
  async getCustomers() {
    return fetchJson('/catalog/customers');
  },

  async getPlans() {
    return fetchJson('/catalog/plans');
  },

  async getProducts() {
    return fetchJson('/catalog/products');
  },

  async getTaxes() {
    return fetchJson('/catalog/taxes');
  }
};
