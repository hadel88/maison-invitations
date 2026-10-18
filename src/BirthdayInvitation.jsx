import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, RotateCcw, Sparkles } from 'lucide-react';
import { dateLabel } from './catalog';
import { ensureFont } from './fonts';
import { createBirthdayDust } from './birthdayGL';
import { createCelebrationCanvas } from './celebrationCanvas';
import { createCurtainRenderer } from './curtainGL';
import './birthday.css';

const copy = {
  en: { cover: 'Let’s make some birthday noise.', secret: 'CAKE. CONFETTI. YOUR FAVOURITE PEOPLE.', open: 'Unwrap the party', invited: 'YOU’RE INVITED TO CELEBRATE', wish: 'Make a wish', wished: 'May it find its way to you.', scroll: 'The evening awaits', replay: 'Replay opening' },
  de: { cover: 'Ein kleiner Geburtstagszauber', secret: 'ETWAS WUNDERBARES WARTET', open: 'Die Party auspacken', invited: 'DU BIST ZUM FEIERN EINGELADEN', wish: 'Wünsch dir etwas', wished: 'Möge dein Wunsch wahr werden.', scroll: 'Der Abend wartet', replay: 'Erneut öffnen' },
  fr: { cover: 'Un peu de magie pour toi', secret: 'UNE MERVEILLE VOUS ATTEND', open: 'Déballer la fête', invited: 'VOUS ÊTES INVITÉS À CÉLÉBRER', wish: 'Faites un vœu', wished: 'Qu’il trouve son chemin vers vous.', scroll: 'La soirée vous attend', replay: 'Revoir l’ouverture' },
};

const graduationCopy = {
 en: {cover:'The world is waiting.',secret:'CLASS OF',open:'Turn the tassel',invited:'CHEERS TO THE NEXT CHAPTER',wish:'To new adventures',wished:'Here’s to everything ahead.',scroll:'Join the celebration',replay:'Replay opening'},
 de: {cover:'Die Welt wartet auf dich.',secret:'ABSCHLUSSJAHR',open:'Die Quaste wenden',invited:'AUF DEIN NÄCHSTES KAPITEL',wish:'Auf neue Abenteuer',wished:'Auf alles, was vor dir liegt.',scroll:'Wir feiern gemeinsam',replay:'Erneut öffnen'},
 fr: {cover:'Le monde vous attend.',secret:'PROMOTION',open:'Tourner le gland',invited:'AU PROCHAIN CHAPITRE',wish:'Aux nouvelles aventures',wished:'À tout ce qui vous attend.',scroll:'Venez célébrer',replay:'Revoir l’ouverture'},
};

export function BirthdayStage({ event, guest, opened, onOpen, onReplay, lang = 'en' }) {
  const root = useRef(null), canvas = useRef(null), dustCanvas = useRef(null), box = useRef(null), dust = useRef(null);
  const [revealed, setRevealed] = useState(false), [fallback, setFallback] = useState(false), [wished, setWished] = useState(false);
  const curtain = event.scene === 'graduation-curtain', graduation = curtain || event.scene === 'graduation-flight';
  const baseCopy = graduation ? graduationCopy[lang] || graduationCopy.en : copy[lang] || copy.en;
  const c = curtain ? {...baseCopy, cover: {en:'Your next act begins.',de:'Dein nächster Auftritt beginnt.',fr:'Votre prochain acte commence.'}[lang] || 'Your next act begins.', open:{en:'Raise the curtain',de:'Vorhang auf',fr:'Lever le rideau'}[lang] || 'Raise the curtain'} : baseCopy, font = ensureFont(event.font);
  useEffect(() => {
    try {
      const callbacks={onComplete:()=>setRevealed(true),onError:()=>setFallback(true)};
      box.current = curtain ? createCurtainRenderer(canvas.current,{...callbacks,texturePath:'/graduation-burgundy-curtain.webp',openingDelay:.25}) : createCelebrationCanvas(canvas.current,{...callbacks,kind:graduation?'graduation':'birthday',names:event.names,year:(event.date||'').slice(0,4)});
    }
    catch { setFallback(true); }
    try { dust.current = createBirthdayDust(dustCanvas.current); } catch { /* The invitation remains usable without decorative particles. */ }
    return () => { box.current?.dispose(); dust.current?.dispose(); box.current = null; dust.current = null; };
  }, [graduation, curtain, event.names, event.date]);
  useEffect(() => {
    if (opened) box.current?.open();
    else { box.current?.reset(); dust.current?.reset(); setRevealed(false); setWished(false); }
    if (!opened || !fallback) return;
    const timer = setTimeout(() => setRevealed(true), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : curtain ? 5750 : 6200);
    return () => clearTimeout(timer);
  }, [opened, fallback, graduation, curtain, event.names, event.date]);
  useEffect(() => { if (revealed) dust.current?.start(); }, [revealed]);
  function replay() { onReplay(); root.current?.closest('.guest-experience')?.scrollTo({ top: 0, behavior: 'instant' }); }
  function discover() { root.current?.closest('.guest-experience')?.querySelector('.cinema-detail-sheet')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
  return <section ref={root} className={'birthday-stage ' + (graduation ? 'graduation-stage ' : '') + (curtain ? 'graduation-curtain-stage ' : '') + (opened ? 'birthday-opening ' : '') + (revealed ? 'birthday-revealed' : '')} aria-label={curtain ? "The Crimson Ovation graduation invitation" : graduation ? "The Next Chapter graduation invitation" : "A Wish After Dark birthday invitation"}>
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
    {fallback ? curtain ? <div className="graduation-curtain-fallback" aria-hidden="true"><span/><span/></div> : <div className="birthday-box-fallback" aria-hidden="true" /> : <canvas ref={canvas} className={"birthday-box-canvas"+(curtain?" graduation-curtain-canvas":"")} aria-hidden="true" onClick={opened ? undefined : onOpen} />}
    <canvas ref={dustCanvas} className="birthday-dust" aria-hidden="true" />
    <div className="birthday-cover-copy" aria-hidden={opened}><span className="birthday-eyebrow">{c.secret}{graduation ? " " + (event.date || '').slice(0,4) : ""}</span><h2>{c.cover}</h2><span className="birthday-cover-star" aria-hidden="true">✧</span></div>
    <button className="birthday-seal" onClick={onOpen} disabled={opened} aria-label={c.open}>
      <Sparkles size={15} aria-hidden="true" /><span>{c.open}</span>
    </button>
    {!opened && <span className="birthday-edition" aria-hidden="true">{graduation ? (curtain ? "MAISON · THE CRIMSON OVATION" : "MAISON · THE NEXT CHAPTER") : "MAISON · MAKE A LITTLE NOISE"}</span>}
    {revealed && <><button className="birthday-scroll" onClick={discover}>{c.scroll}<ArrowDown size={15} /></button><button className="birthday-replay" onClick={replay} aria-label={c.replay}><RotateCcw size={15} /></button></>}
  </section>;
}
