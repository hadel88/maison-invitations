import React,{useEffect,useRef,useState} from 'react';
import {ArrowDown,RotateCcw} from 'lucide-react';
import {dateLabel} from './catalog';
import {ensureFont} from './fonts';
import {ivoryVariables} from './ivoryDesigns';
import IvoryPlaque from './IvoryPlaque';
import './ivory.css';

const words={en:{open:'Open your invitation',touch:'Touch the monogram to open',scroll:'Scroll to discover',replay:'Replay opening',for:'FOR'},de:{open:'Einladung öffnen',touch:'Monogramm zum Öffnen berühren',scroll:'Nach unten entdecken',replay:'Erneut öffnen',for:'FÜR'},fr:{open:'Ouvrir votre invitation',touch:'Touchez le monogramme pour ouvrir',scroll:'Faites défiler pour découvrir',replay:'Revoir l’ouverture',for:'POUR'}};

export function IvoryStage({theme,event,guest,opened,onOpen,onReplay,lang='en'}) {
 const root=useRef(null),[revealed,setRevealed]=useState(false),c=words[lang]||words.en;
 useEffect(()=>{
  setRevealed(false);
  if(!opened)return;
  const timer=setTimeout(()=>setRevealed(true),matchMedia('(prefers-reduced-motion: reduce)').matches?30:4000);
  return()=>clearTimeout(timer);
 },[opened,event.scene]);
 const names=event.names.split(/\s*&\s*/),font=ensureFont(event.font);
 return <section ref={root} className={'ivory-stage '+(opened?'ivory-opening ':'')+(revealed?'ivory-revealed':'')} style={ivoryVariables(theme)} data-motif={theme.motif} aria-label={theme.name+' invitation'}>
  <div className="ivory-setting" style={{backgroundImage:`url(/${theme.image}.webp)`}} aria-hidden="true"/>
  <div className="ivory-setting-light" aria-hidden="true"/>
  <article className="ivory-letter" aria-hidden={!revealed}>
   <span className="ivory-letter-kicker">{guest?.name?c.for+' '+guest.name.toLocaleUpperCase():theme.overline||'YOU ARE INVITED'}</span>
   <div className="ivory-letter-flourish" aria-hidden="true">❦</div>
   <h1 style={{fontFamily:font.family}}>{names.map((name,i)=><React.Fragment key={i}>{i>0&&<em>&amp;</em>}<span>{name}</span></React.Fragment>)}</h1>
   <p>{event.subtitle||theme.line}</p>
   <div className="ivory-letter-rule" aria-hidden="true"/>
   <time dateTime={event.date}>{dateLabel(event.date,lang)}</time>
   <span className="ivory-letter-venue">{event.venue}</span>
   <span className="ivory-letter-flourish ivory-letter-footer" aria-hidden="true">❧</span>
  </article>
  <div className="ivory-gatefold"><div className="ivory-paper ivory-paper-left" aria-hidden="true"/><div className="ivory-paper ivory-paper-right">
  <button type="button" className="ivory-open" onClick={onOpen} disabled={opened} aria-label={c.open} aria-hidden={opened} tabIndex={opened?-1:0}><IvoryPlaque names={event.names} shape={theme?.plaqueShape||(theme?.id==='woodland-wish'?'woodland-keepsake':'ivory')} palette={theme}/></button>
  </div></div>
  {!opened&&<span className="ivory-open-hint">{c.touch}</span>}
  {revealed&&<><div className="ivory-scroll"><span>{c.scroll}</span><ArrowDown size={16}/></div><button type="button" className="ivory-replay" aria-label={c.replay} onClick={()=>{onReplay();root.current?.closest('.guest-experience')?.scrollTo({top:0,behavior:'instant'})}}><RotateCcw size={16}/></button></>}
 </section>;
}

export function IvoryDetailsHeading({event,theme}) {
 return <div className="ivory-details-heading" aria-hidden="true"><IvoryPlaque names={event.names} shape={theme?.plaqueShape||(theme?.id==='woodland-wish'?'woodland-keepsake':'ivory')} palette={theme}/><span>❦</span></div>;
}
