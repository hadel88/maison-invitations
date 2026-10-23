import {ornamentGlyph} from './invitationMaterials';
import {traceSageFlap} from './sageEnvelopeProfiles.js';

export const SAGE_OUTSIDE={width:600,height:1066,flap:576,sealX:195,sealY:407,sealWidth:210,sealHeight:192};

// A broad pressed-paper bevel. Blending preserves the stock's own colour and grain.
export function paintPaperEdge(target,layout='arch',pocket=false){
 const g=target.getContext('2d');
 g.save();g.scale(target.width/600,target.height/1066);g.beginPath();
 if(pocket){
  g.moveTo(0,1066);g.lineTo(600,1066);g.lineTo(600,170.56);
  g.quadraticCurveTo(331.98,307.008,300,319.8);
  g.quadraticCurveTo(268.02,307.008,0,170.56);g.closePath();
 }else{
  g.save();g.translate(300,0);g.scale(1,-1);traceSageFlap(g,600,576,layout);g.restore();
 }
 g.clip();
 // Finish only the free paper edge; the hinge must stay continuous and unpainted.
 g.beginPath();g.rect(-30,40,660,990);g.clip();
 g.beginPath();
 if(pocket){
  g.moveTo(600,170.56);g.quadraticCurveTo(331.98,307.008,300,319.8);
  g.quadraticCurveTo(268.02,307.008,0,170.56);
 }else{
  g.save();g.translate(300,0);g.scale(1,-1);traceSageFlap(g,600,576,layout);g.restore();
 }
 g.lineJoin='round';g.lineCap='round';
 g.globalCompositeOperation='multiply';
 g.strokeStyle='rgba(35,31,25,.38)';g.lineWidth=26;g.stroke();
 g.globalCompositeOperation='screen';
 g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=21;g.stroke();
 g.globalCompositeOperation='multiply';
 g.strokeStyle='rgba(65,58,46,.13)';g.lineWidth=12;g.stroke();
 g.globalCompositeOperation='screen';
 g.strokeStyle='rgba(255,255,255,.38)';g.lineWidth=3;g.stroke();
 g.restore();
}

// Shared printed artwork. Geometry, camera and opening movement are deliberately separate.
export function paintEnvelopeArtwork(target,stock,design={},inviteLine='You are invited',guestLine=''){
 const g=target.getContext('2d');
 g.drawImage(stock,0,0,target.width,target.height);
 g.save();g.scale(target.width/600,target.height/1066);
 g.fillStyle=design.ink||'#46513e';g.textAlign='center';
 g.font='52px "Great Vibes", cursive';g.fillText(inviteLine,300,735,500);
 g.font=guestLine?'italic 38px "Cormorant Garamond", Georgia':'30px Georgia';
 g.fillText(guestLine||ornamentGlyph(design.ornament),300,guestLine?842:855,500);
 g.restore();
}
