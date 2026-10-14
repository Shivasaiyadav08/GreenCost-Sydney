'use client';

// The live model is a self-contained document (see
// public/greencost-3d-embed.html) so the three.js scene keeps its own orbit,
// zoom and day/night behaviour. Rendering it in an iframe isolates that
// animation loop from the landing page, and the embedded page shows only the
// interactive stage so it fits the panel without a second set of controls.
export default function LandingScene(){
  return <iframe
    className="gc-scene-embed"
    src="/greencost-3d-embed.html"
    title="Interactive 3D model of a Sydney courtyard house"
    loading="lazy"
  />;
}
