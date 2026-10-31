import React, { useState } from 'react';
import Navbar from './components/common/Navbar';
import StaffWorkspace from './pages/StaffWorkspace';
import QuotationList from './pages/QuotationList';
import QuotationBuilder from './pages/QuotationBuilder';
import QuotationDetail from './pages/QuotationDetail';
import SubscriptionList from './pages/SubscriptionList';
import SubscriptionDetail from './pages/SubscriptionDetail';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('workspace');

  // Helper to determine active tab for Navbar
  const getActiveTab = () => {
    if (currentRoute.startsWith('quotation')) return 'quotations';
    if (currentRoute.startsWith('subscription')) return 'subscriptions';
    return 'workspace';
  };

  const handleTabChange = (tabId) => {
    if (tabId === 'workspace') setCurrentRoute('workspace');
    else if (tabId === 'quotations') setCurrentRoute('quotations');
    else if (tabId === 'subscriptions') setCurrentRoute('subscriptions');
  };

  const handleNavigate = (route) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render current view
  const renderContent = () => {
    if (currentRoute === 'workspace') {
      return <StaffWorkspace onNavigate={handleNavigate} />;
    }
    if (currentRoute === 'quotations') {
      return <QuotationList onNavigate={handleNavigate} />;
    }
    if (currentRoute === 'quotation-new') {
      return <QuotationBuilder onNavigate={handleNavigate} />;
    }
    if (currentRoute.startsWith('quotation-detail-')) {
      const quotationId = currentRoute.replace('quotation-detail-', '');
      return <QuotationDetail quotationId={quotationId} onNavigate={handleNavigate} />;
    }
    if (currentRoute === 'subscriptions') {
      return <SubscriptionList onNavigate={handleNavigate} />;
    }
    if (currentRoute.startsWith('subscription-detail-')) {
      const subscriptionId = currentRoute.replace('subscription-detail-', '');
      return <SubscriptionDetail subscriptionId={subscriptionId} onNavigate={handleNavigate} />;
    }
    return <StaffWorkspace onNavigate={handleNavigate} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Navigation Header */}
      <Navbar activeTab={getActiveTab()} onTabChange={handleTabChange} />

      {/* Main Page Content */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {renderContent()}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '2px solid var(--border-strong)',
        backgroundColor: 'var(--bg-surface)',
        padding: '1.25rem 1.5rem',
        marginTop: 'auto'
      }}>
        <div className="bl-container" style={{ padding: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold">BRIGHTLOOP SOFTWARE</span>
            <span className="text-secondary text-xs">·</span>
            <span className="text-secondary text-xs">Subscription Management System</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-secondary">
            <span>STAFF WORKSPACE · QUOTATIONS · LIFECYCLE</span>
            <span>·</span>
            <span>OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
