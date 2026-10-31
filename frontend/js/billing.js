// Invoicing, Billing Day Automation, & Payment Processing
const Billing = {
  currentInvoices: [],

  async load() {
    try {
      const statusFilter = document.getElementById('inv-filter-status')?.value || '';
      const params = {};
      if (statusFilter === 'overdue') {
        params.overdue = 'true';
      } else if (statusFilter) {
        params.status = statusFilter;
      }

      const res = await API.getInvoices(params);
      if (!res.success) return;

      this.currentInvoices = res.invoices;
      this.renderTable(this.currentInvoices);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    }
  },

  renderTable(invoices) {
    const tbody = document.getElementById('invoices-tbody');
    if (!tbody) return;

    if (!invoices || invoices.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;" class="text-muted">No invoices found matching criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = invoices.map(inv => {
      const statusClass = inv.isOverdue ? 'badge-overdue' : `badge-${inv.status.toLowerCase()}`;
      const statusLabel = inv.isOverdue ? 'OVERDUE' : inv.status;

      return `
        <tr>
          <td><strong class="code-pill">${inv.invoiceNumber}</strong></td>
          <td>
            <strong>${inv.customer?.name || 'Customer'}</strong>
            <div class="text-muted" style="font-size:0.8rem;">${inv.customer?.company || ''}</div>
          </td>
          <td>${new Date(inv.issueDate).toLocaleDateString()}</td>
          <td>${new Date(inv.dueDate).toLocaleDateString()}</td>
          <td>$${inv.totalAmount.toFixed(2)}</td>
          <td><strong style="color:${inv.amountDue > 0 ? 'var(--danger)' : 'var(--success)'};">$${inv.amountDue.toFixed(2)}</strong></td>
          <td><span class="badge ${statusClass}">${statusLabel}</span></td>
          <td>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="Billing.viewInvoice('${inv._id}')">
                Details
              </button>
              <button class="btn btn-secondary btn-sm" onclick="Billing.printInvoice('${inv._id}')">
                Print
              </button>
              ${this.renderActionButtons(inv)}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderActionButtons(inv) {
    let buttons = '';

    if (inv.status === 'Draft') {
      buttons += `<button class="btn btn-primary btn-sm" onclick="Billing.confirmInvoice('${inv._id}')">Confirm</button>`;
    } else if (inv.status === 'Confirmed' || inv.amountDue > 0) {
      buttons += `<button class="btn btn-blue btn-sm" onclick="Billing.openPaymentModal('${inv._id}', ${inv.amountDue}, '${inv.invoiceNumber}')">Pay</button>`;
      buttons += `<button class="btn btn-secondary btn-sm" onclick="Billing.sendInvoice('${inv._id}')">Send</button>`;
    }

    return buttons;
  },

  async runBillingDay() {
    if (!confirm('Run Automated Billing Day?\n\nThis will scan all active subscriptions, automatically calculate taxes and discounts, and generate draft invoices for due cycles while preventing duplicate billings.')) {
      return;
    }

    try {
      showToast('Processing Billing Day cycle...', 'info');
      const res = await API.runBillingDay();

      const summaryMsg = `Billing Day Complete!\nGenerated: ${res.generatedCount} invoice(s)\nSkipped: ${res.skippedCount} (already billed / protected against duplication)`;
      showToast(summaryMsg, 'success');
      
      this.load();
      Dashboard.load();
      Subscriptions.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async confirmInvoice(id) {
    try {
      const res = await API.updateInvoiceStatus(id, 'Confirmed', 'Confirmed by billing manager');
      showToast(res.message, 'success');
      this.load();
      Dashboard.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async sendInvoice(id) {
    try {
      const res = await API.sendInvoice(id);
      showToast(res.message, 'success');
      this.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async chaseInvoice(id, customerName) {
    try {
      const res = await API.sendInvoice(id);
      showToast(`Payment reminder and statement sent to ${customerName || 'customer'}!`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async viewInvoice(id) {
    try {
      const res = await API.getInvoice(id);
      if (!res.success) return;
      const inv = res.invoice;

      const content = document.getElementById('invoice-details-content');
      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; border-bottom:2px solid var(--border-strong); padding-bottom:1rem;">
          <div>
            <div class="label-mono" style="color:var(--accent-primary);">Brightloop Software Invoice</div>
            <h2>${inv.invoiceNumber}</h2>
            <span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span>
          </div>
          <div style="text-align:right;">
            <div class="label-mono">Billed To</div>
            <strong>${inv.customer?.name}</strong>
            <div>${inv.customer?.company || ''}</div>
            <div class="text-muted">${inv.customer?.email}</div>
          </div>
        </div>

        <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom:1.5rem;">
          <div class="stat-card" style="padding:0.9rem;">
            <div class="stat-value" style="font-size:1.4rem;">${new Date(inv.issueDate).toLocaleDateString()}</div>
            <div class="stat-label">Issue Date</div>
          </div>
          <div class="stat-card" style="padding:0.9rem;">
            <div class="stat-value" style="font-size:1.4rem;">${new Date(inv.dueDate).toLocaleDateString()}</div>
            <div class="stat-label">Due Date</div>
          </div>
          <div class="stat-card" style="padding:0.9rem;">
            <div class="stat-value" style="font-size:1.4rem;">$${inv.totalAmount.toFixed(2)}</div>
            <div class="stat-label">Total Billed</div>
          </div>
          <div class="stat-card" style="padding:0.9rem;">
            <div class="stat-value" style="font-size:1.4rem; color:${inv.amountDue > 0 ? 'var(--danger)' : 'var(--success)'};">$${inv.amountDue.toFixed(2)}</div>
            <div class="stat-label">Amount Due</div>
          </div>
        </div>

        <h4 style="margin-bottom:0.75rem;">Invoice Line Items</h4>
        <table class="table-custom" style="margin-bottom:1.5rem;">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Tax</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${inv.lines.map(l => `
              <tr>
                <td><strong>${l.description}</strong></td>
                <td>${l.quantity}</td>
                <td>$${l.unitPrice.toFixed(2)}</td>
                <td>$${(l.taxAmount || 0).toFixed(2)} (${l.taxRate}%)</td>
                <td>-$${(l.discountAmount || 0).toFixed(2)}</td>
                <td><strong>$${l.total.toFixed(2)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
          <div style="width:280px; background:var(--bg-subtle); padding:1rem; border-radius:6px; border:2px solid var(--border-strong);">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
              <span>Subtotal:</span>
              <strong>$${(inv.subtotal || 0).toFixed(2)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
              <span>Discount Applied:</span>
              <strong style="color:var(--success);">-$${(inv.discountAmount || 0).toFixed(2)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
              <span>Taxes:</span>
              <strong>$${(inv.taxAmount || 0).toFixed(2)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:2px solid var(--border-strong); padding-top:0.5rem; font-size:1.1rem;">
              <strong>Grand Total:</strong>
              <strong>$${inv.totalAmount.toFixed(2)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:0.4rem; color:var(--text-secondary);">
              <span>Amount Paid:</span>
              <span>$${(inv.amountPaid || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <h4 style="margin-bottom:0.75rem;">Payment History</h4>
        ${inv.payments && inv.payments.length > 0 ? `
          <table class="table-custom">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Method</th>
                <th>Date</th>
                <th>Reference</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${inv.payments.map(p => `
                <tr>
                  <td><span class="code-pill">${p.paymentNumber}</span></td>
                  <td>${p.paymentMethod}</td>
                  <td>${new Date(p.paymentDate).toLocaleDateString()}</td>
                  <td>${p.reference || '-'}</td>
                  <td><strong style="color:var(--success);">$${p.amount.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="text-muted">No payments recorded yet for this invoice.</p>'}
      `;

      openModal('invoice-details-modal');
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  printInvoice(id) {
    window.open(`/print-invoice.html?id=${id}`, '_blank');
  },

  openPaymentModal(invoiceId, dueAmount, invoiceNumber) {
    document.getElementById('pay-invoice-id').value = invoiceId;
    document.getElementById('pay-invoice-num-display').textContent = invoiceNumber;
    document.getElementById('pay-amount-input').value = dueAmount;
    document.getElementById('pay-amount-input').max = dueAmount;
    openModal('record-payment-modal');
  },

  async submitPaymentForm(e) {
    e.preventDefault();
    const invoiceId = document.getElementById('pay-invoice-id').value;
    const amount = document.getElementById('pay-amount-input').value;
    const paymentMethod = document.getElementById('pay-method-select').value;
    const reference = document.getElementById('pay-ref-input').value;
    const note = document.getElementById('pay-note-input').value;

    try {
      const res = await API.recordPayment({
        invoiceId,
        amount,
        paymentMethod,
        reference,
        note
      });

      showToast(res.message, 'success');
      closeModal('record-payment-modal');
      this.load();
      Dashboard.load();
      Portal.load();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};
