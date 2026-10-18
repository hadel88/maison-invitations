import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, RotateCcw, Sparkles } from 'lucide-react';
import { dateLabel } from './catalog';
import { ensureFont } from './fonts';
import { createBirthdayBox, createBirthdayDust } from './birthdayGL';
import './birthday.css';

const copy = {
  en: { cover: 'A little birthday wonder', secret: 'SOMETHING WONDERFUL IS WAITING', open: 'Break the seal', invited: 'YOU’RE INVITED TO CELEBRATE', wish: 'Make a wish', wished: 'May it find its way to you.', scroll: 'The evening awaits', replay: 'Replay opening' },
  de: { cover: 'Ein kleiner Geburtstagszauber', secret: 'ETWAS WUNDERBARES WARTET', open: 'Das Siegel öffnen', invited: 'DU BIST ZUM FEIERN EINGELADEN', wish: 'Wünsch dir etwas', wished: 'Möge dein Wunsch wahr werden.', scroll: 'Der Abend wartet', replay: 'Erneut öffnen' },
  fr: { cover: 'Un peu de magie pour toi', secret: 'UNE MERVEILLE VOUS ATTEND', open: 'Briser le sceau', invited: 'VOUS ÊTES INVITÉS À CÉLÉBRER', wish: 'Faites un vœu', wished: 'Qu’il trouve son chemin vers vous.', scroll: 'La soirée vous attend', replay: 'Revoir l’ouverture' },
};

export function BirthdayStage({ event, guest, opened, onOpen, onReplay, lang = 'en' }) {
  const root = useRef(null), canvas = useRef(null), dustCanvas = useRef(null), box = useRef(null), dust = useRef(null);
  const [revealed, setRevealed] = useState(false), [fallback, setFallback] = useState(false), [wished, setWished] = useState(false);
  const c = copy[lang] || copy.en, font = ensureFont(event.font);
  useEffect(() => {
    try { box.current = createBirthdayBox(canvas.current, { onComplete: () => setRevealed(true), onError: () => setFallback(true) }); }
    catch { setFallback(true); }
    try { dust.current = createBirthdayDust(dustCanvas.current); } catch { /* The invitation remains usable without decorative particles. */ }
    return () => { box.current?.dispose(); dust.current?.dispose(); box.current = null; dust.current = null; };
  }, []);
  useEffect(() => {
    if (opened) box.current?.open();
    else { box.current?.reset(); dust.current?.reset(); setRevealed(false); setWished(false); }
    if (!opened || !fallback) return;
    const timer = setTimeout(() => setRevealed(true), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 6200);
    return () => clearTimeout(timer);
  }, [opened, fallback]);
  useEffect(() => { if (revealed) dust.current?.start(); }, [revealed]);
  function replay() { onReplay(); root.current?.closest('.guest-experience')?.scrollTo({ top: 0, behavior: 'instant' }); }
  function discover() { root.current?.closest('.guest-experience')?.querySelector('.cinema-detail-sheet')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  return <section ref={root} className={'birthday-stage ' + (opened ? 'birthday-opening ' : '') + (revealed ? 'birthday-revealed' : '')} aria-label="A Wish After Dark birthday invitation">
    <div className="birthday-night" aria-hidden="true" />
    <div className="birthday-night-shade" aria-hidden="true" />
    <div className="birthday-copy" aria-hidden={!revealed}>
      <span className="birthday-eyebrow">{guest?.name ? guest.name : c.invited}</span>
      <h1 style={event.font && event.font !== 'classic' ? { fontFamily: font.family } : undefined}>{event.names}</h1>
      <p>{event.subtitle}</p>
      <span className="birthday-date">{dateLabel(event.date, lang)} · {event.time}</span>
      <button className="birthday-wish" disabled={!revealed} tabIndex={revealed ? 0 : -1} onClick={() => { dust.current?.wish(); setWished(true); }}><Sparkles size={13} />{c.wish}</button>
      <small className="birthday-wish-note" role="status">{wished ? c.wished : '\u00a0'}</small>
    </div>
    {fallback ? <div className="birthday-box-fallback" aria-hidden="true" /> : <canvas ref={canvas} className="birthday-box-canvas" aria-hidden="true" />}
    <canvas ref={dustCanvas} className="birthday-dust" aria-hidden="true" />
    <div className="birthday-cover-copy" aria-hidden={opened}><span className="birthday-eyebrow">{c.secret}</span><h2>{c.cover}</h2><span className="birthday-cover-star" aria-hidden="true">✧</span></div>
    <button className="birthday-seal" onClick={onOpen} disabled={opened} aria-label={c.open}>
      <img src="/birthday-wax.webp" width="640" height="640" alt="" /><span>{c.open}</span>
    </button>
    {!opened && <span className="birthday-edition" aria-hidden="true">MAISON · A WISH AFTER DARK</span>}
    {revealed && <><button className="birthday-scroll" onClick={discover}>{c.scroll}<ArrowDown size={15} /></button><button className="birthday-replay" onClick={replay} aria-label={c.replay}><RotateCcw size={15} /></button></>}
  </section>;
}
