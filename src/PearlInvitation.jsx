import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowDown,Heart,RotateCcw,SkipForward} from 'lucide-react';
import {dateLabel} from './catalog';
import {ensureFont} from './fonts';
import {CardFace,filmWords,tonePhoto} from './FilmInvitation';
import {createPearlRenderer} from './pearlGL';
import TRACK from './pearlFilm.json';
import './pearlFilm.css';

const FILM={src:'/pearl-film.mp4',poster:'/pearl-film-poster.webp',end:'/pearl-film-end.webp'};
const text={en:{open:'Open our storybook',skip:'Skip to the invitation',failed:'The film could not play. Your invitation is ready below.'},de:{open:'Unser Geschichtenbuch öffnen',skip:'Direkt zur Einladung',failed:'Der Film konnte nicht abgespielt werden. Deine Einladung ist bereit.'},fr:{open:'Ouvrir notre livre',skip:'Voir l’invitation',failed:'Le film ne peut pas être lu. Votre invitation est prête.'}};
function cropPhoto(source,aspect){
  if(!source)return null;const c=document.createElement('canvas');c.width=Math.round(800*aspect);c.height=800;
  let w=source.width,h=source.height,x=0,y=0;if(w/h>aspect){w=h*aspect;x=(source.width-w)/2;}else{h=w/aspect;y=(source.height-h)*.3;}
  c.getContext('2d').drawImage(source,x,y,w,h,0,0,c.width,c.height);return c;
}
async function cardWords(event,lang,family){
  try{await document.fonts.load(`60px ${family}`);}catch{/* system fallback */}
  const c=document.createElement('canvas');c.width=870;c.height=1050;const g=c.getContext('2d');g.textAlign='center';g.textBaseline='middle';
  const fit=(value,start,max)=>{let size=start;do{g.font=`${size}px ${family}`;size-=3;}while(g.measureText(value).width>max&&size>27);};
  const names=event.names.split(/\s*&\s*/);g.fillStyle='#74533a';g.font='25px Georgia';g.fillText((filmWords[lang]||filmWords.en).families,435,100,790);
  if(names.length>1){fit(names[0],112,790);g.fillText(names[0],435,280,790);g.fillStyle='#b38a4b';g.font=`62px ${family}`;g.fillText('&',435,385);g.fillStyle='#74533a';fit(names.slice(1).join(' & '),112,790);g.fillText(names.slice(1).join(' & '),435,490,790);}
  else{fit(event.names,112,790);g.fillText(event.names,435,385,790);}
  g.fillStyle='#ac8b5c';g.fillRect(335,610,200,2);g.fillStyle='#74533a';g.font='34px Georgia';g.fillText(dateLabel(event.date,lang,{day:'numeric',month:'long',year:'numeric'}),435,705,790);
  g.font='italic 34px Georgia';g.fillText(event.time||'',435,775);g.font='40px Georgia';g.fillText(event.venue||'',435,865,800);g.font='29px Georgia';g.fillText(event.address||'',435,935,800);return c;
}

