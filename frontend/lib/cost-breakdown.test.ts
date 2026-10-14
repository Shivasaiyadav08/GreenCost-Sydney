import {describe, expect, it} from 'vitest';
import {
  costTotals,
  formatAUD,
  groupAmount,
  itemsSubtotal,
  MAX_AMOUNT,
  parseMoney,
} from './cost-breakdown';

describe('parseMoney', () => {
  it('accepts plain digits', () => {
    expect(parseMoney('450000')).toBe(450000);
  });

  it('accepts grouped digits', () => {
    expect(parseMoney('450,000')).toBe(450000);
  });

  it('accepts a dollar sign', () => {
    expect(parseMoney('$450,000')).toBe(450000);
  });

  it('accepts an A$ prefix', () => {
    expect(parseMoney('A$450,000')).toBe(450000);
  });

  it('accepts surrounding spaces', () => {
    expect(parseMoney(' 450 000 ')).toBe(450000);
  });

  it('treats an empty field as null', () => {
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('   ')).toBeNull();
  });

  it('rejects negatives', () => {
    expect(parseMoney('-1')).toBeNull();
  });

  it('rejects non-numbers', () => {
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('12abc')).toBeNull();
  });

  it('rejects values above the maximum', () => {
    expect(parseMoney(String(MAX_AMOUNT + 1))).toBeNull();
    expect(parseMoney(String(MAX_AMOUNT))).toBe(MAX_AMOUNT);
  });

  it('keeps decimals', () => {
    expect(parseMoney('1234.56')).toBe(1234.56);
  });
});

describe('groupAmount', () => {
  it('groups thousands with a comma', () => {
    expect(groupAmount(450000)).toBe('450,000');
  });

  it('returns an empty string for null and non-finite values', () => {
    expect(groupAmount(null)).toBe('');
    expect(groupAmount(Number.NaN)).toBe('');
  });
});

describe('formatAUD', () => {
  it('always uses the A$ prefix', () => {
    expect(formatAUD(60000)).toBe('A$60,000');
    expect(formatAUD(750000)).toBe('A$750,000');
  });

  it('never shows a bare dollar sign', () => {
    expect(formatAUD(60000).startsWith('A$')).toBe(true);
  });
});

describe('itemsSubtotal', () => {
  it('sums quantity times unit cost', () => {
    expect(itemsSubtotal([
      {quantity: 400, unit_cost: 150},
      {quantity: 100, unit_cost: 450},
    ])).toBe(105000);
  });

  it('is zero for an empty list', () => {
    expect(itemsSubtotal([])).toBe(0);
  });
});

describe('costTotals', () => {
  // The worked example project: six default categories and A$450,000 scope.
  const exampleRows = [
    {quantity: 1, unit_cost: 60000},
    {quantity: 1, unit_cost: 45000},
    {quantity: 1, unit_cost: 37500},
    {quantity: 1, unit_cost: 45000},
    {quantity: 1, unit_cost: 18750},
    {quantity: 1, unit_cost: 93750},
  ];

  it('adds itemised costs and remaining scope to the total', () => {
    const totals = costTotals(exampleRows, 450000);
    expect(totals.items).toBe(300000);
    expect(totals.remaining).toBe(450000);
    expect(totals.total).toBe(750000);
  });

  it('reports remaining scope as a percentage of the total', () => {
    expect(costTotals(exampleRows, 450000).remainingPercent).toBeCloseTo(60, 5);
  });

  it('handles an added item', () => {
    const totals = costTotals([...exampleRows, {quantity: 1, unit_cost: 20000}], 450000);
    expect(totals.items).toBe(320000);
    expect(totals.total).toBe(770000);
  });

  it('handles a removed item', () => {
    const totals = costTotals(exampleRows.slice(1), 450000);
    expect(totals.items).toBe(240000);
    expect(totals.total).toBe(690000);
  });

  it('handles an edited estimate', () => {
    const edited = exampleRows.map((row, index) => (index === 0 ? {...row, unit_cost: 70000} : row));
    const totals = costTotals(edited, 450000);
    expect(totals.items).toBe(310000);
    expect(totals.total).toBe(760000);
  });

  it('handles an empty list with no remaining scope', () => {
    const totals = costTotals([], 0);
    expect(totals.items).toBe(0);
    expect(totals.total).toBe(0);
    expect(totals.remainingPercent).toBe(0);
  });

  it('treats a missing remaining scope as zero', () => {
    expect(costTotals(exampleRows, null).total).toBe(300000);
    expect(costTotals(exampleRows, undefined).total).toBe(300000);
  });
});
