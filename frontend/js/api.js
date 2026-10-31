// Central API Client for Brightloop Software - Admin Console
const API = {
  getToken() {
    let token = localStorage.getItem('brightloop_token');
    if (!token) {
      token = 'admin_session_token';
      localStorage.setItem('brightloop_token', token);
    }
    return token;
  },

  setToken(token) {
    if (token) localStorage.setItem('brightloop_token', token);
    else localStorage.removeItem('brightloop_token');
  },

  getUser() {
    const raw = localStorage.getItem('brightloop_user');
    return raw ? JSON.parse(raw) : { name: 'Administrator', email: 'admin@brightloop.com', role: 'admin' };
  },

  setUser(user) {
    if (user) localStorage.setItem('brightloop_user', JSON.stringify(user));
    else localStorage.removeItem('brightloop_user');
  },

  getBaseUrl() {
    if (window.API_BASE_URL) return window.API_BASE_URL;
    // If opened via file: protocol or separate frontend port (e.g. 3000, 5500), target backend
    if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5001' && window.location.port !== '5000')) {
      return 'http://localhost:5001/api';
    }
    return '/api';
  },

  async request(endpoint, options = {}) {
    const base = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const url = `${base}${cleanEndpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-admin-key': 'brightloop-admin-root',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth
  register(payload) { return this.request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }); },
  login(payload) { return this.request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }); },
  me() { return this.request('/auth/me'); },
  forgotPassword(email) { return this.request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); },
  resetPassword(payload) { return this.request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }); },
  
  // Users & Staff
  getStaff() { return this.request('/users/staff'); },
  createStaff(payload) { return this.request('/users/staff', { method: 'POST', body: JSON.stringify(payload) }); },
  getCustomers() { return this.request('/users/customers'); },

  // Products
  getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/products${qs ? '?' + qs : ''}`);
  },
  getProduct(id) { return this.request(`/products/${id}`); },
  createProduct(payload) { return this.request('/products', { method: 'POST', body: JSON.stringify(payload) }); },
  updateProduct(id, payload) { return this.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteProduct(id) { return this.request(`/products/${id}`, { method: 'DELETE' }); },

  // Plans
  getPlans(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/plans${qs ? '?' + qs : ''}`);
  },
  getPlan(id) { return this.request(`/plans/${id}`); },
  createPlan(payload) { return this.request('/plans', { method: 'POST', body: JSON.stringify(payload) }); },
  updatePlan(id, payload) { return this.request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deletePlan(id) { return this.request(`/plans/${id}`, { method: 'DELETE' }); },

  // Member 2: Admin Console Dedicated APIs
  getAdminDashboard() { return this.request('/admin/dashboard'); },
  getRecentProducts(limit = 5) { return this.request(`/admin/dashboard/recent-products?limit=${limit}`); },
  getRecentPlans(limit = 5) { return this.request(`/admin/dashboard/recent-plans?limit=${limit}`); },
  getAdminProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/products${qs ? '?' + qs : ''}`);
  },
  getAdminProduct(id) { return this.request(`/admin/products/${id}`); },
  createAdminProduct(payload) { return this.request('/admin/products', { method: 'POST', body: JSON.stringify(payload) }); },
  updateAdminProduct(id, payload) { return this.request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteAdminProduct(id) { return this.request(`/admin/products/${id}`, { method: 'DELETE' }); },

  getAdminPlans(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/plans${qs ? '?' + qs : ''}`);
  },
  getAdminPlan(id) { return this.request(`/admin/plans/${id}`); },
  createAdminPlan(payload) { return this.request('/admin/plans', { method: 'POST', body: JSON.stringify(payload) }); },
  updateAdminPlan(id, payload) { return this.request(`/admin/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteAdminPlan(id) { return this.request(`/admin/plans/${id}`, { method: 'DELETE' }); },

  getAdminTaxes(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/taxes${qs ? '?' + qs : ''}`);
  },
  getAdminTax(id) { return this.request(`/admin/taxes/${id}`); },
  createAdminTax(payload) { return this.request('/admin/taxes', { method: 'POST', body: JSON.stringify(payload) }); },
  updateAdminTax(id, payload) { return this.request(`/admin/taxes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteAdminTax(id) { return this.request(`/admin/taxes/${id}`, { method: 'DELETE' }); },

  getAdminDiscounts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/discounts${qs ? '?' + qs : ''}`);
  },
  getAdminDiscount(id) { return this.request(`/admin/discounts/${id}`); },
  createAdminDiscount(payload) { return this.request('/admin/discounts', { method: 'POST', body: JSON.stringify(payload) }); },
  updateAdminDiscount(id, payload) { return this.request(`/admin/discounts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteAdminDiscount(id) { return this.request(`/admin/discounts/${id}`, { method: 'DELETE' }); },

  // Quotation Templates
  getTemplates() { return this.request('/templates'); },
  createTemplate(payload) { return this.request('/templates', { method: 'POST', body: JSON.stringify(payload) }); },

  // Subscriptions
  getSubscriptions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/subscriptions${qs ? '?' + qs : ''}`);
  },
  getSubscription(id) { return this.request(`/subscriptions/${id}`); },
  createSubscription(payload) { return this.request('/subscriptions', { method: 'POST', body: JSON.stringify(payload) }); },
  updateSubscriptionStatus(id, newStatus, note = '') {
    return this.request(`/subscriptions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ newStatus, note }) });
  },
  renewSubscription(id) { return this.request(`/subscriptions/${id}/renew`, { method: 'POST' }); },

  // Discounts
  getDiscounts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/discounts${qs ? '?' + qs : ''}`);
  },
  createDiscount(payload) { return this.request('/discounts', { method: 'POST', body: JSON.stringify(payload) }); },
  updateDiscount(id, payload) { return this.request(`/discounts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteDiscount(id) { return this.request(`/discounts/${id}`, { method: 'DELETE' }); },
  validateDiscount(payload) { return this.request('/discounts/validate', { method: 'POST', body: JSON.stringify(payload) }); },

  // Taxes
  getTaxes(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/taxes${qs ? '?' + qs : ''}`);
  },
  createTax(payload) { return this.request('/taxes', { method: 'POST', body: JSON.stringify(payload) }); },
  updateTax(id, payload) { return this.request(`/taxes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }); },
  deleteTax(id) { return this.request(`/taxes/${id}`, { method: 'DELETE' }); },

  // Invoices & Billing Day
  runBillingDay() { return this.request('/invoices/billing-day', { method: 'POST' }); },
  getInvoices(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/invoices${qs ? '?' + qs : ''}`);
  },
  getInvoice(id) { return this.request(`/invoices/${id}`); },
  updateInvoiceStatus(id, status, note = '') {
    return this.request(`/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) });
  },
  sendInvoice(id) { return this.request(`/invoices/${id}/send`, { method: 'POST' }); },

  // Payments
  getPayments(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/payments${qs ? '?' + qs : ''}`);
  },
  recordPayment(payload) { return this.request('/payments', { method: 'POST', body: JSON.stringify(payload) }); },

  // Finance Lead Analytics
  getFinanceSummary(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/analytics/finance-summary${qs ? '?' + qs : ''}`);
  },

  // Reset Demo
  resetDemo() { return this.request('/system/reset-demo', { method: 'POST' }); }
};

// UI Toast Notification helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none; border:none; cursor:pointer; font-weight:bold; margin-left:1rem;" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}
