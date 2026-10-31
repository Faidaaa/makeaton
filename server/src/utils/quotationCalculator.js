/**
 * Quotation & Subscription Financial Calculation Engine
 * Calculates item totals, taxes, and aggregate amounts with floating-point safety.
 */

export function calculateLineItem({ quantity = 1, unitPrice = 0, taxRate = 0 }) {
  const qty = Math.max(1, Number(quantity) || 1);
  const price = Math.max(0, Number(unitPrice) || 0);
  const rate = Math.max(0, Number(taxRate) || 0);

  const subtotal = Math.round(qty * price * 100) / 100;
  const taxAmount = Math.round(subtotal * (rate / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    quantity: qty,
    unitPrice: price,
    taxRate: rate,
    subtotal,
    taxAmount,
    total
  };
}

export function calculateQuotationTotals(items = [], planPrice = 0, defaultTaxRate = 10) {
  const basePlan = Math.max(0, Number(planPrice) || 0);
  const planTax = Math.round(basePlan * (defaultTaxRate / 100) * 100) / 100;

  let itemsSubtotal = 0;
  let itemsTax = 0;

  const processedItems = items.map((item) => {
    const calc = calculateLineItem({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate !== undefined ? item.taxRate : defaultTaxRate
    });
    itemsSubtotal += calc.subtotal;
    itemsTax += calc.taxAmount;
    return {
      ...item,
      ...calc
    };
  });

  const subtotal = Math.round((basePlan + itemsSubtotal) * 100) / 100;
  const totalTax = Math.round((planTax + itemsTax) * 100) / 100;
  const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

  return {
    items: processedItems,
    planBasePrice: basePlan,
    planTaxAmount: planTax,
    subtotal,
    totalTax,
    grandTotal
  };
}
