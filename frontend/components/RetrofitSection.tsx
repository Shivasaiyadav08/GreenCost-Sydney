'use client';
import dynamic from 'next/dynamic';

/**
 * Exterior view of a retrofitted home with a readable 2D section fallback.
 *
 * The 3D exterior is the primary view; the 2D section drawing is the fallback
 * so the measures remain clear with or without WebGL.
 */

const RetrofitHouse3D = dynamic(()=>import('./RetrofitHouse3D'), {
  ssr:false,
  loading:()=><SectionDrawing/>,
});

/* House envelope — the original 2D drawing, kept verbatim as the fallback. */
const WALL_LEFT = 60;
const WALL_RIGHT = 220;
const WALL_TOP = 150;
const GROUND = 250;

/* Shed roof falls from the left eave up to the right. */
const ROOF_FROM = { x: 48, y: 150 };
const ROOF_TO = { x: 232, y: 116 };
const roofYAt = (x: number) =>
  ROOF_FROM.y + ((x - ROOF_FROM.x) / (ROOF_TO.x - ROOF_FROM.x)) * (ROOF_TO.y - ROOF_FROM.y);

/* Three panels sitting flat on that slope. */
const PANELS = [72, 112, 152].map(x0 => {
  const x1 = x0;
  const x2 = x0 + 32;
  const lift = 7;
  return `M${x1} ${roofYAt(x1).toFixed(1)} L${x2} ${roofYAt(x2).toFixed(1)} ` +
         `L${x2} ${(roofYAt(x2) - lift).toFixed(1)} L${x1} ${(roofYAt(x1) - lift).toFixed(1)} Z`;
});

const CALLOUTS = [
  { fromX: 192, fromY: roofYAt(192) - 3, labelY: 122, text: 'Roof insulation' },
  { fromX: WALL_RIGHT + 2, fromY: 178, labelY: 160, text: 'Double glazing' },
  { fromX: WALL_RIGHT + 2, fromY: 206, labelY: 186, text: 'Wall insulation' },
  { fromX: 288, fromY: 232, labelY: 236, text: 'Water' },
];

const LABEL_X = 300;

function SectionDrawing() {
  return (
    <svg
      viewBox="0 0 440 300"
      role="img"
      aria-label="Cross-section of a single storey home with a mono-pitch roof carrying a solar array, double glazed windows, wall insulation and a rainwater tank beside it."
    >
      {/* ---- envelope ---- */}
      <path
        className="rs-shell"
        d={`M${WALL_LEFT} ${GROUND} L${WALL_LEFT} ${WALL_TOP} L${ROOF_FROM.x} ${ROOF_FROM.y}`}
      />
      <path
        className="rs-shell"
        d={`M${ROOF_TO.x} ${ROOF_TO.y} L${WALL_RIGHT} ${WALL_TOP} L${WALL_RIGHT} ${GROUND}`}
      />
      <path className="rs-shell" d={`M${ROOF_FROM.x} ${ROOF_FROM.y} L${ROOF_TO.x} ${ROOF_TO.y}`} />

      {/* ---- solar array ---- */}
      <g className="rs-panel">
        {PANELS.map(d => <path key={d.slice(0, 8)} d={d}/>)}
      </g>

      {/* ---- double glazing ---- */}
      <g className="rs-glass">
        <rect x="78" y="164" width="56" height="28"/>
        <rect x="162" y="164" width="42" height="28"/>
        <rect x="162" y="210" width="42" height="28"/>
      </g>

      {/* ---- rainwater tank ---- */}
      <rect className="rs-tank" x="250" y="212" width="38" height="38" rx="3"/>

      {/* ---- ground ---- */}
      <line className="rs-ground" x1="26" y1={GROUND} x2="248" y2={GROUND}/>
      <g className="rs-hatch">
        {Array.from({length: 12}, (_, i) => (
          <line key={i} x1={28 + i * 19} y1={GROUND} x2={21 + i * 19} y2={GROUND + 9}/>
        ))}
      </g>

      {/* ---- callouts, all running right into clear space ---- */}
      {CALLOUTS.map(c => (
        <g key={c.text} className="rs-callout">
          <line x1={c.fromX} y1={c.fromY} x2={LABEL_X - 6} y2={c.labelY}/>
          <circle cx={c.fromX} cy={c.fromY} r="2.5"/>
          <text x={LABEL_X} y={c.labelY + 3.5}>{c.text}</text>
        </g>
      ))}
    </svg>
  );
}

export default function RetrofitSection() {
  return (
    <figure className="gc-section-diagram">
      <RetrofitHouse3D fallback={<SectionDrawing/>} />

      <figcaption className="gc-section-diagram-note">
        The measures behind every comparison
      </figcaption>
    </figure>
  );
}
