import React, { useEffect, useRef } from 'react';
import { Check, ChevronRight, Heart, Mail, Sparkles, Users, Castle, Cake, WandSparkles } from 'lucide-react';
import './magicJourney.css';

export function journeyChapters(world, progress) {
  const birthday=world.occasion==='Birthday';
  return [
    [birthday?'Wishing Meadow':'Dream Garden','Choose your world',birthday?Sparkles:Heart],
    [birthday?'Invitation Post':'Invitation Palace','Your invitation, brought to life',Mail],
    [birthday?'Party Makers':'Artisan Pavilion','Your people & places',WandSparkles],
    [birthday?'Guest Lanterns':'Guest Constellation',`${progress.replies} ${progress.replies===1?'reply':'replies'} · ${progress.attending} attending`,Users],
    [world.stage,progress.days!==null?(progress.days>=0?`${progress.days} days to your celebration`:'Your beautiful memories'):'Your moment is waiting',birthday?Cake:Castle],
  ];
}
const points=[[.105,.65],[.285,.42],[.49,.70],[.705,.40],[.895,.63]];

function scenery(canvas,{birthday,theme,stages}) {
  const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
  const image=new Image(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=1,height=1,raf=0,dead=false;
  function route(a,b){const p=points[a],q=points[b],x=p[0]*width,y=p[1]*height,X=q[0]*width,Y=q[1]*height;ctx.moveTo(x,y);ctx.bezierCurveTo(x+(X-x)*.45,y,X-(X-x)*.45,Y,X,Y);}
  function draw(now=0){
    if(dead)return;ctx.clearRect(0,0,width,height);
    ctx.fillStyle=birthday?'#40383c':'#c8cbb7';ctx.fillRect(0,0,width,height);
    if(image.complete&&image.naturalWidth){const scale=Math.max(width/image.width,height/image.height);ctx.filter=theme==='midnight'?'brightness(.76) saturate(.92)':'none';ctx.drawImage(image,(width-image.width*scale)/2,(height-image.height*scale)/2,image.width*scale,image.height*scale);ctx.filter='none';}
    const shade=ctx.createLinearGradient(0,0,0,height);shade.addColorStop(0,'#0d233650');shade.addColorStop(.32,'#0d233600');shade.addColorStop(1,'#0d23365c');ctx.fillStyle=shade;ctx.fillRect(0,0,width,height);
    ctx.save();ctx.lineCap='round';ctx.lineWidth=13;ctx.strokeStyle='#fff1b52a';ctx.shadowColor='#ffdc86';ctx.shadowBlur=12;ctx.beginPath();for(let i=0;i<4;i++)route(i,i+1);ctx.stroke();
    ctx.lineWidth=2;ctx.setLineDash([2,8]);ctx.lineDashOffset=reduced?0:-now/130;ctx.strokeStyle='#f8e1aaaf';ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<5;i++)if(stages[i]){const [x,y]=points[i];ctx.beginPath();ctx.arc(x*width,y*height,20+(reduced?0:Math.sin(now/1200+i)*3),0,Math.PI*2);ctx.strokeStyle='#ffe5a3b0';ctx.lineWidth=2;ctx.stroke();}
    ctx.shadowBlur=0;ctx.restore();
    for(let i=0;i<26;i++){const x=(.04+(i*37%93)/100)*width+(reduced?0:Math.sin(now/2700+i)*7),y=(.20+(i*29%65)/100)*height+(reduced?0:Math.cos(now/3600+i)*8);ctx.globalAlpha=.15+.45*(.5+.5*Math.sin(now/900+i));ctx.fillStyle='#ffe8ab';ctx.beginPath();ctx.arc(x,y,1+(i%3)*.5,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    if(!reduced)raf=requestAnimationFrame(draw);
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);width=r.width;height=r.height;canvas.width=Math.max(1,Math.round(width*d));canvas.height=Math.max(1,Math.round(height*d));ctx.setTransform(d,0,0,d,0,0);if(reduced)draw();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();image.onload=()=>{if(reduced)draw();};image.src=birthday?'/map-birthday.webp':'/map-wedding.webp';draw();
  return()=>{dead=true;cancelAnimationFrame(raf);observer.disconnect();image.onload=null;};
}

export function MagicJourneyMap({world,progress,onAction,theme='garden',children}) {
  const canvas=useRef(null),birthday=world.occasion==='Birthday',stages=progress.stages||[],state=stages.map(Boolean).join(',');
  useEffect(()=>scenery(canvas.current,{birthday,theme,stages}),[birthday,theme,state]);
  return <div className={'journey-map magic-journey-map '+(birthday?'magic-map-birthday':'magic-map-wedding')+' theme-map-'+theme} aria-label={world.occasion+' fairytale journey map'}>
    <div className="magic-map-scroll" tabIndex={0} aria-label="Explore the five chapters of your journey">
      <div className="magic-map-scene">
        <canvas ref={canvas} className="magic-map-canvas" aria-hidden="true" />
        {journeyChapters(world,progress).map(([title,subtitle,Icon],i)=><button className={'magic-map-stop '+(stages[i]?'is-complete':'')} key={i} style={{left:points[i][0]*100+'%',top:points[i][1]*100+'%'}} onClick={()=>onAction?.(i)} aria-label={title+'. '+subtitle}>
          <span className="magic-stop-medallion"><Icon size={24} strokeWidth={1.2}/><i>{stages[i]?<Check size={10}/>:i+1}</i></span>
          <span className="magic-stop-copy"><strong>{title}</strong><small>{subtitle}</small></span>
        </button>)}
      </div>
    </div>
    {children || <div className="magic-map-heading"><span>{world.eyebrow}</span><strong>{world.name}</strong></div>}
    <span className="magic-map-caption">YOUR STORY UNFOLDS, ONE BEAUTIFUL STEP AT A TIME</span>
    <span className="magic-map-pan-hint">Swipe to explore all five chapters <ChevronRight size={12}/></span>
  </div>;
}
