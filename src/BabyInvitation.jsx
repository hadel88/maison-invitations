import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowDown,Heart,RotateCcw,SkipForward} from 'lucide-react';
import {dateLabel} from './catalog';
import {ensureFont} from './fonts';
import {filmWords,tonePhoto} from './FilmInvitation';
import {createBabyRenderer} from './babyGL';
import TRACK from './babyFilm.json';
import './babyFilm.css';

const FILM={src:'/baby-film.mp4',poster:'/baby-film-poster.webp',end:'/baby-film-end.webp'};
const text={
 en:{open:'Enter our little wonder',skip:'Skip to the invitation',failed:'The film could not play. Your invitation is ready below.',occasion:'A BABY SHOWER',welcome:'A little wonder is on the way',join:'Join us to celebrate',ask:'Will you share this little wonder?'},
 de:{open:'Unser kleines Wunder entdecken',skip:'Direkt zur Einladung',failed:'Der Film konnte nicht abgespielt werden. Deine Einladung ist bereit.',occasion:'BABYPARTY',welcome:'Ein kleines Wunder ist unterwegs',join:'Feiert mit uns',ask:'Feierst du unser kleines Wunder mit uns?'},
 fr:{open:'Découvrir notre petit bonheur',skip:'Voir l’invitation',failed:'Le film ne peut pas être lu. Votre invitation est prête.',occasion:'UNE BABY SHOWER',welcome:'Un petit bonheur arrive',join:'Venez célébrer avec nous',ask:'Partagerez-vous ce petit bonheur ?'}
};
function cropPhoto(source,aspect){
  if(!source)return null;const c=document.createElement('canvas');c.width=Math.round(800*aspect);c.height=800;
  let w=source.width,h=source.height,x=0,y=0;if(w/h>aspect){w=h*aspect;x=(source.width-w)/2;}else{h=w/aspect;y=(source.height-h)*.3;}
  c.getContext('2d').drawImage(source,x,y,w,h,0,0,c.width,c.height);return c;
}
function babyLines(event,lang){const w=text[lang]||text.en;return {w,names:event.names||'',date:dateLabel(event.date,lang,{day:'numeric',month:'long',year:'numeric'})};}
export function BabyCard({event,lang,font}){
 const {w,names,date}=babyLines(event,lang);
 return <div className="film-card-face baby-card-face"><span className="baby-card-spark" aria-hidden="true">✧</span><span className="film-card-over">{w.occasion}</span><p className="baby-card-welcome">{w.welcome}</p><span className="baby-card-join">{w.join}</span><h2 className="film-card-names" style={{fontFamily:font.family}}>{names}</h2><div className="film-card-rule"/><p className="film-card-date">{date}</p><p className="film-card-date">{event.time}</p><p className="film-card-venue">{event.venue}</p><p className="film-card-address">{event.address}</p><p className="film-card-line">{event.subtitle||''}</p></div>;
}
async function cardWords(event,lang,family){
 try{await document.fonts.load(`60px ${family}`);}catch{/* system fallback */}
 const {w,names,date}=babyLines(event,lang),c=document.createElement('canvas');c.width=870;c.height=1450;const g=c.getContext('2d');
 const bg=g.createLinearGradient(0,0,870,1450);bg.addColorStop(0,'#fff9e8');bg.addColorStop(1,'#e9dec1');g.fillStyle=bg;g.fillRect(0,0,870,1450);
 g.strokeStyle='#bc9d59';g.lineWidth=5;g.strokeRect(25,25,820,1400);g.lineWidth=2;g.strokeRect(42,42,786,1366);
 g.textAlign='center';g.textBaseline='middle';
 function line(value,y,size,max=740,familyName='Georgia'){while(size>20){g.font=`${size}px ${familyName}`;if(g.measureText(value).width<=max)break;size-=2;}g.fillText(value,435,y,max);}
 g.fillStyle='#ae8945';line('✧',145,80);line(w.occasion,255,31);g.fillStyle='#4d5b38';
 const welcome=w.welcome.split(' '),mid=Math.ceil(welcome.length/2);line(welcome.slice(0,mid).join(' '),370,60);line(welcome.slice(mid).join(' '),450,60);
 line(w.join,590,30);line(names,725,100,740,family);g.fillStyle='#b2975a';g.fillRect(335,860,200,2);g.fillStyle='#4d5b38';
 line(date,960,39);line(event.time||'',1030,33);line(event.venue||'',1130,43);line(event.address||'',1200,30);line(event.subtitle||'',1310,28);return c;
}