export function PearlStage({event,guest,opened,onOpen,onReplay,onAnswer,lang='en'}){
  const c=filmWords[lang]||filmWords.en,words=text[lang]||text.en,font=ensureFont(event.font&&event.font!=='classic'?event.font:'vibes');
  const video=useRef(null),canvas=useRef(null),engine=useRef(null),slot=useRef(null),present=useRef(null),timers=useRef([]),dead=useRef(false);
  const [phase,setPhase]=useState('idle'),[gl,setGl]=useState(true),[failure,setFailure]=useState(false),[flip,setFlip]=useState(null),[reduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const own=[event.photo,event.photo2,event.photo3,event.photo4].map(p=>typeof p==='string'&&p.startsWith('data:image/')?p:null);
  const clear=()=>{timers.current.forEach(clearTimeout);timers.current=[];};
  const later=(ms,fn)=>timers.current.push(setTimeout(()=>{if(!dead.current)fn();},ms));
  function centreCard(){video.current?.closest('.guest-experience')?.scrollTo({top:0,behavior:'instant'});}
  function finish(){video.current?.pause();engine.current?.stop();setPhase('present');centreCard();}
  useEffect(()=>{
    dead.current=false;let e;
    const lost=ev=>{ev.preventDefault();setGl(false);setFailure(true);video.current?.pause();engine.current?.stop();setPhase('present');};
    try{e=createPearlRenderer(canvas.current,video.current,TRACK);engine.current=e;}catch{setGl(false);setFailure(true);}
    canvas.current?.addEventListener('webglcontextlost',lost);const el=canvas.current;
    return()=>{dead.current=true;clear();el?.removeEventListener('webglcontextlost',lost);e?.destroy();engine.current=null;};
  },[]);
  useEffect(()=>{let cancelled=false;const image=new Image();image.onload=()=>{if(!cancelled){engine.current?.setLayer('ttransition',image);if(video.current?.readyState>=2)engine.current?.draw(video.current.currentTime);}};image.src='/pearl-film-transition.webp';return()=>{cancelled=true;};},[gl]);
  useEffect(()=>{
    let cancelled=false;const e=engine.current;if(!e)return;
    Promise.all(own.map(p=>p?tonePhoto(p):null)).then(photos=>{
      if(cancelled)return;
      for(let i=0;i<4;i++){const source=photos[i]||photos.find(Boolean);e.setLayer('p'+(i+1),cropPhoto(source,[.74,.67,.7,.68][i]));}
      e.setLayer('p4back',cropPhoto(photos[3]||photos.find(Boolean),.68));
      e.setLayer('pbook1',cropPhoto(photos[0]||photos.find(Boolean),.85));e.setLayer('pbook2',cropPhoto(photos[1]||photos[0]||photos.find(Boolean),.85));
      if(video.current?.readyState>=2)e.draw(video.current.currentTime);
    });return()=>{cancelled=true;};
  },[event.photo,event.photo2,event.photo3,event.photo4,gl]);
  useEffect(()=>{let cancelled=false;cardWords(event,lang,font.family).then(image=>{if(!cancelled){engine.current?.setLayer('tcard',image);if(video.current?.readyState>=2)engine.current?.draw(video.current.currentTime);}});return()=>{cancelled=true;};},[event.names,event.date,event.time,event.venue,event.address,lang,font.family,gl]);
  useEffect(()=>{
    const v=video.current;
    if(!opened){clear();setPhase('idle');setFlip(null);engine.current?.stop();v?.pause();if(v)v.currentTime=0;return;}
    if(reduced||!gl||!v){setPhase('present');return;}
    setPhase('playing');engine.current?.start();v.play()?.catch(error=>{if(error.name==='AbortError')return;if(!dead.current){setFailure(true);finish();}});
  },[opened]);
  useLayoutEffect(()=>{
    if(phase!=='present')return;const a=slot.current?.getBoundingClientRect(),b=present.current?.getBoundingClientRect();
    if(!a||!b?.width||reduced){setPhase('ask');centreCard();return;}
    setFlip({x:a.left+a.width/2-b.left-b.width/2,y:a.top+a.height/2-b.top-b.height/2,s:a.width/b.width});
    const r1=requestAnimationFrame(()=>{const r2=requestAnimationFrame(()=>setFlip(null));timers.current.push(setTimeout(()=>cancelAnimationFrame(r2),1400));});
    later(1350,()=>{setPhase('ask');centreCard();});return()=>cancelAnimationFrame(r1);
  },[phase]);
  const shown=['present','ask'].includes(phase),names=event.names.split(/\s*&\s*/);
  return <section className={'pearl-stage pearl-is-'+phase} aria-label="Pearl & Promise invitation">
    <div className="pearl-backdrop" style={{backgroundImage:`url(${FILM.end})`}} aria-hidden="true"/>
    <div className="pearl-film-frame">
      <video ref={video} poster={FILM.poster} muted playsInline preload="metadata" onSeeked={()=>engine.current?.draw(video.current.currentTime)} onLoadedData={()=>engine.current?.draw(video.current.currentTime)} onEnded={finish} onError={()=>{if(opened){setFailure(true);finish();}}} aria-hidden="true"><source src={FILM.src} type="video/mp4"/></video>
      {phase==='idle'&&<img className="pearl-still" src={FILM.poster} alt=""/>}
      {shown&&<img className="pearl-still" src={FILM.end} alt=""/>}
      <canvas ref={canvas} className="pearl-canvas" aria-hidden="true" style={{visibility:gl&&phase==='playing'?'visible':'hidden'}}/>
      <div ref={slot} className="pearl-end-anchor" aria-hidden="true"/>
    </div>
    {phase==='idle'&&<div className="film-welcome pearl-welcome"><div className="film-welcome-top"><span>{guest?.name?guest.name.toUpperCase()+', ':''}{c.invited}</span><h1 style={{fontFamily:font.family}}>{names.map((n,i)=><React.Fragment key={i}>{i>0&&<em>&amp;</em>}<span>{n}</span></React.Fragment>)}</h1></div><button className="film-open" onClick={onOpen} aria-label={words.open}><span className="film-open-seal">{names.map(n=>n.trim()[0]).join('')}</span><span className="film-open-text">{words.open}</span></button></div>}
    {phase==='playing'&&<button className="pearl-skip" onClick={finish}><SkipForward size={13}/>{words.skip}</button>}
    {shown&&<div className="film-present pearl-present"><div ref={present} className="film-card film-card-big" style={flip?{transform:`translate(${flip.x}px,${flip.y}px) scale(${flip.s})`,transition:'none'}:undefined}><CardFace event={event} lang={lang} c={c} font={font}/></div>{failure&&<p className="pearl-error" role="status">{words.failed}</p>}<div className="film-ask" aria-hidden={phase!=='ask'}><p>{c.ask}</p><div><button className="film-yes" disabled={phase!=='ask'} onClick={()=>onAnswer?.('yes')}><Heart size={15}/>{c.yes}</button><button className="film-no" disabled={phase!=='ask'} onClick={()=>onAnswer?.('no')}>{c.no}</button></div><button className="film-more" disabled={phase!=='ask'} onClick={()=>onAnswer?.(null)}>{c.more}<ArrowDown size={14}/></button></div></div>}
    {phase==='ask'&&<button className="film-replay" aria-label={c.replay} onClick={onReplay}><RotateCcw size={15}/></button>}
  </section>;
}
