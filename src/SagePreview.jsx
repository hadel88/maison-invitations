import React,{useEffect,useRef} from 'react';
import {paperStock,ornamentGlyph,invitationScript,waxStock} from './invitationMaterials';
import {traceSageFlap} from './sageEnvelopeProfiles.js';
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
export default function SagePreview({theme,inviteLine='You are invited',guestLine=''}){
 const ref=useRef(null);
 useEffect(()=>{let dead=false;Promise.all([load(`/${theme.materialCover || 'atelier-sage-cover'}.webp`),load('/maison-wax-seal.png'),invitationScript()]).then(([cover,wax])=>{
  if(dead)return;const c=ref.current,g=c.getContext('2d');c.width=600;c.height=1000;
  const stock=paperStock(cover,theme);g.drawImage(stock,0,0,c.width,c.height);
  g.save();g.beginPath();g.save();g.translate(300,0);g.scale(1,-1);traceSageFlap(g,600,540,theme.pageLayout);g.restore();
  // Mask a fully painted layer: no solid-colour flap fallback on mobile canvas.
  const flap=document.createElement('canvas');flap.width=600;flap.height=1000;
  const fg=flap.getContext('2d');fg.drawImage(stock,0,0,600,1000);
  fg.globalCompositeOperation='destination-in';fg.beginPath();fg.save();fg.translate(300,0);fg.scale(1,-1);traceSageFlap(fg,600,540,theme.pageLayout);fg.restore();fg.fill();
  g.restore();g.save();g.shadowColor='#162014aa';g.shadowBlur=24;g.shadowOffsetY=13;g.drawImage(flap,0,0);g.restore();
  g.save();g.beginPath();g.translate(300,0);g.scale(1,-1);traceSageFlap(g,600,540,theme.pageLayout);g.setTransform(1,0,0,1,0,0);g.clip();g.strokeStyle='#ede8cfbb';g.lineWidth=14;g.stroke();g.restore();
  g.save();g.shadowColor='#15201099';g.shadowBlur=18;g.shadowOffsetY=12;g.drawImage(waxStock(wax,theme),196,377,208,190);g.restore();
  g.fillStyle=theme.ink;g.textAlign='center';g.textBaseline='middle';g.font='52px "Great Vibes", cursive';g.fillText(inviteLine,300,690,400);g.font=guestLine?'italic 38px "Cormorant Garamond", Georgia':'30px Georgia';g.fillText(guestLine||ornamentGlyph(theme.ornament),300,guestLine?790:802,500);
 }).catch(()=>{});return()=>{dead=true}},[theme,inviteLine,guestLine]);
 return <canvas ref={ref} className="sage-poster-canvas" aria-hidden="true"/>;
}
