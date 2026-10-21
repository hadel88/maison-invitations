import React,{useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowRight,RotateCcw,Copy,Check} from 'lucide-react';
import {cinemaThemes,sceneFor,cinemaEvent} from './cinemaThemes';
import {dateLabel,defaultEvent,templates} from './catalog';
import './cinema.css';
import './atelier.css';
import {ensureFont} from './fonts';
import {CraftStage} from './CraftInvitation';
import {BeachDemoCard} from './BeachDemoCard';
import {BirthdayStage} from './BirthdayInvitation';
import {FilmStage} from './FilmInvitation';
import {StoryStage} from './StoryInvitation';
import {PearlStage} from './PearlInvitation';
import {BabyStage} from './BabyInvitation';
import RibbonPreview from './RibbonPreview';
import {occasionScenes,sceneVariables} from './occasionScenes';
import {filterInvitationDesigns} from './ivoryDesigns';
import IvoryPlaque from './IvoryPlaque';
import {IvoryStage} from './IvoryInvitation';
const words={en:{open:'Open your invitation',touch:'Touch to open',scroll:'Scroll to discover',invited:'TOGETHER WITH OUR FAMILIES',celebrate:'invite you to celebrate our wedding',replay:'Replay opening'},de:{open:'Einladung öffnen',touch:'Zum Öffnen berühren',scroll:'Nach unten entdecken',invited:'GEMEINSAM MIT UNSEREN FAMILIEN',celebrate:'laden wir euch zu unserer Hochzeit ein',replay:'Erneut öffnen'},fr:{open:'Ouvrir votre invitation',touch:'Touchez pour ouvrir',scroll:'Faites défiler pour découvrir',invited:'ENTOURÉS DE NOS FAMILLES',celebrate:'nous vous invitons à célébrer notre mariage',replay:'Revoir l’ouverture'}};
export function CinemaStage({event,guest,opened,onOpen,onReplay,onAnswer,lang='en',preview=false}){
 const theme=sceneFor(event),c=words[lang]||words.en,root=useRef(null),ribbonCanvas=useRef(null),ribbonEngine=useRef(null);
 const [ribbonReady,setRibbonReady]=useState(false);
 const openedRef=useRef(opened); openedRef.current=opened;
 useEffect(()=>{if(theme.kind!=='rose')return;let dead=false;import('./ribbonSatin').then(({createRibbonRenderer})=>{if(dead)return;try{ribbonEngine.current=createRibbonRenderer(ribbonCanvas.current,{onReady:()=>setRibbonReady(true),onError:()=>setRibbonReady(false)});if(openedRef.current)ribbonEngine.current.open()}catch{setRibbonReady(false)}}).catch(()=>setRibbonReady(false));return()=>{dead=true;ribbonEngine.current?.dispose();ribbonEngine.current=null}},[theme.kind]);
 useEffect(()=>{if(opened)ribbonEngine.current?.open();else ribbonEngine.current?.reset()},[opened]);
 const [revealed,setRevealed]=useState(false);
 useEffect(()=>{setRevealed(false);if(!opened||theme.kind==='sage')return;const id=setTimeout(()=>setRevealed(true),matchMedia('(prefers-reduced-motion: reduce)').matches?50:theme.kind==='rose'?10500:5500);return()=>clearTimeout(id)},[opened,theme.kind]);
 const names=event.names.split(/\s*&\s*/);
 const font=ensureFont(event.font);
 const toned=content=><div className="occasion-tone" style={sceneVariables(theme)}>{content}</div>;
 if(theme.kind==='ivory')return toned(<IvoryStage theme={theme} event={event} guest={guest} opened={opened} onOpen={onOpen} onReplay={onReplay} lang={lang}/>);
 if(['birthday','graduation','graduation-curtain'].includes(theme.kind))return toned(<BirthdayStage event={event} guest={guest} opened={opened} onOpen={onOpen} onReplay={onReplay} lang={lang}/>);
 if(theme.kind==='baby-film')return toned(<BabyStage event={event} guest={guest} opened={opened} onOpen={onOpen} onReplay={onReplay} onAnswer={onAnswer} lang={lang}/>);
 if(theme.kind==='pearl')return toned(<PearlStage event={event} guest={guest} opened={opened} onOpen={onOpen} onReplay={onReplay} onAnswer={onAnswer} lang={lang} preview={preview}/>);
 if(theme.kind==='story')return toned(<StoryStage event={event} guest={guest} opened={opened} onOpen={onOpen} onReplay={onReplay} onAnswer={onAnswer} lang={lang} preview={preview}/>);
 if(theme.kind==='film')return toned(<FilmStage event={event} guest={guest} opened={opened} onOpen={onOpen} onReplay={onReplay} onAnswer={onAnswer} lang={lang} preview={preview}/>);
 if(theme.kind==='craft')return toned(<CraftStage event={event} guest={guest} opened={opened} onOpen={onOpen} onReplay={onReplay} lang={lang}/>);
 return <section ref={root} className={`atelier-stage atelier-${theme.kind} ${opened?'atelier-opening':''} ${revealed?'atelier-revealed':''} ${ribbonReady?'ribbon-ready':''} ${theme.occasionDoor?'occasion-door':''}`} aria-label={theme.name+' invitation'} style={{'--atelier-ink':theme.ink,...sceneVariables(theme)}}>
  <div className="atelier-landscape" style={{backgroundImage:`url(/${theme.image}.webp)`}}/>
  <div className="atelier-light" aria-hidden="true"/>
  <div className="atelier-petals" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i} style={{left:`${i*13%100}%`,animationDelay:`${-i*2.3}s`,animationDuration:`${14+i}s`}}/>)}</div>
  <div className="atelier-inscription" aria-hidden={!revealed}>
   <span className="atelier-overline">{guest?.name?`FOR ${guest.name.toUpperCase()}`:(theme.overline||c.invited)}</span>
   <h1 style={event.font&&event.font!=='classic'?{fontFamily:font.family}:undefined}>{names.map((name,i)=><React.Fragment key={i}>{i>0&&<em>&</em>}<span>{name}</span></React.Fragment>)}</h1>
   <p>{event.subtitle||c.celebrate}</p>
   <div className="atelier-date">{dateLabel(event.date,lang)}</div>
   <span className="atelier-place">{event.venue}</span>
  </div>
  {theme.kind==='rose'&&<><img className="ribbon-stage-still" src="/rose-ribbon-still.png" alt="" aria-hidden="true"/><canvas className="atelier-ribbon-canvas" ref={ribbonCanvas} aria-hidden="true"/></>}
  {theme.kind==='sage'?<SageEnvelope opened={opened} onComplete={setRevealed} stage={root} inviteLine={{en:'You are invited',de:'Du bist eingeladen',fr:'Vous êtes invité'}[lang]||'You are invited'} guestLine={guest?.name?({en:'For ',de:'Für ',fr:'Pour '}[lang]||'For ')+guest.name:''} card={{overline:theme.overline||c.invited,names:event.names,subtitle:event.subtitle||c.celebrate,date:dateLabel(event.date,lang)+(event.time?' · '+event.time:''),venue:event.venue||'',font:event.font&&event.font!=='classic'?font.family:null}}/>:<div className="atelier-curtains" aria-hidden="true"><div className="atelier-leaf leaf-left" style={{backgroundImage:`url(/${theme.cover}.webp)`}}/><div className="atelier-leaf leaf-right" style={{backgroundImage:`url(/${theme.cover}.webp)`}}/></div>}
  {!opened&&<button className={`atelier-open-control ${theme.kind==='rose'?'with-ribbon':''}`} onClick={onOpen} aria-label={c.open}>
    {theme.kind==='rose'?null:theme.kind==='sage'?<span className="sage-seal-hitarea" aria-hidden="true"/>:<span className="atelier-monogram">{names.map(n=>n.trim()[0]).join(' & ')}</span>}
    <span className="atelier-touch">{c.touch}</span>
  </button>}

  {revealed&&<div className="atelier-scroll-hint"><span>{c.scroll}</span><ArrowDown size={17}/></div>}
  {revealed&&<button className="atelier-replay" aria-label={c.replay} onClick={()=>{onReplay();if(theme.kind==='rose'||theme.kind==='sage')root.current?.closest('.guest-experience')?.scrollTo({top:0,behavior:'instant'})}}><RotateCcw size={15}/></button>}
 </section>
}
function SageEnvelope({opened,onComplete,stage,card,guestLine,inviteLine}){
 // A real 3D envelope (see sageEnvelope.js). The layered CSS envelope below stays as the fallback
 // when WebGL is not available.
 const canvas=useRef(null),engine=useRef(null),openedRef=useRef(opened),[gl,setGl]=useState(false),[shape,setShape]=useState(0);
 openedRef.current=opened;
 const cardKey=JSON.stringify(card),guestRef=useRef(guestLine);
 const placeSeal=(p)=>{const el=stage.current;if(!el||!p)return;el.style.setProperty('--sage-seal-x',p.x+'px');el.style.setProperty('--sage-seal-y',p.y+'px');el.style.setProperty('--sage-seal-r',p.r+'px')};
 useEffect(()=>{let dead=false;
  import('./sageEnvelope').then(async({createSageEnvelope})=>{if(dead||!canvas.current)return;
   try{const e=createSageEnvelope(canvas.current,{card,guestLine:guestRef.current,inviteLine,onSeal:placeSeal,onShape:()=>setShape(n=>n+1)});engine.current=e;await e.ready;if(dead)return;setGl(true);
    if(openedRef.current){matchMedia('(prefers-reduced-motion: reduce)').matches?(e.finish(),onComplete(true)):e.play(()=>onComplete(true))}}
   catch{setGl(false)}}).catch(()=>setGl(false));
  return()=>{dead=true;engine.current?.destroy();engine.current=null};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[shape]);
 const first=useRef(true);
 useEffect(()=>{if(first.current){first.current=false;return}engine.current?.setCard(card)
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[cardKey]);
 useEffect(()=>{const e=engine.current,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(gl&&e){if(!opened){e.reset();return}if(reduced){e.finish();onComplete(true);return}e.play(()=>onComplete(true));return}
  if(!opened)return;const timer=setTimeout(()=>onComplete(true),reduced?0:2850);return()=>clearTimeout(timer)},[opened,onComplete,gl]);
 return <div className={`sage-envelope-scene ${gl?'sage-3d':''}`} aria-hidden="true">
  <div className="sage-envelope-body"/>
  <div className="sage-envelope-pocket"/>
  <div className="sage-envelope-flap">
   <div className="sage-envelope-front"/>
   <div className="sage-envelope-lining"/>
   <div className="sage-wax-release"><img src="/maison-wax-seal.png" width="168" height="168" alt=""/></div>
  </div>
  <div className="sage-envelope-print">You are invited</div>
  <svg className="sage-flap-seam" viewBox="0 0 100 100" preserveAspectRatio="none"><path className="sage-flap-seam-shadow" d="M0 31 L50 48 L100 31"/><path className="sage-flap-seam-light" d="M0 30.5 L50 47.5 L100 30.5"/></svg>
  <canvas ref={canvas} className="sage-envelope-canvas"/>
 </div>;
}
export function CinemaCollection({onPreview,onCreate,notify,onBeachDemo,occasion='All designs',onOccasionChange,lang='en'}){
 const [copied,setCopied]=useState(''),[showAll,setShowAll]=useState(true);
 const [family,setFamily]=useState(()=>new URLSearchParams(location.search).get('collection')==='ivory'?'ivory':'all');
 const [audienceChoice,setAudienceChoice]=useState({occasion,audience:'all'});
 const audience=audienceChoice.occasion===occasion?audienceChoice.audience:'all';
 const matching=filterInvitationDesigns(cinemaThemes,{occasion,family,audience});
 const labels={de:{'All designs':'Alle Anlässe',Wedding:'Hochzeit',Birthday:'Geburtstag',Engagement:'Verlobung','Baby shower':'Babyparty',Graduation:'Abschluss','Dinner party':'Dinnerparty',Anniversary:'Jubiläum','Corporate event':'Firmenevent',Christening:'Taufe','Seasonal celebration':'Saisonfest',all:'Alle Designs',ribbon:'Schleifen & Türen',ivory:'Elfenbein & Papier',other:'Filme & mehr',Boys:'Jungen',Girls:'Mädchen',Neutral:'Neutral'},fr:{'All designs':'Toutes les occasions',Wedding:'Mariage',Birthday:'Anniversaire',Engagement:'Fiançailles','Baby shower':'Fête prénatale',Graduation:'Remise de diplôme','Dinner party':'Dîner',Anniversary:'Anniversaire de mariage','Corporate event':'Événement professionnel',Christening:'Baptême','Seasonal celebration':'Fête de saison',all:'Tous les modèles',ribbon:'Rubans & portes',ivory:'Ivoire & papier',other:'Films & plus',Boys:'Garçons',Girls:'Filles',Neutral:'Neutre'}};
 const familyLabels={all:'All styles',ribbon:'Ribbon & doors',ivory:'Ivory & paper',other:'Films & more'};
 const label=o=>labels[lang]?.[o]||o;
 const eventFor=t=>cinemaEvent(t,defaultEvent(templates.find(x=>x.occasion===t.occasion)||templates[0]));
 async function copy(t){try{await navigator.clipboard.writeText(location.origin+'/?cinema='+t.id);setCopied(t.id);notify('Preview link copied')}catch{notify('Open the invitation and copy its address')}}
 return <main className="atelier-collection">
  <header className="atelier-collection-heading"><span>THE SIGNATURE COLLECTION</span><h1>A little wonder.<br/><em>A beautiful beginning.</em></h1><p>Invitations to unfold, enter, and explore.<br/>Open once. Let the story continue as you scroll.</p></header>
  <nav className="occasion-filters" aria-label="Filter invitation occasion">{['All designs',...occasionScenes.map(t=>t.occasion)].map(o=><button key={o} type="button" aria-pressed={occasion===o} className={occasion===o?'selected':''} onClick={()=>{onOccasionChange?.(o);setShowAll(true)}}>{label(o)} <span>{filterInvitationDesigns(cinemaThemes,{occasion:o,family,audience}).length}</span></button>)}</nav>
  <nav className="invitation-family-filters" aria-label="Design family">{Object.entries(familyLabels).map(([id,name])=><button key={id} type="button" aria-pressed={family===id} className={family===id?'selected':''} onClick={()=>{setFamily(id);setShowAll(true)}}>{labels[lang]?.[id]||name}</button>)}</nav>
  <nav className="invitation-audience-filters" aria-label="Design audience">{['all','Boys','Girls','Neutral'].map(a=><button key={a} type="button" aria-pressed={audience===a} className={audience===a?'selected':''} onClick={()=>{setAudienceChoice({occasion,audience:a});setShowAll(true)}}>{a==='all'?({de:'Alle Gäste',fr:'Tous les invités'}[lang]||'All audiences'):label(a)}</button>)}</nav>
  <p className="occasion-results" role="status">{matching.length} {occasion==='All designs'?'animated invitations':label(occasion)+(matching.length===1?' invitation':' invitations')}</p>
  <div className="atelier-three">{(showAll?matching:matching.slice(0,6)).map((t,i)=><article key={t.id}>
   <button className={'atelier-poster poster-'+t.kind} style={sceneVariables(t)} onClick={()=>onPreview(eventFor(t))} aria-label={'Experience '+t.name}>
    <img src={'/'+t.cover+'-sm.webp'} srcSet={'/'+t.cover+'-sm.webp 600w, /'+t.cover+'.webp 941w'} sizes="(max-width: 760px) 90vw, 30vw" width="600" height="1066" loading="lazy" decoding="async" alt={t.name+' invitation artwork'}/>
    {t.kind==='rose'?<RibbonPreview/>:t.kind==='sage'?<img className="atelier-wax" src="/maison-wax-seal.png" alt=""/>:t.kind==='ivory'?<IvoryPlaque names={t.names} shape={t.plaqueShape||(t.id==='woodland-wish'?'woodland-keepsake':'ivory')} palette={t}/>:null}
    {['graduation','graduation-curtain'].includes(t.kind)&&<span className="birthday-poster-title graduation-poster-title"><small>THE FUTURE IS YOURS</small>{t.kind==='graduation-curtain'?'The Crimson Ovation':'The next chapter'}</span>}
    {t.kind==='birthday'&&<><span className="birthday-poster-title"><small>A LITTLE SOMETHING JUST FOR YOU</small>A birthday worth the noise</span><span className="birthday-poster-gift" aria-hidden="true">✦</span></>}
    {['film','story'].includes(t.kind)&&<span className="film-poster-title"><small>{t.kind==='film'?'A FILM INVITATION':'A FAIRYTALE FILM'}</small>{t.name}</span>}
    {t.kind==='craft'&&<span className="craft-poster-copy"><small>HAND-STITCHED WITH LOVE</small>{t.names.split('&')[0]}<em>&amp;</em>{t.names.split('&')[1]}</span>}
    <span className="poster-open">Open the invitation <ArrowRight size={14}/></span>
   </button>
   <div className="atelier-caption"><span>{String(i+1).padStart(2,'0')} / {t.tag}</span><h2>{t.name}</h2><div><button onClick={()=>onCreate(eventFor(t))}>Make it yours <ArrowRight size={14}/></button><button onClick={()=>copy(t)} aria-label={'Copy '+t.name+' preview link'}>{copied===t.id?<Check size={15}/>:<Copy size={15}/>}</button></div></div>
  </article>)}{family==='all'&&audience==='all'&&(occasion==='All designs'||occasion==='Wedding')&&<BeachDemoCard onPlay={onBeachDemo}/>}</div>
  {matching.length===0&&<div className="invitation-filter-empty"><p>No designs match these filters yet.</p><button className="lx-btn lx-btn-line" onClick={()=>{setFamily('all');setAudienceChoice({occasion,audience:'all'})}}>Show all styles and audiences</button></div>}
  {matching.length>6&&<div className="lx-center"><button className="lx-btn lx-btn-line" onClick={()=>setShowAll(!showAll)}>{showAll?'Show signature selection':'Explore all '+matching.length+' animated designs'}</button></div>}
  <p className="atelier-collection-note">Sample names and dates. Personalise every detail in the invitation studio.</p>
 </main>;
}
