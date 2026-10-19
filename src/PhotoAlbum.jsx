import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import './photoAlbum.css';

export default function PhotoAlbum({ photos = [], title = 'Our beautiful moments', design = 'ivory', onDesign, loadPhoto }) {
  const [spread,setSpread]=useState(0),[turn,setTurn]=useState(null),[opened,setOpened]=useState(false),[images,setImages]=useState({});
  const timer=useRef(null),touch=useRef(null),busy=useRef(false);
  const count=Math.max(1,Math.ceil(photos.length/2)),current=Math.min(spread,count-1);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useEffect(()=>{let live=true;if(!loadPhoto)return;const visible=photos.slice(Math.max(0,current*2-2),current*2+4);for(const p of visible){if(!p.id||images[p.id])continue;loadPhoto(p).then(url=>{if(live&&url)setImages(old=>({...old,[p.id]:url}))}).catch(()=>{});}return()=>{live=false}},[current,photos,loadPhoto]);
  function move(dir){if(!opened||busy.current||current+dir<0||current+dir>=count)return;busy.current=true;setTurn(dir);timer.current=setTimeout(()=>{setSpread(current+dir);setTurn(null);busy.current=false},matchMedia('(prefers-reduced-motion: reduce)').matches?0:1250)}
  function page(index,side){const p=photos[index];return <div className={'album-page '+side}><div className="album-photo-mount">{p?<img src={images[p.id]||p.thumb||p.image} alt={p.body||'A celebration memory'} draggable="false"/>:<div className="album-unwritten"><span>❦</span><p>Room for another<br/>beautiful memory.</p></div>}</div><p className="album-caption">{p?.body|| (p?'A moment to keep, always.':'Our story continues…')}</p><span className="album-page-number">{String(index+1).padStart(2,'0')}</span></div>}
  return <section className={'photo-album album-'+design} aria-label="Magical photo album"><div className="album-toolbar"><span><BookOpen size={17}/>The memory book</span>{onDesign&&<label>Album design<select value={design} onChange={e=>onDesign(e.target.value)}><option value="ivory">Ivory garden</option><option value="rose">Rose velvet</option><option value="midnight">Midnight & gold</option></select></label>}</div><div className="album-stage" tabIndex={0} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}}} onTouchStart={e=>{touch.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touch.current==null)return;const dx=e.changedTouches[0].clientX-touch.current;if(Math.abs(dx)>45)move(dx<0?1:-1);touch.current=null}}>
      <div className={'album-book '+(!opened?'album-closed':'')}>
        <div className="album-board"/>
        <div className="album-spread">{page(current*2,'left')}{page(current*2+1,'right')}</div>
        {turn&&<><div className="album-under-page">{page(turn===1?(current+1)*2+1:(current-1)*2,turn===1?'right':'left')}</div><CurledLeaf direction={turn} front={page(turn===1?current*2+1:(current-1)*2+1,'right')} back={page(turn===1?(current+1)*2:current*2,'left')}/></>}
        <button className="album-cover" onClick={()=>setOpened(true)} tabIndex={opened?-1:0} aria-hidden={opened} aria-label="Open photo album"><span className="album-cover-frame"><small>MAISON · A STORY TO KEEP</small><span className="album-cover-flower">❦</span><strong>{title}</strong><em>The memories live on.</em><span className="album-cover-open">OPEN THE ALBUM →</span></span></button>
      </div>
    </div><div className="album-navigation"><button aria-label="Previous album pages" disabled={!opened||current===0||!!turn} onClick={()=>move(-1)}><ChevronLeft size={19}/></button><p aria-live="polite">{opened?`Pages ${current*2+1}–${current*2+2} · ${photos.length} ${photos.length===1?'photo':'photos'}`:'A little book of your favourite moments'}</p><button aria-label="Next album pages" disabled={!opened||current>=count-1||!!turn} onClick={()=>move(1)}><ChevronRight size={19}/></button></div>{opened&&<button className="album-close" onClick={()=>setOpened(false)}>Close the book</button>}<small className="album-hint">Swipe or use the arrows to turn the pages.</small></section>;
}
function CurledLeaf({direction,front,back}){
 const root=useRef(null),strips=useRef([]),frame=useRef(null),segments=24;
 useLayoutEffect(()=>{
   const width=root.current.offsetWidth;
   root.current.style.setProperty('--album-page-width',width+'px');
   const start=performance.now();
   function animate(now){
     const raw=Math.min(1,(now-start)/1250),t=raw*raw*(3-2*raw);
     let x=0,z=0;
     for(let i=0;i<segments;i++){
       const u=(i+.5)/segments;
       const angle=(direction===1?-Math.PI*t:Math.PI+Math.PI*t)+.55*Math.sin(Math.PI*t)*Math.sin(Math.PI*u);
       const node=strips.current[i];
       if(node){node.style.transform=`translate3d(${x}px,0,${z}px) rotateY(${angle}rad)`;node.style.setProperty('--curl-shade',String(.22*Math.sin(Math.PI*t)*(1-u)+.015));}
       x+=Math.cos(angle)*width/segments;z-=Math.sin(angle)*width/segments;
     }
     if(raw<1)frame.current=requestAnimationFrame(animate);
   }
   animate(start);
   return()=>cancelAnimationFrame(frame.current);
 },[direction]);
 return <div ref={root} className="album-curled-leaf" aria-hidden="true">{Array.from({length:segments},(_,i)=><div key={i} ref={node=>{strips.current[i]=node}} className="album-paper-strip" style={{width:`calc(${100/segments}% + 1px)`}}><div className="album-strip-front"><div style={{width:'var(--album-page-width)',left:`calc(var(--album-page-width) * ${-i/segments})`}}>{front}</div></div><div className="album-strip-back"><div style={{width:'var(--album-page-width)',left:`calc(var(--album-page-width) * ${-(segments-1-i)/segments})`}}>{back}</div></div></div>)}</div>
}