export function BabyStage({event,guest,opened,onOpen,onReplay,onAnswer,lang='en'}){
  const words=text[lang]||text.en,c={...(filmWords[lang]||filmWords.en),ask:words.ask},font=ensureFont(event.font&&event.font!=='classic'?event.font:'vibes');
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
    try{e=createBabyRenderer(canvas.current,video.current,TRACK);engine.current=e;}catch{setGl(false);setFailure(true);}
    canvas.current?.addEventListener('webglcontextlost',lost);const el=canvas.current;
    return()=>{dead.current=true;clear();el?.removeEventListener('webglcontextlost',lost);e?.destroy();engine.current=null;};
  },[]);
  useEffect(()=>{
    let cancelled=false;const e=engine.current;if(!e)return;
    Promise.all(own.map(p=>p?tonePhoto(p):null)).then(photos=>{
      if(cancelled)return;
      for(let i=0;i<4;i++){const source=photos[i]||photos.find(Boolean);e.setLayer('pmemory'+(i+1),cropPhoto(source,.65));}
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
  return <section className={'baby-stage baby-is-'+phase} aria-label="A Little Wonder invitation">
    <div className="baby-backdrop" style={{backgroundImage:`url(${FILM.end})`}} aria-hidden="true"/>
    <div className="baby-film-frame">
      <video ref={video} poster={FILM.poster} muted playsInline preload="metadata" onSeeked={()=>engine.current?.draw(video.current.currentTime)} onLoadedData={()=>engine.current?.draw(video.current.currentTime)} onEnded={finish} onError={()=>{if(opened){setFailure(true);finish();}}} aria-hidden="true"><source src={FILM.src} type="video/mp4"/></video>
      {phase==='idle'&&<img className="baby-still" src={FILM.poster} alt=""/>}
      {shown&&<img className="baby-still" src={FILM.end} alt=""/>}
      <canvas ref={canvas} className="baby-canvas" aria-hidden="true" style={{visibility:gl&&phase==='playing'?'visible':'hidden'}}/>
      <div ref={slot} className="baby-end-anchor" aria-hidden="true"/>
    </div>
    {phase==='idle'&&<div className="film-welcome baby-welcome"><div className="film-welcome-top"><span>{guest?.name?guest.name.toUpperCase()+', ':''}{c.invited}</span><h1 style={{fontFamily:font.family}}>{names.map((n,i)=><React.Fragment key={i}>{i>0&&<em>&amp;</em>}<span>{n}</span></React.Fragment>)}</h1></div><button className="film-open" onClick={onOpen} aria-label={words.open}><span className="film-open-seal">{names.map(n=>n.trim()[0]).join('')}</span><span className="film-open-text">{words.open}</span></button></div>}
    {phase==='playing'&&<button className="baby-skip" onClick={finish}><SkipForward size={13}/>{words.skip}</button>}
    {shown&&<div className="film-present baby-present"><div ref={present} className="film-card film-card-big" style={flip?{transform:`translate(${flip.x}px,${flip.y}px) scale(${flip.s})`,transition:'none'}:undefined}><BabyCard event={event} lang={lang} font={font}/></div>{failure&&<p className="baby-error" role="status">{words.failed}</p>}<div className="film-ask" aria-hidden={phase!=='ask'}><p>{c.ask}</p><div><button className="film-yes" disabled={phase!=='ask'} onClick={()=>onAnswer?.('yes')}><Heart size={15}/>{c.yes}</button><button className="film-no" disabled={phase!=='ask'} onClick={()=>onAnswer?.('no')}>{c.no}</button></div><button className="film-more" disabled={phase!=='ask'} onClick={()=>onAnswer?.(null)}>{c.more}<ArrowDown size={14}/></button></div></div>}
    {phase==='ask'&&<button className="film-replay" aria-label={c.replay} onClick={onReplay}><RotateCcw size={15}/></button>}
  </section>;
}
