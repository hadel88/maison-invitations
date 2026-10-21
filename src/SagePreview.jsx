import React,{useEffect,useRef} from 'react';
import {paperStock,ornamentGlyph,invitationScript} from './invitationMaterials';
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
export default function SagePreview({theme}){
 const ref=useRef(null);
 useEffect(()=>{let dead=false;Promise.all([load('/atelier-sage-cover.webp'),load('/maison-wax-seal.png'),invitationScript()]).then(([cover,wax])=>{
  if(dead)return;const c=ref.current,g=c.getContext('2d');c.width=600;c.height=1066;
  const stock=paperStock(cover,theme);g.drawImage(stock,0,0,c.width,c.height);
  g.save();g.beginPath();g.moveTo(0,0);g.lineTo(600,0);g.lineTo(600,320);g.quadraticCurveTo(450,460,300,576);g.quadraticCurveTo(150,460,0,320);g.closePath();
  g.shadowColor='#162014aa';g.shadowBlur=24;g.shadowOffsetY=13;g.fillStyle=theme.envelope;g.fill();g.clip();g.drawImage(stock,0,0,600,1066);
  g.shadowColor='transparent';g.strokeStyle='#ede8cfbb';g.lineWidth=14;g.stroke();g.restore();
  g.save();g.filter=`hue-rotate(${theme.waxHue||0}deg)`;g.shadowColor='#15201099';g.shadowBlur=18;g.shadowOffsetY=12;g.drawImage(wax,195,407,210,192);g.restore();
  g.fillStyle=theme.ink;g.textAlign='center';g.font='52px "Great Vibes", cursive';g.fillText('You are invited',300,735);g.font='30px Georgia';g.fillText(ornamentGlyph(theme.ornament),300,855);
 }).catch(()=>{});return()=>{dead=true}},[theme]);
 return <canvas ref={ref} className="sage-poster-canvas" aria-hidden="true"/>;
}
