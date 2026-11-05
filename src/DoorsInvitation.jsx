import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, RotateCcw } from 'lucide-react';
import { ensureFont } from './fonts';
import { dateLabel } from './catalog';
import './doors.css';

// "The Ivory Doors": two solid carved ivory doors tied with a satin bow. One tap: the bow loosens and
// falls, the doors swing open towards the guest, light pours out, the view moves into the flower arch
// and the invitation appears inside it. Pictures made with ChatGPT for Maison (doors-closed / doors-open).
// Doors: doorsGL (three.js, real thickness and relief). Bow: ribbonGL. One clock drives everything.

const words = {
  en: { open: 'Tap to open', invited: 'TOGETHER WITH THEIR FAMILIES', celebrate: 'request the pleasure of your company', scroll: 'Scroll to discover', replay: 'Open again', for: 'For ' },
  de: { open: 'Zum Öffnen tippen', invited: 'GEMEINSAM MIT IHREN FAMILIEN', celebrate: 'freuen sich, euch einzuladen', scroll: 'Nach unten entdecken', replay: 'Erneut öffnen', for: 'Für ' },
  fr: { open: 'Touchez pour ouvrir', invited: 'AVEC LEURS FAMILLES', celebrate: 'ont le plaisir de vous inviter', scroll: 'Faites défiler pour découvrir', replay: 'Ouvrir à nouveau', for: 'Pour ' },
};

const clamp = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const out = (x) => 1 - Math.pow(1 - clamp(x), 3);
const span = (t, a, b) => (t - a) / (b - a);
const DOORS_AT = 2.8, END = 7.6;

// every value of the scene at time t (seconds since the tap)
export function doorsFrame(t) {
  const open = ease(span(t, DOORS_AT, DOORS_AT + 3.2));
  const push = out(span(t, DOORS_AT, DOORS_AT + 3.6));
  const light = clamp(span(t, DOORS_AT + 0.2, DOORS_AT + 1.4)) * (1 - 0.45 * clamp(span(t, DOORS_AT + 1.8, DOORS_AT + 3.4)));
  return {
    angle: 100 * open, doorScale: 1 + 0.22 * push, insideScale: 1.02 + 0.06 * push, bright: 0.82 + 0.18 * push,
    light, ribbon: 1 - clamp(span(t, DOORS_AT + 0.4, DOORS_AT + 1.1)),
    card: [0, 0.25, 0.55, 0.85, 0.85, 0.85].map((d) => out(span(t, DOORS_AT + 2.0 + d, DOORS_AT + 3.4 + d))),
    dust: clamp(span(t, DOORS_AT + 0.2, DOORS_AT + 4.4)),
  };
}

