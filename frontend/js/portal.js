// Customer Self-Service Portal (Scene 2 & Scene 3)
const Portal = {
  mySubscriptions: [],
  myInvoices: [],

  async load() {
    try {
      const [subsRes, invRes] = await Promise.all([
        API.getSubscriptions(),
        API.getInvoices()
      ]);

      this.mySubscriptions = subsRes.subscriptions || [];
      this.myInvoices = invRes.invoices || [];

      this.renderSubscriptions();
      this.renderInvoices();
    } catch (err) {
      console.error('Failed to load customer portal:', err);
    }
  },

  renderSubscriptions() {
    const container = document.getElementById('portal-subs-container');
    if (!container) return;

    if (!this.mySubscriptions || this.mySubscriptions.length === 0) {
      container.innerHTML = `
        <div class="callout" style="text-align:center;">
          <p>You have no subscriptions yet.</p>
          <button class="btn btn-primary" style="margin-top:1rem;" onclick="Subscriptions.openNewQuoteModal()">Explore Plans & Request Quote</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.mySubscriptions.map(sub => {
      const isQuote = sub.status === 'Quotation';
      const isActive = sub.status === 'Active';

      return `
        <div class="card-box" style="margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem;">
            <div>
              <span class="label-mono" style="color:var(--accent-primary);">${sub.subscriptionNumber}</span>
              <h3 style="margin-top:0.25rem;">${sub.plan?.name || 'SaaS Plan'}</h3>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-${sub.status.toLowerCase()}">${sub.status}</span>
              <div style="font-size:1.4rem; font-weight:800; font-family:var(--font-mono); margin-top:0.25rem;">$${sub.totalAmount.toFixed(2)}</div>
            </div>
          </div>

          <div style="margin-bottom:1rem;">
            <div class="label-mono" style="font-size:0.75rem; margin-bottom:0.25rem;">Active Service Items</div>
            <ul style="padding-left:1.25rem; font-size:0.9rem;">
              ${sub.lines.map(l => `<li><strong>${l.productName}</strong> (${l.variant}) × ${l.quantity} unit(s) - $${l.amount.toFixed(2)}</li>`).join('')}
            </ul>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-subtle); padding:0.75rem 1rem; border-radius:6px; border:1px solid var(--border-subtle); flex-wrap:wrap; gap:0.5rem;">
            <div style="font-size:0.85rem;" class="text-muted">
              Start: <strong>${new Date(sub.startDate).toLocaleDateString()}</strong> | 
              Expiry: <strong>${sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString() : 'Auto-renewing'}</strong>
            </div>

            <div style="display:flex; gap:0.5rem;">
              ${isQuote ? `
                <button class="btn btn-primary btn-sm" onclick="Portal.acceptQuotation('${sub._id}')">
                  Accept & Confirm Quotation
                </button>
              ` : ''}

              ${isActive && sub.plan?.allowPause ? `
                <button class="btn btn-secondary btn-sm" onclick="Portal.pauseSubscription('${sub._id}')">
                  Pause
                </button>
              ` : ''}

              ${sub.status === 'Paused' ? `
                <button class="btn btn-primary btn-sm" onclick="Portal.resumeSubscription('${sub._id}')">
                  Resume
                </button>
              ` : ''}

              ${isActive && sub.plan?.allowEarlyClose ? `
                <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="Portal.cancelSubscription('${sub._id}')">
                  Cancel Plan
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderInvoices() {
    const tbody = document.getElementById('portal-invoices-tbody');
    if (!tbody) return;

    if (!this.myInvoices || this.myInvoices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;" class="text-muted">No invoices currently billed.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.myInvoices.map(inv => {
      const isPaid = inv.status === 'Paid';
      const statusClass = inv.isOverdue ? 'badge-overdue' : `badge-${inv.status.toLowerCase()}`;

      return `
        <tr>
          <td><strong class="code-pill">${inv.invoiceNumber}</strong></td>
          <td>${new Date(inv.issueDate).toLocaleDateString()}</td>
          <td>${new Date(inv.dueDate).toLocaleDateString()}</td>
          <td><strong>$${inv.totalAmount.toFixed(2)}</strong></td>
          <td><span class="badge ${statusClass}">${inv.status}</span></td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="Billing.viewInvoice('${inv._id}')">View</button>
              <button class="btn btn-secondary btn-sm" onclick="Billing.printInvoice('${inv._id}')">Print</button>
              ${!isPaid ? `
                <button class="btn btn-blue btn-sm" onclick="Billing.openPaymentModal('${inv._id}', ${inv.amountDue}, '${inv.invoiceNumber}')">
                  Pay Now ($${inv.amountDue.toFixed(2)})
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async acceptQuotation(id) {
    if (!confirm('Accept and sign this quotation?')) return;
    try {
      const res = await API.updateSubscriptionStatus(id, 'Confirmed', 'Customer accepted quote in self-service portal');
      showToast('Quotation successfully accepted! Our team is activating your service.', 'success');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async pauseSubscription(id) {
    if (!confirm('Are you sure you want to pause your subscription?')) return;
    try {
      const res = await API.updateSubscriptionStatus(id, 'Paused', 'Customer paused in self-service portal');
      showToast(res.message, 'info');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async resumeSubscription(id) {
    try {
      const res = await API.updateSubscriptionStatus(id, 'Active', 'Customer resumed in self-service portal');
      showToast('Subscription resumed!', 'success');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async cancelSubscription(id) {
    if (!confirm('Are you sure you want to close this subscription early?')) return;
    try {
      const res = await API.updateSubscriptionStatus(id, 'Closed', 'Customer cancelled early in self-service portal');
      showToast('Subscription closed.', 'info');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};
