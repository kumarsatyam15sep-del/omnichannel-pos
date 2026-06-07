export interface ITotalItem {
  unitPrice: number;
  quantity: number;
  discount: number;
}

export interface ITotalResult {
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Calculates subtotal, tax, and total for a list of items.
 * Formula:
 * - item total = unitPrice * quantity * (1 - discount / 100)
 * - subtotal = sum of all item totals
 * - tax = subtotal * taxRate
 * - total = subtotal + tax
 * All values are rounded to 2 decimal places.
 * 
 * @param items Array of items containing unitPrice, quantity, and discount (0-100)
 * @param taxRate Decimal representing the tax rate (defaults to 0.18)
 */
export const calculateTotal = (items: ITotalItem[], taxRate: number = 0.18): ITotalResult => {
  let subtotal = 0;

  for (const item of items) {
    const discountFactor = 1 - (item.discount || 0) / 100;
    const itemTotal = item.unitPrice * item.quantity * discountFactor;
    subtotal += itemTotal;
  }

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};
