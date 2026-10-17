import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, RotateCcw } from 'lucide-react';
import { dateLabel } from './catalog';
import { countdownParts, eventInstant } from './craftTime';
import { ensureFont } from './fonts';
import './craft.css';

const language = {
  en: { family: 'Together with our families', open: 'Unfold our story', scroll: 'A little more to discover', replay: 'Replay opening', welcome: 'A day woven with love', countdown: 'Until we celebrate', days: 'Days', hours: 'Hours', minutes: 'Minutes', details: 'Ceremony & reception', dress: 'The dress code', gifts: 'A little note on gifts', moment: 'Made for our moment', heart: 'Save a little space in your heart', attire: 'A little dressed-up magic' },
  de: { family: 'Gemeinsam mit unseren Familien', open: 'Unsere Geschichte entfalten', scroll: 'Noch ein wenig entdecken', replay: 'Erneut öffnen', welcome: 'Ein Tag voller Liebe', countdown: 'Bis wir gemeinsam feiern', days: 'Tage', hours: 'Stunden', minutes: 'Minuten', details: 'Trauung & Feier', dress: 'Der Dresscode', gifts: 'Ein Wort zu Geschenken', moment: 'Für unseren besonderen Moment', heart: 'Ein Platz in deinem Herzen', attire: 'Ein wenig festlicher Zauber' },
  fr: { family: 'Entourés de nos familles', open: 'Déplier notre histoire', scroll: 'Encore un peu de magie', replay: 'Revoir l’ouverture', welcome: 'Un jour tissé d’amour', countdown: 'Avant de célébrer', days: 'Jours', hours: 'Heures', minutes: 'Minutes', details: 'Cérémonie & réception', dress: 'Le code vestimentaire', gifts: 'Un petit mot sur les cadeaux', moment: 'Pour notre moment à nous', heart: 'Gardez une petite place dans votre cœur', attire: 'Une touche de magie élégante' },
};
export const craftWords = lang => language[lang] || language.en;

export function CraftGarland({ className = '' }) {
  return <div className={'craft-garland ' + className} aria-hidden="true"><span /><i /><span /></div>;
}

export function CraftStage({ event, guest, opened, onOpen, onReplay, lang = 'en' }) {
  const root = useRef(null), c = craftWords(lang), names = event.names.split(/\s*&\s*/);
  const font = ensureFont(event.font);
  function discover() { root.current?.closest('.guest-experience')?.querySelector('#craft-welcome')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }
  function replay() { onReplay(); root.current?.closest('.guest-experience')?.scrollTo({ top: 0, behavior: 'instant' }); }
  return <section ref={root} className={'craft-stage ' + (opened ? 'craft-unfolded' : '')} aria-label="The Secret Conservatory invitation">
    <div className="craft-stitched-orbit" aria-hidden="true" />
    <div className="craft-hero-layout">
      <header className="craft-hero-copy">
        <span className="craft-eyebrow">{guest?.name ? guest.name : c.family}</span>
        <div className="craft-flourish" aria-hidden="true">❧</div>
        <h1 style={event.font && event.font !== 'classic' ? { fontFamily: font.family } : undefined}>{names.map((name, i) => <React.Fragment key={i}>{i > 0 && <em>&</em>}<span>{name}</span></React.Fragment>)}</h1>
        <p className="craft-hero-date">{dateLabel(event.date, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p className="craft-hero-line">{event.subtitle}</p>
        {!opened ? <button className="craft-unfold" onClick={onOpen}>{c.open}<ArrowDown size={15} /></button> : <button className="craft-discover" onClick={discover}>{c.scroll}<ArrowDown size={17} /></button>}
      </header>
      <div className="craft-estate" aria-hidden="true"><img src="/craft-conservatory.webp" width="1536" height="1024" alt="" fetchPriority="high" /></div>
    </div>
    <span className="craft-hero-edition" aria-hidden="true">MAISON · L’ATELIER DES SOUVENIRS</span>
    {opened && <button className="craft-replay" onClick={replay} aria-label={c.replay}><RotateCcw size={16} /></button>}
  </section>;
}

export function CraftWelcome({ event, lang = 'en' }) {
  const c = craftWords(lang);
  return <>
    <section className="craft-welcome" id="craft-welcome">
      <CraftGarland />
      <div className="craft-wreath-message">
        <img src="/craft-sweetpea-wreath.webp" width="1216" height="1296" alt="" aria-hidden="true" loading="lazy" />
        <div><span className="craft-eyebrow">{c.moment}</span><h2>{c.welcome}</h2></div>
      </div>
      <p>{event.message}</p>
    </section>
    <CraftCountdown event={event} lang={lang} />
  </>;
}

function CraftCountdown({ event, lang }) {
  const c = craftWords(lang), [now, setNow] = useState(Date.now);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const values = countdownParts(eventInstant(event.date, event.time, event.timezone), now);
  return <section className="craft-countdown" aria-label={c.countdown}>
    <span className="craft-eyebrow">{c.heart}</span>
    <h2>{c.countdown}</h2>
    <div className="craft-countdown-dials">{values.map((value, i) => <div key={i}><strong>{String(value).padStart(2, '0')}</strong><span>{[c.days, c.hours, c.minutes][i]}</span></div>)}</div>
    <CraftGarland className="craft-garland-bottom" />
  </section>;
}
