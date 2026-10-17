import React,{useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowRight,RotateCcw,Copy,Check} from 'lucide-react';
import {cinemaThemes,sceneFor,cinemaEvent} from './cinemaThemes';
import {dateLabel,defaultEvent,templates} from './catalog';
import './cinema.css';
import './atelier.css';
import {ensureFont} from './fonts';
const words={en:{open:'Open your invitation',touch:'Touch to open',scroll:'Scroll to discover',invited:'TOGETHER WITH OUR FAMILIES',celebrate:'invite you to celebrate our wedding',replay:'Replay opening'},de:{open:'Einladung öffnen',touch:'Zum Öffnen berühren',scroll:'Nach unten entdecken',invited:'GEMEINSAM MIT UNSEREN FAMILIEN',celebrate:'laden wir euch zu unserer Hochzeit ein',replay:'Erneut öffnen'},fr:{open:'Ouvrir votre invitation',touch:'Touchez pour ouvrir',scroll:'Faites défiler pour découvrir',invited:'ENTOURÉS DE NOS FAMILLES',celebrate:'nous vous invitons à célébrer notre mariage',replay:'Revoir l’ouverture'}};
export function CinemaStage({event,guest,opened,onOpen,onReplay,lang='en'}){
 const theme=sceneFor(event),c=words[lang]||words.en,root=useRef(null),ribbonCanvas=useRef(null),ribbonEngine=useRef(null);
 const [ribbonReady,setRibbonReady]=useState(false);
 useEffect(()=>{if(theme.kind!=='rose')return;let dead=false;import('./ribbonGL').then(({createRibbonRenderer})=>{if(dead)return;try{ribbonEngine.current=createRibbonRenderer(ribbonCanvas.current,{onReady:()=>setRibbonReady(true),onError:()=>setRibbonReady(false)});if(opened)ribbonEngine.current.open()}catch{setRibbonReady(false)}});return()=>{dead=true;ribbonEngine.current?.dispose();ribbonEngine.current=null}},[theme.kind]);
 useEffect(()=>{if(opened)ribbonEngine.current?.open();else ribbonEngine.current?.reset()},[opened]);
 const [revealed,setRevealed]=useState(false);
 useEffect(()=>{setRevealed(false);if(!opened)return;const id=setTimeout(()=>setRevealed(true),matchMedia('(prefers-reduced-motion: reduce)').matches?50:theme.kind==='rose'?10500:5500);return()=>clearTimeout(id)},[opened,theme.kind]);
 const names=event.names.split(/\s*&\s*/);
 const font=ensureFont(event.font);
 return <section ref={root} className={`atelier-stage atelier-${theme.kind} ${opened?'atelier-opening':''} ${revealed?'atelier-revealed':''} ${ribbonReady?'ribbon-ready':''}`} aria-label={theme.name+' invitation'} style={{'--atelier-ink':theme.ink}}>
  <div className="atelier-landscape" style={{backgroundImage:`url(/${theme.image}.webp)`}}/>
  <div className="atelier-light" aria-hidden="true"/>
  <div className="atelier-petals" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{left:`${i*13%100}%`,animationDelay:`${-i*2.3}s`,animationDuration:`${14+i}s`}}/>)}</div>
  <div className="atelier-inscription" aria-hidden={!revealed}>
   <span className="atelier-overline">{guest?.name?`FOR ${guest.name.toUpperCase()}`:c.invited}</span>
   <h1 style={event.font&&event.font!=='classic'?{fontFamily:font.family}:undefined}>{names.map((name,i)=><React.Fragment key={i}>{i>0&&<em>&</em>}<span>{name}</span></React.Fragment>)}</h1>
   <p>{event.subtitle||c.celebrate}</p>
   <div className="atelier-date">{dateLabel(event.date,lang)}</div>
   <span className="atelier-place">{event.venue}</span>
  </div>
  {theme.kind==='rose'&&<canvas className="atelier-ribbon-canvas" ref={ribbonCanvas} aria-hidden="true"/>}
  <div className="atelier-curtains" aria-hidden="true"><div className="atelier-leaf leaf-left" style={{backgroundImage:`url(/${theme.cover}.webp)`}}/><div className="atelier-leaf leaf-right" style={{backgroundImage:`url(/${theme.cover}.webp)`}}/>{theme.kind==='sage'&&<div className="atelier-envelope-flap" style={{backgroundImage:`url(/${theme.cover}.webp)`}}><img className="atelier-wax atelier-wax-flap" src="/maison-wax-seal.png" alt=""/></div>}</div>
  {!opened&&<button className={`atelier-open-control ${theme.kind==='rose'?'with-ribbon':''}`} onClick={onOpen} aria-label={c.open}>
    {theme.kind==='rose'?<img className="atelier-bow" src="/atelier-bow.webp" alt=""/>:theme.kind==='sage'?null:<span className="atelier-monogram">{names.map(n=>n.trim()[0]).join(' & ')}</span>}
    <span className="atelier-touch">{c.touch}</span>
  </button>}
  {opened&&theme.kind==='rose'&&!ribbonReady&&<img className="atelier-bow departing-bow" src="/atelier-bow.webp" alt=""/>}
  {revealed&&<div className="atelier-scroll-hint"><span>{c.scroll}</span><ArrowDown size={17}/></div>}
  {revealed&&<button className="atelier-replay" aria-label={c.replay} onClick={()=>{onReplay();if(theme.kind==='rose')root.current?.closest('.guest-experience')?.scrollTo({top:0,behavior:'instant'})}}><RotateCcw size={15}/></button>}
 </section>
}
export function CinemaCollection({onPreview,onCreate,notify}){
 const [copied,setCopied]=useState('');
 const eventFor=t=>cinemaEvent(t,defaultEvent(templates.find(x=>x.occasion===t.occasion)||templates[0]));
 async function copy(t){try{await navigator.clipboard.writeText(location.origin+'/?cinema='+t.id);setCopied(t.id);notify('Preview link copied')}catch{notify('Open the invitation and copy its address')}}
 return <main className="atelier-collection"><header className="atelier-collection-heading"><span>THE SIGNATURE COLLECTION</span><h1>A little wonder.<br/><em>A beautiful beginning.</em></h1><p>Three invitations to unfold, enter, and explore.<br/>Open once. Let the story continue as you scroll.</p></header><div className="atelier-three">{cinemaThemes.map((t,i)=><article key={t.id}><button className={'atelier-poster poster-'+t.kind} onClick={()=>onPreview(eventFor(t))} aria-label={'Experience '+t.name}><img src={'/'+t.cover+'-sm.webp'} srcSet={'/'+t.cover+'-sm.webp 600w, /'+t.cover+'.webp 941w'} sizes="(max-width: 760px) 90vw, 30vw" width="600" height="1066" decoding="async" alt={t.name+' invitation artwork'}/>{t.kind==='rose'?<img className="poster-bow" src="/atelier-bow.webp" alt=""/>:t.kind==='sage'?<img className="atelier-wax" src="/maison-wax-seal.png" alt=""/>:<span className="atelier-monogram">S & A</span>}<span className="poster-open">Open the invitation <ArrowRight size={14}/></span></button><div className="atelier-caption"><span>0{i+1} / {t.tag}</span><h2>{t.name}</h2><div><button onClick={()=>onCreate(eventFor(t))}>Make it yours <ArrowRight size={14}/></button><button onClick={()=>copy(t)} aria-label={'Copy '+t.name+' preview link'}>{copied===t.id?<Check size={15}/>:<Copy size={15}/>}</button></div></div></article>)}</div><p className="atelier-collection-note">Sample names and dates. Personalise every detail in the invitation studio.</p></main>
}
