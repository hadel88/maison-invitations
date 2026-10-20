import React, { useEffect, useRef, useState } from 'react';

// A still render of the actual opening mesh, rather than a different bow image.
export default function RibbonPreview({ className = '' }) {
  const canvas = useRef(null), [ready, setReady] = useState(false);
  useEffect(() => {
    let engine, disposed = false, started = false;
    const observer = new IntersectionObserver(entries => {
      if (started || !entries.some(entry => entry.isIntersecting)) return;
      started = true; observer.disconnect();
      import('./ribbonSatin').then(({ createRibbonRenderer }) => {
        if (disposed) return;
        try { engine = createRibbonRenderer(canvas.current, { static: true, onReady: () => setReady(true), onError: () => setReady(false) }); }
        catch { setReady(false); }
      }).catch(() => setReady(false));
    }, { rootMargin: '150px' });
    observer.observe(canvas.current);
    return () => { disposed = true; observer.disconnect(); engine?.dispose(); };
  }, []);
  return <span className={'ribbon-preview ' + (ready ? 'is-ready ' : '') + className} aria-hidden="true"><img className="ribbon-preview-fallback" src="/atelier-bow.webp" alt=""/><canvas ref={canvas}/></span>;
}
