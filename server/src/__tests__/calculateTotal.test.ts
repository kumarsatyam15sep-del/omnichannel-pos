import { describe, it, expect } from 'vitest';
import { calculateTotal } from '../utils/calculateTotal';

describe('calculateTotal utility tests', () => {
  // Test 1 - item with no discount
  it('should correctly calculate total for an item with no discount', () => {
    const items = [{ unitPrice: 100, quantity: 2, discount: 0 }];
    const result = calculateTotal(items, 0.18);
    expect(result.subtotal).toBe(200);
    expect(result.tax).toBe(36);
    expect(result.total).toBe(236);
  });

  // Test 2 - item with 10% discount
  it('should correctly calculate total for an item with 10% discount', () => {
    const items = [{ unitPrice: 100, quantity: 2, discount: 10 }];
    const result = calculateTotal(items, 0.18);
    expect(result.subtotal).toBe(180);
    expect(result.tax).toBe(32.4);
    expect(result.total).toBe(212.4);
  });

  // Test 3 - multiple items with different discounts
  it('should correctly calculate total for multiple items with different discounts', () => {
    const items = [
      { unitPrice: 100, quantity: 2, discount: 10 },
      { unitPrice: 50, quantity: 1, discount: 0 }
    ];
    const result = calculateTotal(items, 0.18);
    // Item 1: 100 * 2 * 0.9 = 180
    // Item 2: 50 * 1 = 50
    // Subtotal: 180 + 50 = 230
    // Tax: 230 * 0.18 = 41.4
    // Total: 230 + 41.4 = 271.4
    expect(result.subtotal).toBe(230);
    expect(result.tax).toBe(41.4);
    expect(result.total).toBe(271.4);
  });

  // Test 4 - zero tax rate
  it('should correctly calculate total with zero tax rate', () => {
    const items = [
      { unitPrice: 100, quantity: 2, discount: 10 },
      { unitPrice: 50, quantity: 1, discount: 0 }
    ];
    const result = calculateTotal(items, 0);
    expect(result.subtotal).toBe(230);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(230);
  });
});
