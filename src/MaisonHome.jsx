import React, { useState } from 'react';
import { ArrowRight, Sparkles, Lock, Heart, CalendarDays, Feather } from 'lucide-react';
import { cinemaThemes, cinemaEvent } from './cinemaThemes';
import { defaultEvent, templates } from './catalog';

const worlds = [
  ['Wedding', 'A promise, beautifully told.', 'atelier-ivory', 'ivory'],
  ['Children’s birthday', 'Little wishes. Enormous wonder.', 'cinema-garden', 'woodland-wish'],
  ['Adult birthday', 'An evening made to sparkle.', 'birthday-party-v2', 'birthday-wish'],
  ['Baby shower', 'The sweetest new beginning.', 'baby-film-end', 'little-wonder'],
  ['Graduation', 'Your next chapter awaits.', 'graduation-night', 'graduation-flight'],
  ['Engagement', 'The beginning of forever.', 'atelier-rose', 'rose-engagement'],
];
export function MaisonHero({ onCreate, onPreview, onExplore }) {
  return <section className="maison-hero">
    <div className="maison-hero-scene" aria-hidden="true" />
    <div className="maison-dust" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--i':i}} />)}</div>
    <div className="maison-hero-copy"><span className="maison-kicker">MADE FOR YOUR ONCE-UPON-A-TIME</span>
      <h1>Some moments<br/>deserve a little <em>magic.</em></h1>
      <p>An invitation to open. A world to step into.<br/>Your favourite people, together in one beautiful place.</p>
      <div className="maison-buttons"><button className="lx-btn lx-btn-solid" onClick={onCreate}>Create your invitation <ArrowRight size={16}/></button><button className="maison-text-button" onClick={onPreview}>Experience the magic <Sparkles size={16}/></button></div>
      <span className="maison-hero-note">Made yours in minutes · Free during the preview</span>
    </div>
    <button className="maison-envelope-preview" onClick={onPreview} aria-label="Open a magical sample invitation"><img src="/atelier-sage-cover.webp" alt="Embossed sage invitation envelope"/><img className="maison-hero-seal" src="/maison-wax-seal.png" alt="Maison wax seal"/><span>A little secret, just for you<small>TOUCH TO OPEN</small></span></button>
    <button className="maison-scroll" onClick={onExplore}>Find your celebration <span>↓</span></button>
  </section>;
}
export function MaisonWorlds({ onPreview, onCreate }) {
  const [selected,setSelected]=useState('All celebrations');
  return <section className="maison-section maison-worlds" id="worlds"><header><span className="maison-kicker">A WORLD FOR EVERY CELEBRATION</span><h2>What are we <em>celebrating?</em></h2><p>From tiny first wishes to a lifetime of love. Find a world that feels like you.</p></header>
    <div className="maison-world-filters" aria-label="Filter celebration worlds">{['All celebrations','Wedding','Birthday','Baby shower','Graduation','Engagement'].map(x=><button key={x} aria-pressed={selected===x} onClick={()=>setSelected(x)}>{x}</button>)}</div>
    <div className="maison-world-grid">{worlds.filter(([label])=>selected==='All celebrations'||label.toLowerCase().includes(selected.toLowerCase())).map(([label,line,image,id])=>{const theme=cinemaThemes.find(t=>t.id===id);const event=cinemaEvent(theme,defaultEvent(templates.find(t=>t.occasion===theme.occasion)||templates[0]));return <article key={id}><button className="maison-world-art" onClick={()=>onPreview(event)} aria-label={'Preview '+label+' invitation'}><img src={'/'+image+'.webp'} loading="lazy" alt={line}/><span>Step inside <ArrowRight size={16}/></span></button><div><span className="maison-kicker">{label}</span><h3>{line}</h3><button className="maison-text-button" onClick={()=>onCreate(event)}>Make it yours <ArrowRight size={14}/></button></div></article>})}</div>
  </section>;
}
export function MaisonStory({ onStart, onExperts, onDashboard }) {
  return <>
    <section className="maison-section maison-story"><header><span className="maison-kicker">MORE THAN A BEAUTIFUL FIRST IMPRESSION</span><h2>One link.<br/><em>Every lovely moment.</em></h2><p>Your celebration has a before, a big day and an afterwards. Maison brings them together.</p></header><div className="maison-story-cards">{[[Heart,'01 / BEFORE','A welcome with their name on it.','Personal invitations, thoughtful details and replies in one place.'],[CalendarDays,'02 / ON THE DAY','Everything they need, beautifully.','Your programme, venue directions and a date for their calendar.'],[Feather,'03 / AFTERWARDS','The memories live on.','Keep your photos and little notes together in your private celebration space.']].map(([Icon,n,title,body])=><article key={n}><Icon size={24} strokeWidth={1}/><span className="maison-kicker">{n}</span><h3>{title}</h3><p>{body}</p></article>)}</div><button className="maison-text-button" onClick={onStart}>Begin your story <ArrowRight size={16}/></button></section>
    <section className="maison-duo"><div className="maison-duo-art"><img src="/atelier-ivory.webp" alt="An elegant lakeside celebration setting" loading="lazy"/><div className="maison-paper"><span>MAISON</span><small>YOUR PEOPLE. YOUR MOMENT.</small><h3>Beautiful to receive.<br/><em>Simple to organise.</em></h3><Lock size={20}/><p>A private dashboard.<br/>Shared only when you choose.</p></div></div><div className="maison-duo-copy"><span className="maison-kicker">YOUR CELEBRATION, AT A GLANCE</span><h2>Less organising.<br/><em>More looking forward.</em></h2><p>Follow every reply, gather your memories and plan the lovely details. Select trusted guests to share a read-only view of your celebration.</p><ul><li>Guest replies and personal invitation links</li><li>A dated planning checklist and photo collection</li><li>Individual sharing controls you can revoke</li><li>Coordinated stationery to print at home</li></ul><button className="lx-btn lx-btn-solid" onClick={onDashboard}>Open my celebration space <ArrowRight size={16}/></button></div></section>
    <section className="maison-section maison-expert-bridge"><div><span className="maison-kicker">THE PEOPLE BEHIND THE MAGIC</span><h2>Your dream.<br/><em>A wonderful team.</em></h2><p>Find venues, planners, florists and celebration experts. Explore photographs, save your favourites and prepare your first hello.</p><button className="lx-btn lx-btn-solid" onClick={onExperts}>Meet venues & experts <ArrowRight size={16}/></button></div><div className="maison-expert-images"><img src="/occasion-arches/wedding.webp" alt="Celebration setting inspiration" loading="lazy"/><img src="/occasion-arches/dinner.webp" alt="Dinner celebration inspiration" loading="lazy"/><small>Celebration inspiration · Discover real listings in Venues & Experts</small></div></section>
  </>;
}
