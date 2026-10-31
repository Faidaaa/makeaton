const { QuotationTemplate, Plan, Product } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const templates = await QuotationTemplate.find({}, { createdAt: -1 });
    const plans = await Plan.find();
    const planMap = {};
    plans.forEach(p => { planMap[String(p._id)] = p; });

    const enriched = templates.map(t => ({
      ...t,
      plan: planMap[String(t.planId)] || null
    }));

    return res.json({ success: true, count: enriched.length, templates: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve templates', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const template = await QuotationTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    const plan = template.planId ? await Plan.findById(template.planId) : null;
    return res.json({ success: true, template: { ...template, plan } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch template', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, planId, validityDays, paymentTerms, lines, notes } = req.body;

    if (!name || !planId) {
      return res.status(400).json({ success: false, message: 'Template name and plan are required.' });
    }

    const template = await QuotationTemplate.create({
      name: name.trim(),
      planId,
      validityDays: Number(validityDays) || 30,
      paymentTerms: paymentTerms || 'Net 30',
      lines: Array.isArray(lines) ? lines : [],
      notes: notes || ''
    });

    return res.status(201).json({
      success: true,
      message: `Quotation template '${template.name}' created with ${template.validityDays}-day validity.`,
      template
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create template', error: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await QuotationTemplate.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete template', error: err.message });
  }
};
