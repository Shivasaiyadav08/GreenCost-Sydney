/**
 * Pure helpers for the Detailed costs section (Compare page, Step 2).
 *
 * These functions deliberately contain no React and no project state shape of
 * their own: they operate on the values the calculator already receives, so the
 * totals rendered here are always derived from the same numbers sent to the API.
 */
import {formatAUD} from './format';

/** Largest editable amount, matching the inline validation message. */
export const MAX_AMOUNT = 100_000_000;

/**
 * Parse a money string typed or pasted by the user.
 *
 * Accepts `450000`, `450,000`, `$450,000` and `A$450,000`; returns `null` for an
 * empty field, a negative value, or anything that is not a finite number so the
 * caller can show an inline message instead of writing NaN into the project.
 */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/A\$/gi, '').replace(/[$,\s]/g, '');
  if (cleaned === '') return null;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  if (value < 0 || value > MAX_AMOUNT) return null;
  return value;
}

/** Group digits for display inside an input: 450000 -> "450,000". */
export function groupAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '';
  return new Intl.NumberFormat('en-AU', {maximumFractionDigits: 2}).format(value);
}

/** Sum of every itemised row: quantity x unit cost. */
export function itemsSubtotal(rows: {quantity: number; unit_cost: number}[]): number {
  return rows.reduce((sum, row) => sum + row.quantity * row.unit_cost, 0);
}

export type CostTotals = {
  items: number;
  remaining: number;
  total: number;
  /** Remaining scope as a share of the total construction cost, 0-100. */
  remainingPercent: number;
};

/**
 * Live totals for the footer. `total` is itemised costs plus the remaining
 * scope, which is exactly the value the calculator is sent as the construction
 * budget in Detailed costs mode.
 */
export function costTotals(
  rows: {quantity: number; unit_cost: number}[],
  remaining: number | null | undefined,
): CostTotals {
  const items = itemsSubtotal(rows);
  const rest = Number.isFinite(remaining) ? Number(remaining) : 0;
  const total = items + rest;
  const remainingPercent = total > 0 ? (rest / total) * 100 : 0;
  return {items, remaining: rest, total, remainingPercent};
}

export {formatAUD};
