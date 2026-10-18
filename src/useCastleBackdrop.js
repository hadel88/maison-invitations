import { useEffect, useRef } from 'react';

// Keep content inside the blank area of the one-piece background on every tab.
export function useCastleBackdrop() {
  const ref = useRef(null);
  useEffect(() => {
    const card = ref.current;
    if (!card) return;
    let frame = 0;
    function fit() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const style = getComputedStyle(card), box = card.getBoundingClientRect();
        const content = Math.max(0, box.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
        const phone = matchMedia('(max-width:800px)').matches, top = phone ? .145 : .235, bottom = phone ? .07 : .10;
        const height = content / (1 - top - bottom);
        const head = Math.max(phone ? 100 : 150, Math.ceil(height * top));
        const foot = Math.max(55, Math.ceil(height * bottom));
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
