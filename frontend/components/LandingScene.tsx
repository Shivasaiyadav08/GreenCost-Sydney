'use client';

import {useCallback, useEffect, useRef} from 'react';

// The live model is a self-contained document (see
// public/greencost-3d-embed.html) so the three.js scene keeps its own orbit,
// zoom and day/night behaviour. Rendering it in an iframe isolates that
// animation loop from the landing page, and the embedded page shows only the
// interactive stage so it fits the panel without a second set of controls.
//
// The theme reaches the embedded document by postMessage rather than on the
// query string. Binding it to `src` rebuilt the URL on every toggle, and
// changing src tears the document down and reloads it, so the model vanished
// and rebuilt itself each time the reader switched theme. The src is now fixed
// for the lifetime of the page; the scene is told to restyle instead. The
// initial value rides on the query string so the first paint is already
// correct with no flash.
function currentTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

const INITIAL_SRC = '/greencost-3d-embed.html?theme=' +
  (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export default function LandingScene(){
  const frame = useRef<HTMLIFrameElement>(null);

  const sync = useCallback(() => {
    frame.current?.contentWindow?.postMessage({type: 'greencost-theme', theme: currentTheme()}, '*');
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener('greencost-theme-change', sync);
    return () => window.removeEventListener('greencost-theme-change', sync);
  }, [sync]);

  return <iframe
    ref={frame}
    className="gc-scene-embed"
    src={INITIAL_SRC}
    title="Interactive 3D model of a Sydney courtyard house"
    loading="lazy"
    // A toggle that lands while the frame is still loading would otherwise be
    // lost, so the theme is sent again once the document is ready.
    onLoad={sync}
  />;
}
