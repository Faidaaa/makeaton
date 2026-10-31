// Subscription Lifecycle & Quotations Management
const Subscriptions = {
  currentList: [],
  productsCache: [],
  plansCache: [],
  customersCache: [],
  templatesCache: [],
  activeLines: [],

  async load() {
    try {
      const statusFilter = document.getElementById('sub-filter-status')?.value || '';
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await API.getSubscriptions(params);
      if (!res.success) return;

      this.currentList = res.subscriptions;
      this.renderTable(this.currentList);
      this.preloadDependencies();
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  },

  async preloadDependencies() {
    try {
      const [prodRes, planRes, custRes, tempRes] = await Promise.all([
        API.getProducts(),
        API.getPlans(),
        API.getCustomers().catch(() => ({ customers: [] })),
        API.getTemplates()
      ]);

      this.productsCache = prodRes.products || [];
      this.plansCache = planRes.plans || [];
      this.customersCache = custRes.customers || [];
      this.templatesCache = tempRes.templates || [];
    } catch (err) {
      console.warn('Preload failed:', err);
    }
  },

  renderTable(subscriptions) {
    const tbody = document.getElementById('subscriptions-tbody');
    if (!tbody) return;

    if (!subscriptions || subscriptions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;" class="text-muted">No subscriptions found matching the filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = subscriptions.map(sub => {
      const statusClass = `badge-${sub.status.toLowerCase()}`;
      return `
        <tr>
          <td><strong class="code-pill">${sub.subscriptionNumber}</strong></td>
          <td>
            <strong>${sub.customer?.name || 'Customer'}</strong>
            <div class="text-muted" style="font-size:0.8rem;">${sub.customer?.company || sub.customer?.email || ''}</div>
          </td>
          <td>${sub.plan?.name || 'Custom Plan'}</td>
          <td>${new Date(sub.startDate).toLocaleDateString()}</td>
          <td><strong>$${sub.totalAmount.toFixed(2)}</strong></td>
          <td><span class="badge ${statusClass}">${sub.status}</span></td>
          <td>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="Subscriptions.viewDetails('${sub._id}')">
                View
              </button>
              ${this.renderActionButtons(sub)}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderActionButtons(sub) {
    const userRole = Auth.currentUser?.role;
    let buttons = '';

    if (sub.status === 'Draft') {
      buttons += `<button class="btn btn-primary btn-sm" onclick="Subscriptions.changeStatus('${sub._id}', 'Quotation', 'Sent quotation to customer')">Send Quote</button>`;
    } else if (sub.status === 'Quotation') {
      buttons += `<button class="btn btn-primary btn-sm" onclick="Subscriptions.changeStatus('${sub._id}', 'Confirmed', 'Customer confirmed terms')">Confirm</button>`;
    } else if (sub.status === 'Confirmed') {
      buttons += `<button class="btn btn-primary btn-sm" onclick="Subscriptions.changeStatus('${sub._id}', 'Active', 'Activated contract')">Activate</button>`;
    } else if (sub.status === 'Active') {
      if (sub.plan?.allowPause) {
        buttons += `<button class="btn btn-secondary btn-sm" onclick="Subscriptions.changeStatus('${sub._id}', 'Paused', 'Temporarily paused')">Pause</button>`;
      }
      if (sub.plan?.allowEarlyClose) {
        buttons += `<button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="Subscriptions.changeStatus('${sub._id}', 'Closed', 'Closed early by request')">Close</button>`;
      }
      if (sub.plan?.allowRenewal) {
        buttons += `<button class="btn btn-blue btn-sm" onclick="Subscriptions.renew('${sub._id}')">Renew</button>`;
      }
    } else if (sub.status === 'Paused') {
      buttons += `<button class="btn btn-primary btn-sm" onclick="Subscriptions.changeStatus('${sub._id}', 'Active', 'Resumed subscription')">Resume</button>`;
    }

    return buttons;
  },

  async changeStatus(id, newStatus, defaultNote = '') {
    const note = prompt(`Enter note for status transition to [${newStatus}]:`, defaultNote);
    if (note === null) return; // cancelled

    try {
      const res = await API.updateSubscriptionStatus(id, newStatus, note);
      showToast(res.message, 'success');
      this.load();
      Dashboard.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async renew(id) {
    if (!confirm('Are you sure you want to renew this subscription for another billing cycle?')) return;
    try {
      const res = await API.renewSubscription(id);
      showToast(res.message, 'success');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async viewDetails(id) {
    try {
      const res = await API.getSubscription(id);
      if (!res.success) return;
      const sub = res.subscription;

      const content = document.getElementById('sub-details-content');
      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
          <div>
            <h3 style="margin-bottom:0.25rem;">${sub.subscriptionNumber}</h3>
            <span class="badge badge-${sub.status.toLowerCase()}">${sub.status}</span>
          </div>
          <div style="text-align:right;">
            <div class="label-mono">Customer</div>
            <strong>${sub.customer?.name}</strong> (${sub.customer?.company || 'N/A'})
            <div class="text-muted" style="font-size:0.85rem;">${sub.customer?.email}</div>
          </div>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom:1.5rem;">
          <div class="stat-card" style="padding:1rem;">
            <div class="stat-value" style="font-size:1.5rem;">$${sub.totalAmount.toFixed(2)}</div>
            <div class="stat-label">Total Amount / Cycle</div>
          </div>
          <div class="stat-card" style="padding:1rem;">
            <div class="stat-value" style="font-size:1.5rem;">${new Date(sub.startDate).toLocaleDateString()}</div>
            <div class="stat-label">Start Date</div>
          </div>
          <div class="stat-card" style="padding:1rem;">
            <div class="stat-value" style="font-size:1.5rem;">${sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'Continuous'}</div>
            <div class="stat-label">Expiry Date</div>
          </div>
        </div>

        <h4 style="margin-bottom:0.75rem;">Product & Service Lines</h4>
        <table class="table-custom" style="margin-bottom:1.5rem;">
          <thead>
            <tr>
              <th>Item / Variant</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Tax</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${sub.lines.map(l => `
              <tr>
                <td><strong>${l.productName}</strong><br><small class="text-muted">${l.variant}</small></td>
                <td>${l.quantity}</td>
                <td>$${l.unitPrice.toFixed(2)}</td>
                <td>${l.taxRate}% ($${l.taxAmount.toFixed(2)})</td>
                <td><strong>$${l.amount.toFixed(2)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${sub.appliedDiscountId ? `
          <div class="callout" style="margin-bottom:1.5rem;">
            <div class="callout-title">Applied Discount</div>
            <div>Saved <strong>$${sub.discountTotal.toFixed(2)}</strong> via discount rule.</div>
          </div>
        ` : ''}

        <h4 style="margin-bottom:0.75rem;">Lifecycle Audit Trail</h4>
        <div style="background:var(--bg-subtle); padding:1rem; border-radius:6px; border:1px solid var(--border-subtle); max-height:180px; overflow-y:auto;">
          ${(sub.statusHistory || []).map(h => `
            <div style="padding:0.4rem 0; border-bottom:1px solid var(--border-subtle); font-size:0.85rem;">
              <strong>[${new Date(h.changedAt).toLocaleString()}]</strong> 
              <span class="badge badge-${h.status.toLowerCase()}" style="font-size:0.7rem; padding:0.1rem 0.4rem;">${h.status}</span> 
              by <em>${h.changedBy}</em>: ${h.note || 'Status updated'}
            </div>
          `).join('')}
        </div>
      `;

      openModal('sub-details-modal');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openNewQuoteModal() {
    this.activeLines = [];
    // Populate customers dropdown
    const custSelect = document.getElementById('quote-customer-select');
    custSelect.innerHTML = '<option value="">-- Choose Customer --</option>' +
      this.customersCache.map(c => `<option value="${c.id}">${c.name} (${c.company || c.email})</option>`).join('');

    // Populate plans dropdown
    const planSelect = document.getElementById('quote-plan-select');
    planSelect.innerHTML = '<option value="">-- Choose Plan --</option>' +
      this.plansCache.map(p => `<option value="${p._id}">${p.name} ($${p.cost}/${p.billingFrequency})</option>`).join('');

    // Populate quotation templates dropdown
    const tempSelect = document.getElementById('quote-template-select');
    tempSelect.innerHTML = '<option value="">-- None (Build Custom) --</option>' +
      this.templatesCache.map(t => `<option value="${t._id}">${t.name} (Valid: ${t.validityDays}d)</option>`).join('');

    // Reset line items
    this.addLineItem();
    this.recalculateTotals();

    openModal('new-quote-modal');
  },

  applyTemplate(templateId) {
    if (!templateId) return;
    const template = this.templatesCache.find(t => t._id === templateId);
    if (!template) return;

    if (template.planId) {
      document.getElementById('quote-plan-select').value = template.planId;
    }
    if (template.paymentTerms) {
      document.getElementById('quote-terms-select').value = template.paymentTerms;
    }

    if (Array.isArray(template.lines) && template.lines.length > 0) {
      this.activeLines = template.lines.map(l => ({
        productId: l.productId,
        productName: l.productName,
        variant: l.variantName || 'Standard Edition',
        quantity: l.quantity || 1,
        unitPrice: l.unitPrice || 0,
        taxRate: l.taxRate || 18
      }));
      this.renderLinesUI();
    }
  },

  addLineItem() {
    const firstProduct = this.productsCache[0];
    this.activeLines.push({
      productId: firstProduct?._id || '',
      productName: firstProduct?.name || 'Standard Product',
      variant: firstProduct?.variants?.[0]?.name || 'Standard',
      quantity: 1,
      unitPrice: firstProduct ? (firstProduct.salesPrice + (firstProduct.variants?.[0]?.priceAdjustment || 0)) : 100,
      taxRate: 18
    });
    this.renderLinesUI();
  },

  removeLineItem(idx) {
    this.activeLines.splice(idx, 1);
    this.renderLinesUI();
  },

  renderLinesUI() {
    const container = document.getElementById('quote-lines-container');
    if (!container) return;

    container.innerHTML = this.activeLines.map((line, idx) => {
      const selectedProduct = this.productsCache.find(p => p._id === line.productId) || this.productsCache[0];
      const variants = selectedProduct?.variants || [{ name: 'Standard Edition', priceAdjustment: 0 }];

      return `
        <div style="display:grid; grid-template-columns: 2fr 2fr 1fr 1.2fr 1fr auto; gap:0.5rem; align-items:center; margin-bottom:0.75rem; background:var(--bg-subtle); padding:0.6rem; border-radius:6px; border:1px solid var(--border-subtle);">
          <div>
            <select class="form-control" style="width:100%;" onchange="Subscriptions.onProductChange(${idx}, this.value)">
              ${this.productsCache.map(p => `<option value="${p._id}" ${p._id === line.productId ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <select class="form-control" style="width:100%;" onchange="Subscriptions.onVariantChange(${idx}, this.value)">
              ${variants.map(v => `<option value="${v.name}" ${v.name === line.variant ? 'selected' : ''}>${v.name} (+${v.priceAdjustment})</option>`).join('')}
            </select>
          </div>
          <div>
            <input type="number" min="1" class="form-control" style="width:100%;" value="${line.quantity}" onchange="Subscriptions.onQtyChange(${idx}, this.value)">
          </div>
          <div>
            <input type="number" step="0.01" class="form-control" style="width:100%;" value="${line.unitPrice}" onchange="Subscriptions.onPriceChange(${idx}, this.value)">
          </div>
          <div>
            <input type="number" step="0.1" class="form-control" style="width:100%;" value="${line.taxRate}" onchange="Subscriptions.onTaxChange(${idx}, this.value)">
          </div>
          <div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="Subscriptions.removeLineItem(${idx})" ${this.activeLines.length <= 1 ? 'disabled' : ''}>✕</button>
          </div>
        </div>
      `;
    }).join('');

    this.recalculateTotals();
  },

  onProductChange(idx, prodId) {
    const prod = this.productsCache.find(p => p._id === prodId);
    if (!prod) return;
    const variant = prod.variants?.[0] || { name: 'Standard', priceAdjustment: 0 };
    this.activeLines[idx].productId = prod._id;
    this.activeLines[idx].productName = prod.name;
    this.activeLines[idx].variant = variant.name;
    this.activeLines[idx].unitPrice = prod.salesPrice + variant.priceAdjustment;
    this.renderLinesUI();
  },

  onVariantChange(idx, variantName) {
    const line = this.activeLines[idx];
    const prod = this.productsCache.find(p => p._id === line.productId);
    const variant = prod?.variants?.find(v => v.name === variantName);
    if (variant) {
      line.variant = variant.name;
      line.unitPrice = prod.salesPrice + (variant.priceAdjustment || 0);
    }
    this.renderLinesUI();
  },

  onQtyChange(idx, qty) {
    this.activeLines[idx].quantity = Math.max(1, Number(qty) || 1);
    this.recalculateTotals();
  },

  onPriceChange(idx, price) {
    this.activeLines[idx].unitPrice = Math.max(0, Number(price) || 0);
    this.recalculateTotals();
  },

  onTaxChange(idx, tax) {
    this.activeLines[idx].taxRate = Math.max(0, Number(tax) || 0);
    this.recalculateTotals();
  },

  async recalculateTotals() {
    let subtotal = 0;
    let taxTotal = 0;
    let totalQty = 0;

    this.activeLines.forEach(l => {
      const lineSub = l.quantity * l.unitPrice;
      const lineTax = (lineSub * l.taxRate) / 100;
      subtotal += lineSub;
      taxTotal += lineTax;
      totalQty += l.quantity;
    });

    // Check discount code if entered
    const code = document.getElementById('quote-discount-code')?.value?.trim();
    let discountAmount = 0;
    const discountNotice = document.getElementById('quote-discount-notice');

    if (code) {
      try {
        const valRes = await API.validateDiscount({
          code,
          subtotal,
          totalQuantity: totalQty
        });
        if (valRes.valid) {
          discountAmount = valRes.savings;
          if (discountNotice) {
            discountNotice.textContent = valRes.message;
            discountNotice.style.display = 'block';
          }
        }
      } catch (err) {
        if (discountNotice) {
          discountNotice.textContent = err.message;
          discountNotice.style.display = 'block';
        }
      }
    } else {
      if (discountNotice) discountNotice.style.display = 'none';
    }

    const netSubtotal = Math.max(0, subtotal - discountAmount);
    const grandTotal = netSubtotal + taxTotal;

    document.getElementById('quote-calc-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('quote-calc-discount').textContent = `-$${discountAmount.toFixed(2)}`;
    document.getElementById('quote-calc-tax').textContent = `$${taxTotal.toFixed(2)}`;
    document.getElementById('quote-calc-total').textContent = `$${grandTotal.toFixed(2)}`;
  },

  async submitQuoteForm(e) {
    e.preventDefault();
    const customerId = document.getElementById('quote-customer-select').value;
    const planId = document.getElementById('quote-plan-select').value;
    const paymentTerms = document.getElementById('quote-terms-select').value;
    const discountCode = document.getElementById('quote-discount-code').value.trim();
    const notes = document.getElementById('quote-notes').value;

    if (!customerId || !planId) {
      showToast('Please select both a Customer and a Plan', 'error');
      return;
    }

    try {
      const res = await API.createSubscription({
        customerId,
        planId,
        paymentTerms,
        discountCode,
        notes,
        lines: this.activeLines
      });

      showToast(res.message, 'success');
      closeModal('new-quote-modal');
      this.load();
      Dashboard.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};
