import express from 'express';

const router = express.Router();

/**
 * Shared Catalog Mock Data
 * Represents data owned by Member 2 (Products, Plans, Taxes, Customers).
 * Once Member 2 finishes their endpoints, these will simply forward or be replaced.
 */

const CUSTOMERS = [
  { id: 'cust_101', name: 'Acme Technologies Inc.', email: 'billing@acme.com', company: 'Acme Corp', taxId: 'TAX-US-9912' },
  { id: 'cust_102', name: 'Nexus Digital Agency', email: 'accounts@nexusdigital.io', company: 'Nexus Digital', taxId: 'TAX-UK-4410' },
  { id: 'cust_103', name: 'Solaris Cloud Labs', email: 'finance@solaris.dev', company: 'Solaris Labs', taxId: 'TAX-CA-1123' },
  { id: 'cust_104', name: 'Vertex Financial Group', email: 'ops@vertexfin.com', company: 'Vertex Group', taxId: 'TAX-IN-5501' }
];

const PLANS = [
  { id: 'plan_starter', name: 'Starter Tier', billingFrequency: 'Monthly', basePrice: 49, maxUsers: 5 },
  { id: 'plan_growth', name: 'Growth Tier', billingFrequency: 'Monthly', basePrice: 199, maxUsers: 25 },
  { id: 'plan_enterprise', name: 'Enterprise Elite', billingFrequency: 'Annual', basePrice: 1200, maxUsers: 100 }
];

const PRODUCTS = [
  { id: 'prod_api_seats', name: 'Additional API Seats (Pack of 5)', unitPrice: 25, category: 'Add-on', description: 'Additional API seat licenses' },
  { id: 'prod_priority_support', name: '24/7 Priority SLA Support', unitPrice: 150, category: 'Service', description: 'Dedicated response within 1 hour' },
  { id: 'prod_storage_tb', name: 'Dedicated Cloud Storage (1 TB)', unitPrice: 80, category: 'Infrastructure', description: 'Encrypted multi-region storage block' },
  { id: 'prod_audit_logs', name: 'Advanced Compliance Audit Logs', unitPrice: 120, category: 'Security', description: '1-year retention tamper-proof audit trail' }
];

const TAX_RULES = [
  { region: 'Default Standard', rate: 10 },
  { region: 'US State Sales Tax', rate: 8.5 },
  { region: 'EU VAT', rate: 20 },
  { region: 'GST India', rate: 18 }
];

// Endpoints
router.get('/customers', (req, res) => res.json({ success: true, data: CUSTOMERS }));
router.get('/plans', (req, res) => res.json({ success: true, data: PLANS }));
router.get('/products', (req, res) => res.json({ success: true, data: PRODUCTS }));
router.get('/taxes', (req, res) => res.json({ success: true, data: TAX_RULES }));

export default router;
export { CUSTOMERS, PLANS, PRODUCTS, TAX_RULES };
