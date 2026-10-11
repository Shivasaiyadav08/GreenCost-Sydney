/**
 * Palette for the hero 3D scene.
 *
 * The scene cannot read CSS custom properties directly, so its colours live
 * here instead. They are chosen to sit in the same warm-neutral family as
 * tokens.css — oat ground, bone walls, a forest roof accent — so the render
 * reads as part of the page rather than a picture dropped into it.
 */
export type ScenePalette = {
  skyTop: string;
  skyBottom: string;
  fog: string;
  keyLight: string;
  fillLight: string;
  bounceLight: string;
  ambient: number;
  plot: string;
  lawn: string;
  driveway: string;
  wallPrimary: string;
  wallSecondary: string;
  roof: string;
  roofSolar: string;
  glass: string;
  frame: string;
  panelFace: string;
  panelGrid: string;
  tank: string;
  trunk: string;
  foliageLight: string;
  foliageDark: string;
  road: string;
  roadMark: string;
  vehicle: string;
};

const LIGHT: ScenePalette = {
  skyTop: '#e9eef0',
  skyBottom: '#f5f4f3',
  fog: '#f5f4f3',
  keyLight: '#fff4e0',
  fillLight: '#dce8f2',
  bounceLight: '#8f9a86',
  ambient: 1.05,
  plot: '#cfd4c4',
  lawn: '#d7dcc9',
  driveway: '#e4dccb',
  wallPrimary: '#ece7db',
  wallSecondary: '#f6f2e9',
  roof: '#5c6f5c',
  roofSolar: '#7a8d6a',
  glass: '#48655c',
  frame: '#a8845c',
  panelFace: '#1b3b4d',
  panelGrid: '#7fa6ae',
  tank: '#8c9f8e',
  trunk: '#7d6752',
  foliageLight: '#93a67f',
  foliageDark: '#6c875e',
  road: '#8e938e',
  roadMark: '#d8d5cb',
  vehicle: '#b4553f',
};

/* One palette for the scene, in both page themes.

   The model depicts a building in daylight, so it renders bright whether the
   page around it is light or dark — as on the live site, where a dark page
   still shows a sunlit scene inside the panel. Tying these materials to
   [data-theme] made the model go murky in dark mode while the note cards
   beside it stayed legible, which read as a rendering fault rather than a
   deliberate theme choice.

   The day/night cycle is unaffected: it still runs from this day palette
   toward night, independently of the page. */
export const scenePalette = (): ScenePalette => LIGHT;

/**
 * Sky gradient stops for a given moment in the day cycle.
 * `daylight` runs 0 (night) to 1 (full day).
 */
export function skyAt(palette: ScenePalette, daylight: number): [string, string] {
  return [
    mix(palette.skyTop, '#0d1622', 1 - daylight),
    mix(palette.skyBottom, '#1d2b3c', 1 - daylight),
  ];
}

/** Linear blend between two hex colours. */
export function mix(a: string, b: string, amount: number): string {
  const to = (hex: string) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = to(a);
  const [r2, g2, b2] = to(b);
  const t = Math.max(0, Math.min(1, amount));
  const channel = (x: number, y: number) =>
    Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${channel(r1, r2)}${channel(g1, g2)}${channel(b1, b2)}`;
}