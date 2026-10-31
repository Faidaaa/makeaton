// Authentication, RBAC, and User State Management
const Auth = {
  currentUser: null,

  init() {
    this.currentUser = API.getUser();
    this.renderUserUI();
    this.bindEvents();
    if (!this.currentUser) {
      // Auto login as admin by default for demo inspection convenience
      this.quickLogin('admin@brightloop.com', 'BrightAdmin!2026');
    }
  },

  renderUserUI() {
    const user = this.currentUser;
    const navUserPanel = document.getElementById('nav-user-panel');
    const guestActions = document.getElementById('nav-guest-actions');
    const userRoleBadge = document.getElementById('user-role-badge');
    const userNameDisplay = document.getElementById('user-name-display');

    if (user) {
      if (navUserPanel) navUserPanel.style.display = 'flex';
      if (guestActions) guestActions.style.display = 'none';
      if (userRoleBadge) {
        userRoleBadge.className = `role-badge ${user.role}`;
        userRoleBadge.textContent = user.role.toUpperCase();
      }
      if (userNameDisplay) {
        userNameDisplay.textContent = user.name;
      }
    } else {
      if (navUserPanel) navUserPanel.style.display = 'none';
      if (guestActions) guestActions.style.display = 'flex';
    }

    // Role-Based UI Visibility Filtering (RBAC)
    this.applyRBACRules();
  },

  applyRBACRules() {
    const role = this.currentUser?.role || 'guest';
    const adminStaffOnly = document.querySelectorAll('.rbac-admin-staff');
    const adminOnly = document.querySelectorAll('.rbac-admin');
    const customerOnly = document.querySelectorAll('.rbac-customer');

    adminStaffOnly.forEach(el => {
      el.style.display = (role === 'admin' || role === 'staff') ? '' : 'none';
    });

    adminOnly.forEach(el => {
      el.style.display = (role === 'admin') ? '' : 'none';
    });

    customerOnly.forEach(el => {
      el.style.display = (role === 'customer') ? '' : 'none';
    });

    // Auto-switch to customer portal tab if customer logs in
    if (role === 'customer') {
      const portalTabBtn = document.querySelector('[data-tab="customer-portal"]');
      if (portalTabBtn) portalTabBtn.click();
    }
  },

  async login(email, password) {
    try {
      const data = await API.login({ email, password });
      API.setToken(data.token);
      API.setUser(data.user);
      this.currentUser = data.user;
      this.renderUserUI();
      showToast(data.message, 'success');
      closeModal('login-modal');
      refreshCurrentView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async quickLogin(email, password) {
    try {
      const data = await API.login({ email, password });
      API.setToken(data.token);
      API.setUser(data.user);
      this.currentUser = data.user;
      this.renderUserUI();
      showToast(`Switched profile to: ${data.user.name} (${data.user.role.toUpperCase()})`, 'info');
      refreshCurrentView();
    } catch (err) {
      console.warn('Quick login fallback:', err.message);
    }
  },

  logout() {
    API.setToken(null);
    API.setUser(null);
    this.currentUser = null;
    this.renderUserUI();
    showToast('You have been logged out.', 'info');
    openModal('login-modal');
  },

  bindEvents() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        this.login(email, password);
      });
    }

    // Customer signup form submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const company = document.getElementById('signup-company').value;
        const phone = document.getElementById('signup-phone').value;

        try {
          const res = await API.register({ name, email, password, company, phone });
          API.setToken(res.token);
          API.setUser(res.user);
          this.currentUser = res.user;
          this.renderUserUI();
          showToast(res.message, 'success');
          closeModal('signup-modal');
          refreshCurrentView();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    // Password validation real-time feedback
    const signupPwdInput = document.getElementById('signup-password');
    if (signupPwdInput) {
      signupPwdInput.addEventListener('input', (e) => {
        const val = e.target.value;
        const reqLen = document.getElementById('pwd-req-len');
        const reqUpper = document.getElementById('pwd-req-upper');
        const reqLower = document.getElementById('pwd-req-lower');
        const reqSpecial = document.getElementById('pwd-req-special');

        if (reqLen) reqLen.style.color = val.length > 8 ? 'var(--success)' : 'var(--text-secondary)';
        if (reqUpper) reqUpper.style.color = /[A-Z]/.test(val) ? 'var(--success)' : 'var(--text-secondary)';
        if (reqLower) reqLower.style.color = /[a-z]/.test(val) ? 'var(--success)' : 'var(--text-secondary)';
        if (reqSpecial) reqSpecial.style.color = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(val) ? 'var(--success)' : 'var(--text-secondary)';
      });
    }

    // Forgot password submission
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        try {
          const res = await API.forgotPassword(email);
          showToast(res.message, 'info');
          if (res.simulationResetToken) {
            document.getElementById('reset-token-display').textContent = res.simulationResetToken;
            document.getElementById('reset-simulation-box').style.display = 'block';
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  }
};
