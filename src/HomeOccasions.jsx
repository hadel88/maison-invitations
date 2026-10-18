import React, { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import './homeOccasions.css';

const occasions = [
  ['Wedding', 'wedding', '25% 50%'],
  ['Birthday', 'birthday', '90% 50%'],
  ['Baby shower', 'baby', '50% 40%'],
  ['Engagement', 'engagement', '78% 50%'],
  ['Graduation', 'graduation', '50% 75%'],
  ['Anniversary', 'anniversary', '50% 60%'],
  ['Corporate event', 'corporate', '50% 55%'],
];
const moreOccasions = [
  ['Dinner party', 'dinner', '50% 65%'],
  ['Christening', 'christening', '50% 60%'],
  ['Seasonal celebration', 'seasonal', '78% 50%'],
];
const words = {
  en: { title: 'Choose your occasion', line: 'A little world of wonder for every reason to celebrate.', more: 'More', all: 'Explore all occasions', hint: 'Swipe to discover your occasion', explore: 'Explore', invitations: 'invitations', labels: { 'Baby shower': 'Baby Shower', 'Corporate event': 'Corporate' } },
  de: { title: 'Wähle deinen Anlass', line: 'Eine kleine Welt voller Zauber für jeden Grund zum Feiern.', more: 'Mehr', all: 'Alle Anlässe entdecken', hint: 'Wischen und deinen Anlass entdecken', explore: 'Entdecke', invitations: 'Einladungen', labels: { Wedding: 'Hochzeit', Birthday: 'Geburtstag', 'Baby shower': 'Babyparty', Engagement: 'Verlobung', Graduation: 'Abschluss', Anniversary: 'Jubiläum', 'Corporate event': 'Firmenfeier', 'Dinner party': 'Dinnerparty', Christening: 'Taufe', 'Seasonal celebration': 'Saisonale Feier' } },
  fr: { title: 'Choisissez votre occasion', line: 'Un petit monde merveilleux pour chaque moment à célébrer.', more: 'Autres', all: 'Découvrir toutes les occasions', hint: 'Faites défiler pour découvrir votre occasion', explore: 'Découvrir', invitations: 'invitations', labels: { Wedding: 'Mariage', Birthday: 'Anniversaire', 'Baby shower': 'Baby shower', Engagement: 'Fiançailles', Graduation: 'Diplôme', Anniversary: 'Anniversaire de mariage', 'Corporate event': 'Entreprise', 'Dinner party': 'Dîner', Christening: 'Baptême', 'Seasonal celebration': 'Fête de saison' } },
};

export function HomeOccasions({ onSelect, lang = 'en' }) {
  const [expanded, setExpanded] = useState(false), c = words[lang] || words.en;
  function card([occasion, image, position]) {
    const label = c.labels[occasion] || occasion;
    return <button className="home-occasion" key={occasion} onClick={() => onSelect(occasion)} aria-label={`${c.explore} ${label} ${c.invitations}`}>
      <span className="home-occasion-arch">
        <img src={`/occasion-arches/${image}.webp`} width="240" height="320" alt="" loading="lazy" decoding="async" style={{ objectPosition: position }} />
        <span className="home-occasion-spark" aria-hidden="true">✦</span>
      </span>
      <span className="home-occasion-label">{label}</span>
    </button>;
  }
  return <section className="home-occasions" aria-labelledby="home-occasions-title">
    <header className="home-occasions-heading">
      <span className="home-occasions-flourish" aria-hidden="true"><i/><Sparkles size={17} strokeWidth={1}/><i/></span>
      <h2 id="home-occasions-title">{c.title}</h2><p>{c.line}</p>
    </header>
    <nav className="home-occasion-row" aria-label={c.title}>
      {occasions.map(card)}
      <button className={'home-occasion home-occasion-more' + (expanded ? ' is-expanded' : '')} onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls="home-more-occasions">
        <span className="home-occasion-arch"><img src="/occasion-arches/more.webp" width="240" height="320" alt="" loading="lazy" decoding="async" style={{ objectPosition: '82% 50%' }}/><span className="home-occasion-spark" aria-hidden="true">✦</span></span>
        <span className="home-occasion-label">{c.more}<ChevronDown size={12}/></span>
      </button>
    </nav>
    <p className="home-occasion-hint">{c.hint}<span aria-hidden="true"> →</span></p>
    {expanded && <div id="home-more-occasions" className="home-more-occasions">
      <div>{moreOccasions.map(card)}</div>
      <button className="home-occasions-all" onClick={() => onSelect('All designs')}>{c.all}<span aria-hidden="true"> →</span></button>
    </div>}
  </section>;
}
