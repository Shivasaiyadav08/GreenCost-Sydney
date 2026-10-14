/** Display money unambiguously as Australian dollars. */
export function formatAUD(value: number, maximumFractionDigits = 0): string {
  if (!Number.isFinite(value)) return 'A$—';
  const sign = value < 0 ? '−' : '';
  const amount = new Intl.NumberFormat('en-AU', {maximumFractionDigits}).format(Math.abs(value));
  return `${sign}A$${amount}`;
}

/** Compact Australian-dollar labels for chart axes and other tight spaces. */
export function formatCompactAUD(value: number): string {
  if (!Number.isFinite(value)) return 'A$—';
  const sign = value < 0 ? '−' : '';
  const amount = new Intl.NumberFormat('en-AU', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.abs(value));
  return `${sign}A$${amount}`;
}

/** Format a water volume in the single unit used throughout GreenCost. */
export function formatWaterVolume(litres: number, period = 'year'): string {
  if (!Number.isFinite(litres)) return `— million litres/${period}`;

  const millions = litres / 1_000_000;
  const absoluteMillions = Math.abs(millions);
  // Retain enough precision for small, non-zero quantities so they never
  // disappear as "0 million litres".
  const maximumFractionDigits = absoluteMillions > 0 && absoluteMillions < 0.005
    ? Math.min(100, Math.max(2, Math.ceil(-Math.log10(absoluteMillions)) + 1))
    : 2;
  const formatted = new Intl.NumberFormat('en-AU', {maximumFractionDigits}).format(millions);
  const amount = millions !== 0 && Number(formatted.replaceAll(',', '')) === 0
    ? new Intl.NumberFormat('en-AU', {notation:'scientific',maximumSignificantDigits:2}).format(millions)
    : formatted;
  return `${amount} million litres/${period}`;
}

/** Australian display for saved source dates such as 2026-06-30. */
export function formatAustralianDate(value: string | null | undefined): string {
  if (!value) return 'Date not stated';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item=>item.type===type)?.value??'';
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month=months[Number(part('month'))-1];
  return month?`${part('day')} ${month} ${part('year')}`:value;
}

export function formatArea(value: number, maximumFractionDigits = 1): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat('en-AU', {maximumFractionDigits}).format(value)
    : '—';
}
