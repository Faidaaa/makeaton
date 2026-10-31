// ====================================================
// MEMBER 2: ADMIN CONSOLE CLIENT CONTROLLER
// Dedicated Admin Management Interface
// ====================================================

const AdminConsole = {
  activeSubTab: 'dashboard',
  currentProducts: [],
  currentPlans: [],
  currentTaxes: [],
  currentDiscounts: [],

  // Product pagination state
  productPage: 1,
  productLimit: 10,
  productTotal: 0,
  productSearch: '',
  productType: '',

  // Plan search state
  planSearch: '',
  planFrequency: '',

  // Current editing IDs (null if creating new)
  editingProductId: null,
  editingPlanId: null,
  editingTaxId: null,
  editingDiscountId: null,

  async init() {
    this.bindEvents();
    await this.load();
  },

  async load() {
    try {
      this.updateProfileBanner();
      await this.loadDashboardMetrics();
      await Promise.all([
        this.loadProducts(),
        this.loadPlans(),
        this.loadTaxes(),
        this.loadDiscounts()
      ]);
    } catch (err) {
      console.error('[AdminConsole] Load failed:', err);
    }
  },

  refreshAll() {
    showToast('Refreshing Admin Console telemetry...', 'info');
    this.load();
  },

  updateProfileBanner() {
    const user = (window.Auth && Auth.currentUser) || {
      name: 'Administrator',
      email: 'admin@brightloop.com',
      company: 'Brightloop Software Headquarters',
      role: 'admin'
    };

    const nameEl = document.getElementById('admin-banner-name');
    const emailEl = document.getElementById('admin-banner-email');
    const compEl = document.getElementById('admin-banner-company');
    const avatarEl = document.getElementById('admin-banner-avatar');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (compEl) compEl.textContent = user.company || 'Brightloop Software Headquarters';
    if (avatarEl) {
      const initials = (user.name || 'Admin')
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      avatarEl.textContent = initials || 'AD';
    }
  },

  bindEvents() {
    const prodSearchInput = document.getElementById('admin-prod-search');
    if (prodSearchInput) {
      prodSearchInput.addEventListener('input', (e) => {
        this.productSearch = e.target.value;
        this.productPage = 1;
        this.loadProducts();
      });
    }

    const prodTypeSelect = document.getElementById('admin-prod-type-filter');
    if (prodTypeSelect) {
      prodTypeSelect.addEventListener('change', (e) => {
        this.productType = e.target.value;
        this.productPage = 1;
        this.loadProducts();
      });
    }

    const planSearchInput = document.getElementById('admin-plan-search');
    if (planSearchInput) {
      planSearchInput.addEventListener('input', (e) => {
        this.planSearch = e.target.value;
        this.loadPlans();
      });
    }

    const planFreqSelect = document.getElementById('admin-plan-freq-filter');
    if (planFreqSelect) {
      planFreqSelect.addEventListener('change', (e) => {
        this.planFrequency = e.target.value;
        this.loadPlans();
      });
    }
  },

  switchAdminSubTab(subTabName) {
    this.activeSubTab = subTabName;

    // Update sidebar navigation items
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      const isTarget = item.getAttribute('onclick')?.includes(`'${subTabName}'`);
      item.classList.toggle('active', Boolean(isTarget));
    });

    // Update views
    const views = ['dashboard', 'products', 'plans', 'taxes', 'discounts'];
    views.forEach(v => {
      const el = document.getElementById(`admin-subtab-${v}`);
      if (el) el.style.display = (v === subTabName) ? 'block' : 'none';
    });

    // Reload content for tab
    if (subTabName === 'dashboard') this.loadDashboardMetrics();
    else if (subTabName === 'products') this.loadProducts();
    else if (subTabName === 'plans') this.loadPlans();
    else if (subTabName === 'taxes') this.loadTaxes();
    else if (subTabName === 'discounts') this.loadDiscounts();
  },

  // ====================================================
  // 1. ADMIN DASHBOARD TELEMETRY
  // ====================================================
  async loadDashboardMetrics() {
    try {
      const res = await API.getAdminDashboard();
      if (!res || !res.success) return;

      const { stats, recentProducts, recentPlans } = res;

      // Update 5 KPI Stat Cards
      const prodEl = document.getElementById('admin-stat-products');
      const actProdEl = document.getElementById('admin-stat-active-products');
      const plansEl = document.getElementById('admin-stat-plans');
      const actPlansEl = document.getElementById('admin-stat-active-plans');
      const actPlansCardEl = document.getElementById('admin-stat-active-plans-card');
      const taxesEl = document.getElementById('admin-stat-taxes');
      const totalTaxesEl = document.getElementById('admin-stat-total-taxes');
      const discEl = document.getElementById('admin-stat-discounts');
      const totalDiscEl = document.getElementById('admin-stat-total-discounts');

      if (prodEl) prodEl.textContent = stats.totalProducts;
      if (actProdEl) actProdEl.textContent = `${stats.activeProducts} Active in Catalog`;
      if (plansEl) plansEl.textContent = stats.totalPlans;
      if (actPlansEl) actPlansEl.textContent = `${stats.activePlans} Active Plans`;
      if (actPlansCardEl) actPlansCardEl.textContent = stats.activePlans;
      if (taxesEl) taxesEl.textContent = stats.activeTaxRules;
      if (totalTaxesEl) totalTaxesEl.textContent = `${stats.totalTaxRules} Total Rules`;
      if (discEl) discEl.textContent = stats.activeDiscountRules;
      if (totalDiscEl) totalDiscEl.textContent = `${stats.totalDiscountRules} Total Rules`;

      // Update Sidebar Badges
      const sideStats = document.getElementById('side-badge-stats');
      const sideProd = document.getElementById('side-badge-products');
      const sidePlans = document.getElementById('side-badge-plans');
      const sideTaxes = document.getElementById('side-badge-taxes');
      const sideDisc = document.getElementById('side-badge-discounts');

      if (sideStats) sideStats.textContent = (stats.totalProducts || 0) + (stats.totalPlans || 0);
      if (sideProd) sideProd.textContent = stats.totalProducts || 0;
      if (sidePlans) sidePlans.textContent = stats.totalPlans || 0;
      if (sideTaxes) sideTaxes.textContent = stats.activeTaxRules || 0;
      if (sideDisc) sideDisc.textContent = stats.activeDiscountRules || 0;

      // Render Recent Products Table
      this.renderRecentProducts(recentProducts || []);

      // Render Recent Plans Table
      this.renderRecentPlans(recentPlans || []);
    } catch (err) {
      console.warn('Dashboard stats notice:', err.message);
    }
  },

  renderRecentProducts(products) {
    const tbody = document.getElementById('admin-recent-products-tbody');
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:1.5rem;">No products in catalog yet. Click "+ Launch New Product" to add.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const odooVariant = (p.brandVariants || []).find(v => v.brandName?.toLowerCase().includes('odoo'));
      return `
        <tr>
          <td>
            <strong>${p.name}</strong>
            ${odooVariant ? `<span class="badge" style="background:#fff4ed; color:#ff4f00; border:1px solid #ff4f00; margin-left:0.35rem; font-size:0.7rem;">Odoo +$${odooVariant.surcharge}</span>` : ''}
          </td>
          <td><span class="label-mono" style="font-size:0.75rem;">${p.type}</span></td>
          <td><strong>$${Number(p.salesPrice).toFixed(2)}</strong></td>
          <td>
            <span class="code-pill">${(p.brandVariants || []).length} variant(s)</span>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderRecentPlans(plans) {
    const tbody = document.getElementById('admin-recent-plans-tbody');
    if (!tbody) return;

    if (!plans.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-muted" style="text-align:center; padding:1.5rem;">No plans configured yet. Click "+ Define Plan" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = plans.map(pl => `
      <tr>
        <td><strong>${pl.name}</strong></td>
        <td><span class="code-pill">${pl.billingFrequency?.toUpperCase()}</span></td>
        <td><strong>$${Number(pl.cost).toFixed(2)}</strong></td>
        <td>${pl.minQuantity || 1} seat(s)</td>
      </tr>
    `).join('');
  },

  // ====================================================
  // 2. PRODUCT CATALOG MANAGEMENT & BRAND VARIANTS
  // ====================================================
  async loadProducts() {
    try {
      const params = {
        page: this.productPage,
        limit: this.productLimit
      };
      if (this.productSearch) params.search = this.productSearch;
      if (this.productType && this.productType !== 'all') params.type = this.productType;

      const res = await API.getAdminProducts(params);
      if (!res || !res.success) return;

      this.currentProducts = res.products || [];
      this.productTotal = res.total || 0;

      this.renderProductsTable();
      this.renderProductsPagination(res.page || 1, res.totalPages || 1, res.total || 0);
    } catch (err) {
      console.warn('Failed to load admin products:', err.message);
    }
  },

  renderProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    if (!this.currentProducts.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center; padding:2rem;">No products found in catalog. Create your first product above.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.currentProducts.map(p => {
      const variants = p.brandVariants || [];
      const hasOdoo = variants.some(v => v.brandName?.toLowerCase().includes('odoo'));

      return `
        <tr>
          <td>
            <div style="font-weight:700; font-size:0.95rem;">${p.name}</div>
            <div class="text-muted" style="font-size:0.8rem;">${p.notes || 'No description notes'}</div>
          </td>
          <td><span class="code-pill">${p.type}</span></td>
          <td>
            <div style="font-weight:800; font-size:1.1rem; color:var(--text-primary);">$${Number(p.salesPrice).toFixed(2)}</div>
            <div class="text-muted" style="font-size:0.75rem;">Cost: $${Number(p.costPrice || 0).toFixed(2)}</div>
          </td>
          <td>
            <div style="display:flex; flex-direction:column; gap:0.25rem;">
              ${variants.map(v => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-subtle); border:1px solid var(--border-subtle); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.785rem; font-family:var(--font-mono);">
                  <span style="font-weight:600;">${v.brandName}</span>
                  <span style="color:${v.surcharge > 0 ? 'var(--accent-primary)' : 'inherit'}; font-weight:700;">
                    ${v.surcharge > 0 ? `+$${v.surcharge} ($${(Number(p.salesPrice) + Number(v.surcharge)).toFixed(2)})` : 'Base ($0)'}
                  </span>
                </div>
              `).join('')}
            </div>
            ${hasOdoo ? `<div style="font-size:0.7rem; color:var(--accent-primary); font-weight:700; margin-top:0.25rem;">⚡ Odoo surcharge +$560 configured</div>` : ''}
          </td>
          <td>
            <span class="badge ${p.isActive ? 'badge-active' : 'badge-closed'}">
              ${p.isActive ? 'Active' : 'Archived'}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="AdminConsole.openEditProductModal('${p._id}')" title="Edit Product & Variants">
                ✏️ Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="AdminConsole.deleteProduct('${p._id}', '${p.name.replace(/'/g, "\\'")}')" title="Archive">
                ✕
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderProductsPagination(currentPage, totalPages, total) {
    const container = document.getElementById('admin-products-pagination');
    if (!container) return;

    if (total === 0) {
      container.innerHTML = '';
      return;
    }

    const startItem = ((currentPage - 1) * this.productLimit) + 1;
    const endItem = Math.min(total, currentPage * this.productLimit);

    container.innerHTML = `
      <div>
        Showing <strong>${startItem} - ${endItem}</strong> of <strong>${total}</strong> products
      </div>
      <div class="pagination-buttons">
        <button class="pagination-btn" ${currentPage <= 1 ? 'disabled' : ''} onclick="AdminConsole.changeProductPage(${currentPage - 1})">
          &laquo; Prev
        </button>
        <span style="padding:0.35rem 0.75rem; font-weight:700;">Page ${currentPage} of ${totalPages}</span>
        <button class="pagination-btn" ${currentPage >= totalPages ? 'disabled' : ''} onclick="AdminConsole.changeProductPage(${currentPage + 1})">
          Next &raquo;
        </button>
      </div>
    `;
  },

  changeProductPage(page) {
    this.productPage = page;
    this.loadProducts();
  },

  openNewProductModal() {
    this.editingProductId = null;
    document.getElementById('admin-prod-modal-title').textContent = 'Create New Catalog Product';
    document.getElementById('admin-prod-form').reset();
    document.getElementById('admin-prod-id').value = '';

    const container = document.getElementById('admin-brand-variants-container');
    container.innerHTML = '';
    this.addBrandVariantRow('Standard Edition', 0);
    this.addBrandVariantRow('Brand: Odoo Integration Edition', 560);

    openModal('admin-product-modal');
  },

  async openEditProductModal(id) {
    try {
      this.editingProductId = id;
      const res = await API.getAdminProduct(id);
      if (!res || !res.success || !res.product) return;
      const p = res.product;

      document.getElementById('admin-prod-modal-title').textContent = `Edit Product: ${p.name}`;
      document.getElementById('admin-prod-id').value = p._id;
      document.getElementById('admin-prod-name-input').value = p.name;
      document.getElementById('admin-prod-type-input').value = p.type || 'Software';
      document.getElementById('admin-prod-sales-input').value = p.salesPrice;
      document.getElementById('admin-prod-cost-input').value = p.costPrice || 0;
      document.getElementById('admin-prod-notes-input').value = p.notes || '';
      document.getElementById('admin-prod-active-input').checked = p.isActive !== false;

      const container = document.getElementById('admin-brand-variants-container');
      container.innerHTML = '';

      const variants = (p.brandVariants && p.brandVariants.length > 0)
        ? p.brandVariants
        : [{ brandName: 'Standard Edition', surcharge: 0 }];

      variants.forEach(v => {
        this.addBrandVariantRow(v.brandName, v.surcharge);
      });

      openModal('admin-product-modal');
    } catch (err) {
      showToast('Failed to load product: ' + err.message, 'error');
    }
  },

  addBrandVariantRow(brandName = '', surcharge = 0) {
    const container = document.getElementById('admin-brand-variants-container');
    if (!container) return;

    const rowId = 'bvr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const div = document.createElement('div');
    div.className = 'brand-variant-row';
    div.id = rowId;

    div.innerHTML = `
      <div>
        <input type="text" class="form-control bv-name-input" placeholder="Brand Name (e.g. Brand: Odoo Edition)" value="${brandName}" required>
      </div>
      <div>
        <div style="display:flex; align-items:center; gap:0.25rem;">
          <span style="font-family:var(--font-mono); font-size:0.85rem;">+$</span>
          <input type="number" step="0.01" min="0" class="form-control bv-surcharge-input" placeholder="0" value="${surcharge}" required oninput="AdminConsole.recalculateVariantPreviews()">
        </div>
      </div>
      <div style="font-family:var(--font-mono); font-size:0.85rem; font-weight:700; color:var(--text-primary);" class="bv-preview-price">
        $0.00
      </div>
      <div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="this.closest('.brand-variant-row').remove(); AdminConsole.recalculateVariantPreviews();" title="Remove variant">✕</button>
      </div>
    `;

    container.appendChild(div);
    this.recalculateVariantPreviews();
  },

  recalculateVariantPreviews() {
    const basePrice = Number(document.getElementById('admin-prod-sales-input')?.value) || 0;
    const rows = document.querySelectorAll('.brand-variant-row');
    rows.forEach(row => {
      const surcharge = Number(row.querySelector('.bv-surcharge-input')?.value) || 0;
      const total = basePrice + surcharge;
      const preview = row.querySelector('.bv-preview-price');
      if (preview) {
        preview.textContent = `$${total.toFixed(2)}`;
        preview.style.color = surcharge > 0 ? 'var(--accent-primary)' : 'inherit';
      }
    });
  },

  async submitProductForm(e) {
    e.preventDefault();

    const id = document.getElementById('admin-prod-id').value;
    const name = document.getElementById('admin-prod-name-input').value.trim();
    const type = document.getElementById('admin-prod-type-input').value;
    const salesPrice = Number(document.getElementById('admin-prod-sales-input').value);
    const costPrice = Number(document.getElementById('admin-prod-cost-input').value) || 0;
    const notes = document.getElementById('admin-prod-notes-input').value.trim();
    const isActive = document.getElementById('admin-prod-active-input').checked;

    if (!name) {
      showToast('Product name is required.', 'error');
      return;
    }
    if (isNaN(salesPrice) || salesPrice < 0) {
      showToast('Sales price must be a non-negative number.', 'error');
      return;
    }
    if (isNaN(costPrice) || costPrice < 0) {
      showToast('Cost price cannot be negative.', 'error');
      return;
    }

    const brandVariants = [];
    const rows = document.querySelectorAll('.brand-variant-row');
    for (const row of rows) {
      const bName = row.querySelector('.bv-name-input').value.trim();
      const surcharge = Number(row.querySelector('.bv-surcharge-input').value);
      if (!bName) {
        showToast('Brand name cannot be empty for any variant.', 'error');
        return;
      }
      if (isNaN(surcharge) || surcharge < 0) {
        showToast(`Surcharge for "${bName}" cannot be negative.`, 'error');
        return;
      }
      brandVariants.push({ brandName: bName, surcharge });
    }

    if (brandVariants.length === 0) {
      brandVariants.push({ brandName: 'Standard Edition', surcharge: 0 });
    }

    const payload = {
      name,
      type,
      salesPrice,
      costPrice,
      notes,
      brandVariants,
      isActive
    };

    try {
      if (id) {
        const res = await API.updateAdminProduct(id, payload);
        showToast(res.message || 'Product updated successfully!', 'success');
      } else {
        const res = await API.createAdminProduct(payload);
        showToast(res.message || 'Product created successfully!', 'success');
      }

      closeModal('admin-product-modal');
      this.loadProducts();
      this.loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to deactivate product "${name}"?`)) return;

    try {
      const res = await API.deleteAdminProduct(id);
      showToast(res.message || 'Product deactivated.', 'info');
      this.loadProducts();
      this.loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // ====================================================
  // 3. SUBSCRIPTION PLAN MANAGEMENT
  // ====================================================
  async loadPlans() {
    try {
      const params = {};
      if (this.planSearch) params.search = this.planSearch;
      if (this.planFrequency && this.planFrequency !== 'all') params.billingFrequency = this.planFrequency;

      const res = await API.getAdminPlans(params);
      if (!res || !res.success) return;

      this.currentPlans = res.plans || [];
      this.renderPlansTable();
    } catch (err) {
      console.warn('Failed to load plans:', err.message);
    }
  },

  renderPlansTable() {
    const tbody = document.getElementById('admin-plans-tbody');
    if (!tbody) return;

    if (!this.currentPlans.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:2rem;">No subscription plans configured yet. Define your first plan above.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.currentPlans.map(pl => {
      const freqColor = pl.billingFrequency === 'yearly' ? 'badge-confirmed' : (pl.billingFrequency === 'monthly' ? 'badge-active' : 'badge-draft');

      return `
        <tr>
          <td>
            <div style="font-weight:700; font-size:0.95rem;">${pl.name}</div>
            <div class="text-muted" style="font-size:0.8rem;">${pl.product ? `Associated: ${pl.product.name}` : 'Universal plan'}</div>
          </td>
          <td><span class="badge ${freqColor}">${pl.billingFrequency.toUpperCase()}</span></td>
          <td>
            <div style="font-weight:800; font-size:1.1rem; color:var(--text-primary);">$${Number(pl.cost).toFixed(2)}</div>
            <div class="text-muted" style="font-size:0.75rem;">per cadence</div>
          </td>
          <td><strong>${pl.minQuantity || 1}</strong> seat(s)</td>
          <td>
            <div style="display:flex; flex-wrap:wrap; gap:0.25rem;">
              <span class="badge ${pl.allowPause ? 'badge-confirmed' : 'badge-draft'}" style="font-size:0.7rem;">Pause: ${pl.allowPause ? 'Yes' : 'No'}</span>
              <span class="badge ${pl.allowEarlyClose ? 'badge-confirmed' : 'badge-draft'}" style="font-size:0.7rem;">Early Close: ${pl.allowEarlyClose ? 'Yes' : 'No'}</span>
              <span class="badge ${pl.allowRenewal ? 'badge-confirmed' : 'badge-draft'}" style="font-size:0.7rem;">Renewal: ${pl.allowRenewal ? 'Yes' : 'No'}</span>
              <span class="badge ${pl.autoCloseOnEnd ? 'badge-closed' : 'badge-draft'}" style="font-size:0.7rem;">Auto-Close: ${pl.autoCloseOnEnd ? 'Yes' : 'No'}</span>
            </div>
          </td>
          <td>
            <span class="badge ${pl.isActive ? 'badge-active' : 'badge-closed'}">
              ${pl.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="AdminConsole.openEditPlanModal('${pl._id}')" title="Edit Plan">
                ✏️ Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="AdminConsole.deletePlan('${pl._id}', '${pl.name.replace(/'/g, "\\'")}')" title="Archive">
                ✕
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openNewPlanModal() {
    this.editingPlanId = null;
    document.getElementById('admin-plan-modal-title').textContent = 'Define Subscription Plan';
    document.getElementById('admin-plan-form').reset();
    document.getElementById('admin-plan-id').value = '';

    this.populatePlanProductSelect();
    openModal('admin-plan-modal');
  },

  populatePlanProductSelect(selectedId = '') {
    const select = document.getElementById('admin-plan-product-select');
    if (!select) return;
    select.innerHTML = '<option value="">-- Universal Plan (No specific product) --</option>' +
      this.currentProducts.map(p => `
        <option value="${p._id}" ${String(p._id) === String(selectedId) ? 'selected' : ''}>
          ${p.name} ($${Number(p.salesPrice).toFixed(2)})
        </option>
      `).join('');
  },

  async openEditPlanModal(id) {
    try {
      this.editingPlanId = id;
      const res = await API.getAdminPlan(id);
      if (!res || !res.success || !res.plan) return;
      const pl = res.plan;

      document.getElementById('admin-plan-modal-title').textContent = `Edit Plan: ${pl.name}`;
      document.getElementById('admin-plan-id').value = pl._id;
      document.getElementById('admin-plan-name-input').value = pl.name;
      document.getElementById('admin-plan-freq-input').value = pl.billingFrequency || 'monthly';
      document.getElementById('admin-plan-cost-input').value = pl.cost;
      document.getElementById('admin-plan-minqty-input').value = pl.minQuantity || 1;

      this.populatePlanProductSelect(pl.productId);

      if (pl.availableFrom) {
        document.getElementById('admin-plan-from-input').value = new Date(pl.availableFrom).toISOString().split('T')[0];
      }
      if (pl.availableTo) {
        document.getElementById('admin-plan-to-input').value = new Date(pl.availableTo).toISOString().split('T')[0];
      }

      document.getElementById('admin-plan-autoclose-input').checked = Boolean(pl.autoCloseOnEnd);
      document.getElementById('admin-plan-earlyclose-input').checked = pl.allowEarlyClose !== false;
      document.getElementById('admin-plan-pause-input').checked = pl.allowPause !== false;
      document.getElementById('admin-plan-renewal-input').checked = pl.allowRenewal !== false;
      document.getElementById('admin-plan-active-input').checked = pl.isActive !== false;

      openModal('admin-plan-modal');
    } catch (err) {
      showToast('Failed to load plan: ' + err.message, 'error');
    }
  },

  async submitPlanForm(e) {
    e.preventDefault();

    const id = document.getElementById('admin-plan-id').value;
    const name = document.getElementById('admin-plan-name-input').value.trim();
    const productId = document.getElementById('admin-plan-product-select').value || null;
    const billingFrequency = document.getElementById('admin-plan-freq-input').value;
    const cost = Number(document.getElementById('admin-plan-cost-input').value);
    const minQuantity = Math.max(1, parseInt(document.getElementById('admin-plan-minqty-input').value, 10) || 1);
    const availableFrom = document.getElementById('admin-plan-from-input').value || null;
    const availableTo = document.getElementById('admin-plan-to-input').value || null;

    const autoCloseOnEnd = document.getElementById('admin-plan-autoclose-input').checked;
    const allowEarlyClose = document.getElementById('admin-plan-earlyclose-input').checked;
    const allowPause = document.getElementById('admin-plan-pause-input').checked;
    const allowRenewal = document.getElementById('admin-plan-renewal-input').checked;
    const isActive = document.getElementById('admin-plan-active-input').checked;

    if (!name) {
      showToast('Plan name is required.', 'error');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      showToast('Plan cost must be a non-negative number.', 'error');
      return;
    }

    const payload = {
      name,
      productId,
      billingFrequency,
      cost,
      minQuantity,
      availableFrom,
      availableTo,
      autoCloseOnEnd,
      allowEarlyClose,
      allowPause,
      allowRenewal,
      isActive
    };

    try {
      if (id) {
        const res = await API.updateAdminPlan(id, payload);
        showToast(res.message || 'Plan updated successfully!', 'success');
      } else {
        const res = await API.createAdminPlan(payload);
        showToast(res.message || 'Plan created successfully!', 'success');
      }

      closeModal('admin-plan-modal');
      this.loadPlans();
      this.loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deletePlan(id, name) {
    if (!confirm(`Are you sure you want to deactivate plan "${name}"?`)) return;

    try {
      const res = await API.deleteAdminPlan(id);
      showToast(res.message || 'Plan deactivated.', 'info');
      this.loadPlans();
      this.loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // ====================================================
  // 4. TAX RULES ENGINE
  // ====================================================
  async loadTaxes() {
    try {
      const res = await API.getAdminTaxes();
      if (!res || !res.success) return;

      this.currentTaxes = res.taxRules || [];
      this.renderTaxesTable();
    } catch (err) {
      console.warn('Failed to load taxes:', err.message);
    }
  },

  renderTaxesTable() {
    const tbody = document.getElementById('admin-taxes-tbody');
    if (!tbody) return;

    if (!this.currentTaxes.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted" style="text-align:center; padding:2rem;">No tax rules configured yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.currentTaxes.map(t => `
      <tr>
        <td>
          <strong>${t.name}</strong>
          ${t.isDefault ? '<span class="badge badge-active" style="margin-left:0.35rem;">Default</span>' : ''}
        </td>
        <td><span class="stat-value" style="font-size:1.25rem; color:var(--text-primary);">${t.rate}%</span></td>
        <td><span class="code-pill">${t.country || 'Global'}</span></td>
        <td><span class="badge badge-draft">${t.taxType || 'VAT'}</span></td>
        <td class="text-muted" style="font-size:0.85rem;">${t.description || '-'}</td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="AdminConsole.openEditTaxModal('${t._id}')" title="Edit Tax Rule">
              ✏️ Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="AdminConsole.deleteTax('${t._id}', '${t.name.replace(/'/g, "\\'")}')" title="Delete">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openNewTaxModal() {
    this.editingTaxId = null;
    document.getElementById('admin-tax-modal-title').textContent = 'Create Tax Rule';
    document.getElementById('admin-tax-form').reset();
    document.getElementById('admin-tax-id').value = '';
    openModal('admin-tax-modal');
  },

  async openEditTaxModal(id) {
    try {
      this.editingTaxId = id;
      const res = await API.getAdminTax(id);
      if (!res || !res.success || !res.rule) return;
      const t = res.rule;

      document.getElementById('admin-tax-modal-title').textContent = `Edit Tax Rule: ${t.name}`;
      document.getElementById('admin-tax-id').value = t._id;
      document.getElementById('admin-tax-name-input').value = t.name;
      document.getElementById('admin-tax-rate-input').value = t.rate;
      document.getElementById('admin-tax-country-input').value = t.country || 'Global';
      document.getElementById('admin-tax-type-input').value = t.taxType || 'VAT';
      document.getElementById('admin-tax-default-input').checked = Boolean(t.isDefault);
      document.getElementById('admin-tax-desc-input').value = t.description || '';

      openModal('admin-tax-modal');
    } catch (err) {
      showToast('Failed to load tax rule: ' + err.message, 'error');
    }
  },

  async submitTaxForm(e) {
    e.preventDefault();

    const id = document.getElementById('admin-tax-id').value;
    const name = document.getElementById('admin-tax-name-input').value.trim();
    const rate = Number(document.getElementById('admin-tax-rate-input').value);
    const country = document.getElementById('admin-tax-country-input').value.trim();
    const taxType = document.getElementById('admin-tax-type-input').value;
    const isDefault = document.getElementById('admin-tax-default-input').checked;
    const description = document.getElementById('admin-tax-desc-input').value.trim();

    if (!name) {
      showToast('Tax rule name is required.', 'error');
      return;
    }
    if (isNaN(rate) || rate < 0 || rate > 100) {
      showToast('Tax rate must be between 0% and 100%.', 'error');
      return;
    }

    const payload = { name, rate, country, taxType, isDefault, description };

    try {
      if (id) {
        const res = await API.updateAdminTax(id, payload);
        showToast(res.message || 'Tax rule updated!', 'success');
      } else {
        const res = await API.createAdminTax(payload);
        showToast(res.message || 'Tax rule created!', 'success');
      }

      closeModal('admin-tax-modal');
      this.loadTaxes();
      this.loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteTax(id, name) {
    if (!confirm(`Delete tax rule "${name}"?`)) return;

    try {
      const res = await API.deleteAdminTax(id);
      showToast(res.message || 'Tax rule deleted.', 'info');
      this.loadTaxes();
      this.loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // ====================================================
  // 5. DISCOUNT RULES ENGINE & LIVE SANDBOX
  // ====================================================
  async loadDiscounts() {
    try {
      const res = await API.getAdminDiscounts();
      if (!res || !res.success) return;

      this.currentDiscounts = res.discounts || [];
      this.renderDiscountsTable();
    } catch (err) {
      console.warn('Failed to load discounts:', err.message);
    }
  },

  renderDiscountsTable() {
    const tbody = document.getElementById('admin-discounts-tbody');
    if (!tbody) return;

    if (!this.currentDiscounts.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align:center; padding:2rem;">No discount rules created yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.currentDiscounts.map(d => `
      <tr>
        <td><strong class="code-pill" style="font-size:0.9rem;">${d.code}</strong></td>
        <td>
          <div style="font-weight:700;">${d.name}</div>
          <div class="text-muted" style="font-size:0.75rem;">${d.appliesTo === 'specific_products' ? 'Specific Products' : 'Whole Contract'}</div>
        </td>
        <td>
          <span style="font-weight:800; color:var(--accent-primary); font-size:1.1rem;">
            ${d.type === 'percentage' ? `${d.value}% Off` : `$${Number(d.value).toFixed(2)} Off`}
          </span>
        </td>
        <td>
          <div style="font-size:0.8rem; font-family:var(--font-mono);">
            Min Qty: <strong>${d.minQuantity || 0}</strong><br>
            Min $: <strong>$${Number(d.minPurchaseAmount || 0).toFixed(2)}</strong>
          </div>
        </td>
        <td>
          <span class="code-pill">${d.usageCount} / ${d.usageLimit || '∞'} used</span>
        </td>
        <td>
          <span class="badge ${d.isActive ? 'badge-active' : 'badge-closed'}">
            ${d.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-secondary btn-sm" onclick="AdminConsole.openEditDiscountModal('${d._id}')" title="Edit Discount">
              ✏️ Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="AdminConsole.deleteDiscount('${d._id}', '${d.code}')" title="Delete">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  openNewDiscountModal() {
    this.editingDiscountId = null;
    document.getElementById('admin-disc-modal-title').textContent = 'Create Discount Rule (Scene 6)';
    document.getElementById('admin-disc-form').reset();
    document.getElementById('admin-disc-id').value = '';
    openModal('admin-discount-modal');
  },

  async openEditDiscountModal(id) {
    try {
      this.editingDiscountId = id;
      const res = await API.getAdminDiscount(id);
      if (!res || !res.success || !res.discount) return;
      const d = res.discount;

      document.getElementById('admin-disc-modal-title').textContent = `Edit Discount Rule: ${d.code}`;
      document.getElementById('admin-disc-id').value = d._id;
      document.getElementById('admin-disc-code-input').value = d.code;
      document.getElementById('admin-disc-name-input').value = d.name;
      document.getElementById('admin-disc-type-input').value = d.type;
      document.getElementById('admin-disc-value-input').value = d.value;
      document.getElementById('admin-disc-minqty-input').value = d.minQuantity || 0;
      document.getElementById('admin-disc-minamt-input').value = d.minPurchaseAmount || 0;
      document.getElementById('admin-disc-limit-input').value = d.usageLimit || 100;

      if (d.startDate) {
        document.getElementById('admin-disc-start-input').value = new Date(d.startDate).toISOString().split('T')[0];
      }
      if (d.endDate) {
        document.getElementById('admin-disc-end-input').value = new Date(d.endDate).toISOString().split('T')[0];
      }

      document.getElementById('admin-disc-active-input').checked = d.isActive !== false;

      openModal('admin-discount-modal');
    } catch (err) {
      showToast('Failed to load discount: ' + err.message, 'error');
    }
  },

  async submitDiscountForm(e) {
    e.preventDefault();

    const id = document.getElementById('admin-disc-id').value;
    const code = document.getElementById('admin-disc-code-input').value.toUpperCase().trim();
    const name = document.getElementById('admin-disc-name-input').value.trim();
    const type = document.getElementById('admin-disc-type-input').value;
    const value = Number(document.getElementById('admin-disc-value-input').value);
    const minQuantity = Math.max(0, parseInt(document.getElementById('admin-disc-minqty-input').value, 10) || 0);
    const minPurchaseAmount = Math.max(0, Number(document.getElementById('admin-disc-minamt-input').value) || 0);
    const usageLimit = Math.max(0, parseInt(document.getElementById('admin-disc-limit-input').value, 10) || 100);
    const startDate = document.getElementById('admin-disc-start-input').value || null;
    const endDate = document.getElementById('admin-disc-end-input').value || null;
    const isActive = document.getElementById('admin-disc-active-input').checked;

    if (!code) {
      showToast('Discount code is required.', 'error');
      return;
    }
    if (!name) {
      showToast('Discount rule name is required.', 'error');
      return;
    }
    if (isNaN(value) || value < 0) {
      showToast('Discount value must be a non-negative number.', 'error');
      return;
    }
    if (type === 'percentage' && value > 100) {
      showToast('Percentage discount cannot exceed 100%.', 'error');
      return;
    }

    const payload = {
      code,
      name,
      type,
      value,
      minQuantity,
      minPurchaseAmount,
      usageLimit,
      startDate,
      endDate,
      isActive
    };

    try {
      if (id) {
        const res = await API.updateAdminDiscount(id, payload);
        showToast(res.message || 'Discount rule updated!', 'success');
      } else {
        const res = await API.createAdminDiscount(payload);
        showToast(res.message || 'Discount rule created!', 'success');
      }

      closeModal('admin-discount-modal');
      this.loadDiscounts();
      this.loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async deleteDiscount(id, code) {
    if (!confirm(`Delete discount rule "${code}"?`)) return;

    try {
      const res = await API.deleteAdminDiscount(id);
      showToast(res.message || 'Discount rule deleted.', 'info');
      this.loadDiscounts();
      this.loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // Live Discount Rule Testing / Sandbox (POST /api/discounts/validate)
  async testLiveDiscount(e) {
    e.preventDefault();
    const code = document.getElementById('test-disc-code').value.trim();
    const subtotal = Number(document.getElementById('test-disc-subtotal').value) || 0;
    const totalQuantity = Number(document.getElementById('test-disc-qty').value) || 1;
    const resultBox = document.getElementById('test-disc-result');

    if (!code) {
      showToast('Please enter a coupon code to test.', 'error');
      return;
    }

    try {
      const res = await API.validateDiscount({ code, subtotal, totalQuantity });
      resultBox.style.display = 'block';
      resultBox.style.background = '#ecfdf5';
      resultBox.style.borderColor = 'var(--success)';
      resultBox.innerHTML = `
        <div style="font-weight:700; color:var(--success);">✅ Rule Evaluated Successfully!</div>
        <div style="font-size:0.9rem; margin-top:0.25rem;">${res.message}</div>
        <div style="margin-top:0.5rem; font-family:var(--font-mono); font-size:0.85rem;">
          Subtotal: $${subtotal.toFixed(2)} &bull; Discount: -$${res.savings.toFixed(2)} &bull; Net: <strong>$${(subtotal - res.savings).toFixed(2)}</strong>
        </div>
      `;
    } catch (err) {
      resultBox.style.display = 'block';
      resultBox.style.background = '#fef2f2';
      resultBox.style.borderColor = 'var(--danger)';
      resultBox.innerHTML = `
        <div style="font-weight:700; color:var(--danger);">❌ Discount Rule Ineligible</div>
        <div style="font-size:0.9rem; margin-top:0.25rem;">${err.message}</div>
      `;
    }
  }
};

window.AdminConsole = AdminConsole;
