'use client';

import {useEffect, useState} from 'react';

// The live model is a self-contained document (see
// public/greencost-3d-embed.html) so the three.js scene keeps its own orbit,
// zoom and day/night behaviour. Rendering it in an iframe isolates that
// animation loop from the landing page, and the embedded page shows only the
// interactive stage so it fits the panel without a second set of controls.
//
// A separate document cannot read the parent's data-theme attribute, so the
// theme is passed on the query string and the src is rebuilt when the reader
// toggles. The initial value is read from the DOM rather than from React state:
// on first paint the page's own bootstrap may already have resolved a saved or
// system preference, and reading state instead left the panel in the opposite
// palette to the page around it until the reader toggled twice.
function currentTheme(){
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export default function LandingScene(){
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const sync = () => setTheme(currentTheme());
    sync();
    window.addEventListener('greencost-theme-change', sync);
    return () => window.removeEventListener('greencost-theme-change', sync);
  }, []);

  return <iframe
    className="gc-scene-embed"
    // Before the theme is known, the document follows the system preference
    // (its own default), which is the same thing the page bootstrap would pick.
    src={theme ? `/greencost-3d-embed.html?theme=${theme}` : '/greencost-3d-embed.html'}
    title="Interactive 3D model of a Sydney courtyard house"
    loading="lazy"
  />;
}
