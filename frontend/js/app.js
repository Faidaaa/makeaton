// Main Application Controller & UI Navigation
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModals();
  Auth.init();
  if (window.AdminConsole) AdminConsole.init();
  refreshCurrentView();
});

function initTabs() {
  const tabLinks = document.querySelectorAll('.nav-link[data-tab]');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = link.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Update nav links
  document.querySelectorAll('.nav-link[data-tab]').forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-tab') === tabName);
  });

  // Update tab sections
  document.querySelectorAll('.tab-section').forEach(sec => {
    sec.style.display = sec.id === `tab-${tabName}` ? 'block' : 'none';
  });

  // Trigger relevant view load
  if (tabName === 'dashboard') Dashboard.load();
  else if (tabName === 'subscriptions') Subscriptions.load();
  else if (tabName === 'billing') Billing.load();
  else if (tabName === 'admin-console') AdminConsole.load();
  else if (tabName === 'catalog') {
    Products.load();
    if (window.AdminConsole) AdminConsole.load();
  }
  else if (tabName === 'customer-portal') Portal.load();
}

function refreshCurrentView() {
  const activeLink = document.querySelector('.nav-link.active[data-tab]');
  const currentTab = activeLink ? activeLink.getAttribute('data-tab') : 'dashboard';
  switchTab(currentTab);
}

// Modal Management
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

function initModals() {
  // Close modal when clicking backdrop or close buttons
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
      });
    }
  });
}

// Reset entire demo data for fresh interactive testing
async function resetDemoData() {
  if (!confirm('Re-seed system with fresh Brightloop demo data?')) return;
  try {
    showToast('Resetting and seeding demo database...', 'info');
    const res = await API.resetDemo();
    showToast(res.message, 'success');
    refreshCurrentView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