export function DoorsStage({ event, guest, opened, onOpen, onReplay, lang = 'en' }) {
  const c = words[lang] || words.en;
  const [phase, setPhase] = useState('closed'); // closed → opening → open
  const [solid, setSolid] = useState(false);
  const stage = useRef(null), canvas = useRef(null), ribbon = useRef(null), raf = useRef(0), doorsCanvas = useRef(null), doors = useRef(null);
  const font = ensureFont(event.font && event.font !== 'classic' ? event.font : 'vibes');
  const names = String(event.names || '').split(/\s*&\s*/);

  useEffect(() => {
    let dead = false;
    paint(0);
    import('./ribbonGL').then(({ createRibbonRenderer }) => {
      if (dead || !canvas.current) return;
      try { ribbon.current = createRibbonRenderer(canvas.current, { texture: '/doors-bow.webp', tint: [0.95, 0.91, 0.82], sheen: [1, 0.95, 0.86], distance: 1.45 }); } catch { /* no WebGL: no bow */ }
    }).catch(() => {});
    import('./doorsGL').then(({ createDoors }) => {
      if (dead || !doorsCanvas.current) return;
      try { doors.current = createDoors(doorsCanvas.current, { onReady: () => { if (!dead) { setSolid(true); paint(0); } } }); } catch { /* no WebGL: flat doors */ }
    }).catch(() => {});
    return () => { dead = true; cancelAnimationFrame(raf.current); ribbon.current?.dispose(); doors.current?.dispose(); };
  }, []);

  // the guest page decides when the invitation is open (tap) or closed again (replay)
  useEffect(() => {
    if (opened && phase === 'closed') play();
    if (!opened && phase !== 'closed') { cancelAnimationFrame(raf.current); ribbon.current?.reset(); paint(0); setPhase('closed'); }
  }, [opened]);

  function paint(t) {
    const el = stage.current; if (!el) return;
    const f = doorsFrame(t), s = el.style;
    s.setProperty('--angle', f.angle + 'deg'); s.setProperty('--door-scale', f.doorScale);
    s.setProperty('--inside-scale', f.insideScale); s.setProperty('--bright', f.bright); s.setProperty('--light', f.light);
    s.setProperty('--ribbon', f.ribbon); s.setProperty('--dust', f.dust);
    f.card.forEach((v, i) => s.setProperty('--c' + i, v));
    doors.current?.at(f.angle, f.doorScale);
  }

  function play() {
    setPhase('opening');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { paint(END); setPhase('open'); return; }
    const skip = ribbon.current ? 0 : DOORS_AT - 0.2; // without the bow, go straight to the doors
    let start = null, told = false;
    const tick = (now) => {
      if (start === null) start = now;
      const t = (now - start) / 1000 + skip;
      paint(t); ribbon.current?.at?.(t); // the bow follows the same clock
      if (!told && t > DOORS_AT + 2.2) { told = true; setPhase('open'); }
      if (t < END) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  return <section ref={stage} className={'dr-stage is-' + phase + (solid ? ' dr-solid' : '')} aria-label={(event.names || '') + ' invitation'}>
    <div className="dr-phone">
      <div className="dr-frame" onClick={() => !opened && onOpen()}>
        <div className="dr-inside">
          <div className="dr-light" aria-hidden="true" />
          <div className="dr-card">
            <span className="dr-kicker" style={{ '--c': 'var(--c0)' }}>{guest?.name ? (c.for + guest.name).toUpperCase() : c.invited}</span>
            <h1 style={{ fontFamily: font.family, '--c': 'var(--c1)' }}>{names.map((n, i) => <React.Fragment key={i}>{i > 0 && <em>&amp;</em>}<span>{n}</span></React.Fragment>)}</h1>
            <p className="dr-line" style={{ '--c': 'var(--c2)' }}>{event.subtitle || c.celebrate}</p>
            <span className="dr-rule" aria-hidden="true" style={{ '--c': 'var(--c3)' }} />
            <p className="dr-date" style={{ '--c': 'var(--c3)' }}>{dateLabel(event.date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{event.time ? ' · ' + event.time : ''}</p>
            <p className="dr-venue" style={{ '--c': 'var(--c4)' }}>{event.venue}{event.address ? <small>{event.address}</small> : null}</p>
          </div>
        </div>
        <div className="dr-doors" aria-hidden="true">
          <div className="dr-leaf dr-left"><i /></div>
          <div className="dr-leaf dr-right"><i /></div>
        </div>
        <div className="dr-sparkles" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <b key={i} style={{ '--i': i }} />)}</div>
      </div>
      <canvas ref={doorsCanvas} className="dr-doors-gl" aria-hidden="true" />
      <canvas ref={canvas} className="dr-ribbon" aria-hidden="true" />
      {!opened && <button className="dr-open" onClick={onOpen}>{c.open}</button>}
      {phase === 'open' && <>
        <button className="dr-replay" onClick={() => { onReplay(); stage.current?.closest('.guest-experience')?.scrollTo({ top: 0, behavior: 'instant' }); }} aria-label={c.replay}><RotateCcw size={15} /></button>
        <span className="dr-scroll" aria-hidden="true">{c.scroll}<ArrowDown size={13} /></span>
      </>}
    </div>
  </section>;
}

// Stand-alone preview (no guest page around it)
export default function DoorsInvitation({ event = { names: 'Clara & Gabriel', date: '2027-06-19', time: '16:00', venue: 'Villa Balbiano', address: 'Lake Como' } }) {
  const [opened, setOpened] = useState(false);
  return <div className="dr-standalone"><DoorsStage event={event} opened={opened} onOpen={() => setOpened(true)} onReplay={() => setOpened(false)} /></div>;
}
