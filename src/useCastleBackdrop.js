import { useEffect, useRef } from 'react';

// Preserve the proportions of the artwork when a dashboard tab becomes taller.
export function useCastleBackdrop() {
  const ref = useRef(null);
  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    let frame = 0;
    function fit() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const style = getComputedStyle(card), width = card.getBoundingClientRect().width;
        const phone = matchMedia('(max-width:800px)').matches;
        // Artwork scales with width only. A long task list must never stretch it.
        const head = Math.max(phone ? 88 : 135, Math.ceil(width * (phone ? .23 : .17)));
        const foot = Math.max(45, Math.ceil(width * (phone ? .12 : .08)));
        if (Math.abs(parseFloat(style.paddingTop) - head) > 1) card.style.setProperty('--castle-top', head + 'px');
        if (Math.abs(parseFloat(style.paddingBottom) - foot) > 1) card.style.setProperty('--castle-bottom', foot + 'px');
      });
    }
    const observer = new ResizeObserver(fit);
    observer.observe(card); fit();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return ref;
}
