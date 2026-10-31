// Products, Plans, Discounts, Taxes & Staff Management
const Products = {
  currentProducts: [],
  currentPlans: [],
  currentDiscounts: [],
  currentTaxes: [],
  currentStaff: [],

  async load() {
    try {
      const [prodRes, planRes, discRes, taxRes] = await Promise.all([
        API.getProducts(),
        API.getPlans(),
        API.getDiscounts(),
        API.getTaxes()
      ]);

      this.currentProducts = prodRes.products || [];
      this.currentPlans = planRes.plans || [];
      this.currentDiscounts = discRes.discounts || [];
      this.currentTaxes = taxRes.taxRules || [];

      this.renderProducts();
      this.renderPlans();
      this.renderDiscounts();
      this.renderTaxes();

      if (Auth.currentUser?.role === 'admin') {
        this.loadStaff();
      }
    } catch (err) {
      console.error('Failed to load products/plans:', err);
    }
  },

  async loadStaff() {
    try {
      const res = await API.getStaff();
      this.currentStaff = res.staff || [];
      this.renderStaff();
    } catch (err) {
      console.warn('Could not load staff:', err.message);
    }
  },

  renderProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    container.innerHTML = this.currentProducts.map(p => {
      const variants = (p.brandVariants && p.brandVariants.length > 0)
        ? p.brandVariants.map(bv => ({ name: bv.brandName, priceAdjustment: bv.surcharge }))
        : (p.variants || []);

      return `
        <div class="card-box" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
              <div>
                <span class="label-mono" style="color:var(--accent-primary);">${p.type}</span>
                <h3 style="margin-top:0.25rem;">${p.name}</h3>
              </div>
              <div style="text-align:right;">
                <span class="stat-value" style="font-size:1.75rem;">$${p.salesPrice.toFixed(2)}</span>
                <div class="stat-label">Base Price</div>
              </div>
            </div>
            <p class="text-muted" style="font-size:0.9rem; margin-bottom:1rem;">${p.notes || 'Full cloud suite module'}</p>

            <div style="margin-top:1rem; border-top:1px solid var(--border-subtle); padding-top:0.75rem;">
              <div class="label-mono" style="margin-bottom:0.5rem; font-size:0.75rem;">Available Brand Variants</div>
              <div style="display:flex; flex-direction:column; gap:0.35rem;">
                ${variants.map(v => `
                  <div style="display:flex; justify-content:space-between; background:var(--bg-subtle); padding:0.35rem 0.6rem; border-radius:4px; font-size:0.85rem;">
                    <span>${v.name}</span>
                    <strong style="color:${v.priceAdjustment > 0 ? 'var(--accent-primary)' : 'inherit'};">
                      ${v.priceAdjustment > 0 ? `+$${v.surcharge || v.priceAdjustment} ($${(p.salesPrice + (v.surcharge || v.priceAdjustment)).toFixed(2)})` : 'Included'}
                    </strong>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div style="margin-top:1rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle); display:flex; justify-content:flex-end; gap:0.5rem;">
            <button class="btn btn-secondary btn-sm rbac-admin" onclick="AdminConsole.openEditProductModal('${p._id}')">Edit</button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderPlans() {
    const tbody = document.getElementById('plans-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.currentPlans.map(plan => `
      <tr>
        <td><strong>${plan.name}</strong></td>
        <td><span class="code-pill">${plan.billingFrequency.toUpperCase()}</span></td>
        <td><strong>$${plan.cost.toFixed(2)}</strong></td>
        <td>${plan.minQuantity || 1} unit(s)</td>
        <td>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            <span class="badge ${plan.allowPause ? 'badge-confirmed' : 'badge-draft'}">Pause: ${plan.allowPause ? 'Yes' : 'No'}</span>
            <span class="badge ${plan.allowEarlyClose ? 'badge-confirmed' : 'badge-draft'}">Early Close: ${plan.allowEarlyClose ? 'Yes' : 'No'}</span>
            <span class="badge ${plan.allowRenewal ? 'badge-confirmed' : 'badge-draft'}">Renewal: ${plan.allowRenewal ? 'Yes' : 'No'}</span>
            <span class="badge ${plan.autoCloseAtEnd ? 'badge-closed' : 'badge-draft'}">Auto-Close: ${plan.autoCloseAtEnd ? 'Yes' : 'No'}</span>
          </div>
        </td>
      </tr>
    `).join('');
  },

  renderDiscounts() {
    const tbody = document.getElementById('discounts-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.currentDiscounts.map(d => `
      <tr>
        <td><strong class="code-pill">${d.code}</strong></td>
        <td>${d.name}</td>
        <td><strong>${d.type === 'percentage' ? `${d.value}% Off` : `$${d.value} Flat Off`}</strong></td>
        <td>Min Qty: ${d.minQuantity || 0}, Min $: $${d.minPurchaseAmount || 0}</td>
        <td>${d.usageCount} / ${d.usageLimit || '∞'} used</td>
        <td><span class="badge ${d.isActive ? 'badge-active' : 'badge-closed'}">${d.isActive ? 'Active' : 'Expired'}</span></td>
      </tr>
    `).join('');
  },

  renderTaxes() {
    const tbody = document.getElementById('taxes-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.currentTaxes.map(t => `
      <tr>
        <td><strong>${t.name}</strong> ${t.isDefault ? '<span class="badge badge-active">Default</span>' : ''}</td>
        <td><strong>${t.rate}%</strong></td>
        <td>${t.country || 'Global'}</td>
        <td class="text-muted">${t.description || '-'}</td>
      </tr>
    `).join('');
  },

  renderStaff() {
    const tbody = document.getElementById('staff-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.currentStaff.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.email}</td>
        <td><span class="role-badge ${s.role}">${s.role.toUpperCase()}</span></td>
        <td>${s.company || 'Brightloop'}</td>
      </tr>
    `).join('');
  },

  // Modal open helpers
  openNewProductModal() {
    if (window.AdminConsole) AdminConsole.openNewProductModal();
    else openModal('new-product-modal');
  },

  openNewPlanModal() {
    if (window.AdminConsole) AdminConsole.openNewPlanModal();
    else {
      const prodSelect = document.getElementById('plan-product-select');
      if (prodSelect) {
        prodSelect.innerHTML = '<option value="">-- Associate Product (Optional) --</option>' +
          this.currentProducts.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
      }
      openModal('new-plan-modal');
    }
  },

  openNewDiscountModal() {
    if (window.AdminConsole) AdminConsole.openNewDiscountModal();
    else openModal('new-discount-modal');
  },

  openNewTaxModal() {
    if (window.AdminConsole) AdminConsole.openNewTaxModal();
    else openModal('new-tax-modal');
  },

  openNewStaffModal() {
    openModal('new-staff-modal');
  },

  async submitProductForm(e) {
    e.preventDefault();
    const name = document.getElementById('prod-name').value;
    const type = document.getElementById('prod-type').value;
    const salesPrice = document.getElementById('prod-price').value;
    const costPrice = document.getElementById('prod-cost').value;
    const notes = document.getElementById('prod-notes').value;
    const variantName = document.getElementById('prod-var-name').value;
    const variantAdjust = document.getElementById('prod-var-adj').value;

    const variants = [
      { name: 'Standard Edition', priceAdjustment: 0 }
    ];
    if (variantName) {
      variants.push({
        name: variantName,
        priceAdjustment: Number(variantAdjust) || 0
      });
    }

    try {
      const res = await API.createProduct({
        name,
        type,
        salesPrice,
        costPrice,
        notes,
        variants
      });
      showToast(res.message, 'success');
      closeModal('new-product-modal');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async submitPlanForm(e) {
    e.preventDefault();
    const name = document.getElementById('plan-name').value;
    const productId = document.getElementById('plan-product-select').value;
    const billingFrequency = document.getElementById('plan-frequency').value;
    const cost = document.getElementById('plan-cost').value;
    const minQuantity = document.getElementById('plan-min-qty').value;
    const autoCloseAtEnd = document.getElementById('plan-auto-close').checked;
    const allowEarlyClose = document.getElementById('plan-allow-early-close').checked;
    const allowPause = document.getElementById('plan-allow-pause').checked;
    const allowRenewal = document.getElementById('plan-allow-renewal').checked;

    try {
      const res = await API.createPlan({
        name,
        productId,
        billingFrequency,
        cost,
        minQuantity,
        autoCloseAtEnd,
        allowEarlyClose,
        allowPause,
        allowRenewal
      });
      showToast(res.message, 'success');
      closeModal('new-plan-modal');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async submitDiscountForm(e) {
    e.preventDefault();
    const code = document.getElementById('disc-code').value;
    const name = document.getElementById('disc-name').value;
    const type = document.getElementById('disc-type').value;
    const value = document.getElementById('disc-value').value;
    const minQuantity = document.getElementById('disc-min-qty').value;
    const minPurchaseAmount = document.getElementById('disc-min-amt').value;
    const usageLimit = document.getElementById('disc-limit').value;

    try {
      const res = await API.createDiscount({
        code,
        name,
        type,
        value,
        minQuantity,
        minPurchaseAmount,
        usageLimit,
        appliesTo: 'whole_subscription'
      });
      showToast(res.message, 'success');
      closeModal('new-discount-modal');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async submitStaffForm(e) {
    e.preventDefault();
    const name = document.getElementById('staff-name').value;
    const email = document.getElementById('staff-email').value;
    const password = document.getElementById('staff-pwd').value;
    const role = document.getElementById('staff-role').value;
    const company = document.getElementById('staff-company').value;

    try {
      const res = await API.createStaff({
        name,
        email,
        password,
        role,
        company
      });
      showToast(res.message, 'success');
      closeModal('new-staff-modal');
      this.loadStaff();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async submitTaxForm(e) {
    e.preventDefault();
    const name = document.getElementById('tax-name').value;
    const rate = document.getElementById('tax-rate').value;
    const country = document.getElementById('tax-country').value;
    const isDefault = document.getElementById('tax-default').checked;

    try {
      const res = await API.createTax({
        name,
        rate,
        country,
        isDefault
      });
      showToast(res.message, 'success');
      closeModal('new-tax-modal');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};
