import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function EventTabs({ tabs, value, onChange }) {
  const list = useRef(null), id = useId();
  const [position, setPosition] = useState({ overflow: false, left: false, right: false });
  function measure() {
    const el = list.current;
    if (!el) return;
    const remaining = el.scrollWidth - el.clientWidth;
    const next = { overflow: remaining > 2, left: el.scrollLeft > 2, right: el.scrollLeft < remaining - 2 };
    setPosition(old => old.overflow === next.overflow && old.left === next.left && old.right === next.right ? old : next);
  }
  useEffect(() => {
    const el = list.current, observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const button of el.children) observer.observe(button);
    measure();
    return () => observer.disconnect();
  }, [tabs]);
  useEffect(() => {
    const el = list.current, selected = el.querySelector('[aria-selected="true"]');
    if (selected) {
      const left = selected.offsetLeft, right = left + selected.offsetWidth;
      if (left < el.scrollLeft) el.scrollTo({ left });
      else if (right > el.scrollLeft + el.clientWidth) el.scrollTo({ left: right - el.clientWidth });
    }
  }, [value]);
  function scroll(direction) {
    const el = list.current;
    el.scrollBy({ left: direction * Math.max(140, el.clientWidth * .75), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  return <div className={'ev-tabs-shell' + (position.overflow ? ' has-overflow' : '')}>
    <button type="button" className="ev-tabs-arrow" aria-label="Scroll dashboard tabs left" aria-controls={id} disabled={!position.left} onClick={() => scroll(-1)}><ChevronLeft size={18}/></button>
    <div ref={list} id={id} className="ev-tabs" role="tablist" aria-label="Event dashboard sections" onScroll={measure}>
      {tabs.map(([key, label]) => <button type="button" key={key} role="tab" aria-selected={value === key} className={value === key ? 'selected' : ''} onClick={() => onChange(key)}>{label}</button>)}
    </div>
    <button type="button" className="ev-tabs-arrow" aria-label="Scroll dashboard tabs right" aria-controls={id} disabled={!position.right} onClick={() => scroll(1)}><ChevronRight size={18}/></button>
  </div>;
}
