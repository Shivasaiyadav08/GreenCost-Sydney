'use client';

import {formatAUD,formatCompactAUD} from '@/lib/format';

/**
 * Cumulative cost of a conventional and a sustainable specification over the
 * study period, with the crossover marked.
 *
 * The curves are fitted to GreenCost's own bundled 40-year sample so the
 * shape matches the model rather than an invented illustration:
 *
 *   conventional(0)  = 750,000   the demo building's stated cost
 *   sustainable(0)   = 762,981   the +12,981 day-one premium
 *   crossover        = year 10
 *   conventional(40) = 961,153
 *   sustainable(40)  = 936,347
 *
 * The difference between the two is a quadratic through (0, +12,981),
 * (10, 0) and (40, -24,806); adding it to a linear conventional curve
 * reproduces all four figures above exactly.
 */

/* The axis spans the stated 40-year study period. Running it to 50 pushed the
   conventional curve past the cost ceiling, so the line left the plot area and
   the shaded band between the two curves broke into an artefact. */
const YEARS = 40;
const COST_MIN = 700_000;
const COST_MAX = 1_000_000;

const PLOT = { left: 46, right: 414, top: 22, bottom: 186 };

/** Difference in cumulative cost, sustainable minus conventional. */
function differenceAt(year: number) {
  return 11.7808 * year * year - 1415.908 * year + 12_981;
}

function conventionalAt(year: number) {
  return 750_000 + 5278.825 * year;
}

function sustainableAt(year: number) {
  return conventionalAt(year) + differenceAt(year);
}

function x(year: number) {
  return PLOT.left + (year / YEARS) * (PLOT.right - PLOT.left);
}

function y(cost: number) {
  const t = (cost - COST_MIN) / (COST_MAX - COST_MIN);
  return PLOT.bottom - t * (PLOT.bottom - PLOT.top);
}

function buildPath(sample: (year: number) => number) {
  const points: string[] = [];
  for (let year = 0; year <= YEARS; year += 1) {
    points.push(`${year === 0 ? 'M' : 'L'}${x(year).toFixed(1)} ${y(sample(year)).toFixed(1)}`);
  }
  return points.join(' ');
}

/* Shade the band between the two curves so the crossing reads at a glance. */
function buildBand() {
  const forward: string[] = [];
  const backward: string[] = [];
  for (let year = 0; year <= YEARS; year += 1) {
    forward.push(`${year === 0 ? 'M' : 'L'}${x(year).toFixed(1)} ${y(conventionalAt(year)).toFixed(1)}`);
  }
  for (let year = YEARS; year >= 0; year -= 1) {
    backward.push(`L${x(year).toFixed(1)} ${y(sustainableAt(year)).toFixed(1)}`);
  }
  return `${forward.join(' ')} ${backward.join(' ')} Z`;
}

const CROSSOVER_YEAR = 10;

export default function PaybackChart() {
  const crossX = x(CROSSOVER_YEAR);
  const crossY = y(conventionalAt(CROSSOVER_YEAR));

  return (
    <figure className="gc-chart">
      <figcaption className="gc-chart-head">
        <span className="gc-chart-title">Cumulative cost over time</span>
        <span className="gc-chart-sub">Sydney courtyard house · 40-year study</span>
        <span className="gc-chart-sub">AUD · vertical axis starts at A$700,000, not zero</span>
      </figcaption>

      <svg
        className="gc-chart-svg"
        viewBox="0 0 440 232"
        role="img"
        aria-label={`Line chart of cumulative cost in Australian dollars. The sustainable specification starts ${formatAUD(12_981)} higher, crosses below the conventional specification in year 10, and finishes ${formatAUD(24_805)} lower over 40 years. The vertical axis starts at ${formatAUD(COST_MIN)}, not zero.`}
      >
        {/* gridlines */}
        {[800_000, 900_000, 1_000_000].map(cost => (
          <g key={cost}>
            <line
              className="gc-chart-grid"
              x1={PLOT.left} x2={PLOT.right}
              y1={y(cost)} y2={y(cost)}
            />
            <text className="gc-chart-axis" x={PLOT.left - 8} y={y(cost) + 3} textAnchor="end">
              {formatCompactAUD(cost)}
            </text>
          </g>
        ))}

        {/* year axis */}
        <line
          className="gc-chart-axis-line"
          x1={PLOT.left} x2={PLOT.right}
          y1={PLOT.bottom} y2={PLOT.bottom}
        />
        {[0, 10, 20, 30, 40].map(year => (
          <text
            key={year}
            className="gc-chart-axis"
            x={x(year)} y={PLOT.bottom + 17}
            textAnchor={year === 0 ? 'start' : year === YEARS ? 'end' : 'middle'}
          >
            {year === 0 ? 'Build' : `${year}y`}
          </text>
        ))}

        {/* the gap between the two specifications */}
        <path className="gc-chart-band" d={buildBand()} />
        <text className="gc-chart-band-label" x={PLOT.right} y={PLOT.bottom - 26} textAnchor="end">
          shaded gap = the difference
        </text>

        <path className="gc-chart-line gc-chart-line--conventional" d={buildPath(conventionalAt)} />
        <path className="gc-chart-line gc-chart-line--sustainable" d={buildPath(sustainableAt)} />

        {/* crossover */}
        <line
          className="gc-chart-crossover"
          x1={crossX} x2={crossX}
          y1={PLOT.top - 4} y2={PLOT.bottom}
        />
        <circle className="gc-chart-dot" cx={crossX} cy={crossY} r={3.5} />
        <text className="gc-chart-flag" x={crossX + 9} y={PLOT.top + 4}>
          Crossover · year 10
        </text>

        {/* End-of-study difference, set below the curves where nothing else
            sits rather than across the sustainable line. */}
        <text className="gc-chart-endpoint" x={PLOT.right} y={PLOT.bottom - 12} textAnchor="end">
          {formatAUD(24_805)} lower by year 40
        </text>
      </svg>

      <ul className="gc-chart-legend">
        <li><i className="gc-key gc-key--conventional"/>Conventional</li>
        <li><i className="gc-key gc-key--sustainable"/>Sustainable</li>
        <li><i className="gc-key gc-key--crossover"/>Break-even in year 10</li>
      </ul>
    </figure>
  );
}
