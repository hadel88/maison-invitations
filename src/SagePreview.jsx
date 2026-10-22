import {paintEnvelopeArtwork} from './sageEnvelopeArtwork';
import React,{useEffect,useRef} from 'react';
import {paperStock,invitationScript,waxStock} from './invitationMaterials';
import {traceSageFlap} from './sageEnvelopeProfiles.js';
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
export default function SagePreview({theme,inviteLine='You are invited',guestLine=''}){
 const ref=useRef(null);
 useEffect(()=>{let dead=false;Promise.all([load(`/${theme.materialCover || 'atelier-sage-cover'}.webp`),load('/maison-wax-seal.png'),invitationScript()]).then(([cover,wax])=>{
  if(dead)return;const c=ref.current,g=c.getContext('2d');c.width=600;c.height=1066;
  const stock=paperStock(cover,theme);paintEnvelopeArtwork(c,stock,theme,inviteLine,guestLine);
  g.save();g.beginPath();g.save();g.translate(300,0);g.scale(1,-1);traceSageFlap(g,600,576,theme.pageLayout);g.restore();
  g.shadowColor='#162014aa';g.shadowBlur=24;g.shadowOffsetY=13;g.fillStyle=theme.envelope;g.fill();g.clip();g.drawImage(stock,0,0,600,1066);
  g.restore();
  g.save();g.shadowColor='#15201099';g.shadowBlur=18;g.shadowOffsetY=12;g.drawImage(waxStock(wax,theme),195,407,210,192);g.restore();
 }).catch(()=>{});return()=>{dead=true}},[theme,inviteLine,guestLine]);
 return <canvas ref={ref} className="sage-poster-canvas" aria-hidden="true"/>;
}
