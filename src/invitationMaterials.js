// Colour, height and fibre maps only. No geometry, camera or animation code.
export function paperCoverTile(imageWidth,imageHeight,textureWidth,textureHeight,envelopeWidth){
 const width=Math.max(textureWidth*.6/envelopeWidth,textureHeight*imageWidth/imageHeight);
 const height=imageHeight*width/imageWidth;
 return {width,height,top:(textureHeight-height)/2};
}
export function paperStock(image, design={}){
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
 const g=c.getContext('2d');g.drawImage(image,0,0);
 // Sculpted floral stocks retain their original relief and photographed highlights.
 if(design.materialCover)return c;
 if(design.envelopePattern && design.envelopePattern!=='botanical'){
  paintOccasionPaper(g,c.width,c.height,design);return c;
 }
 if(!design.envelope||design.id==='sage')return c;
 const rgb=design.envelope.match(/\w\w/g).map(v=>parseInt(v,16));
 const d=g.getImageData(0,0,c.width,c.height);
 for(let i=0;i<d.data.length;i+=4){const l=(d.data[i]*.3+d.data[i+1]*.59+d.data[i+2]*.11)/120;for(let j=0;j<3;j++)d.data[i+j]=Math.min(255,rgb[j]*l)}
 g.putImageData(d,0,0);
 g.save();g.globalAlpha=.28;g.textAlign='center';g.fillStyle=design.color||'#e6d1a1';g.font=`${Math.round(c.width*.055)}px Georgia`;
 for(const x of [c.width*.08,c.width*.92])for(const y of [.12,.32,.72,.9])g.fillText(ornamentGlyph(design.ornament),x,c.height*y);
 g.strokeStyle=design.color||'#e6d1a1';g.lineWidth=2;
 if(['geometric','diamonds','medallion'].includes(design.ornament))g.strokeRect(c.width*.04,c.height*.025,c.width*.92,c.height*.95);
 g.restore();return c;
}
// Distinct engraved stocks; the same canvas feeds both the gallery and the 3D paper.
function paintOccasionPaper(g,w,h,d){
 g.fillStyle=d.envelope;g.fillRect(0,0,w,h);
 const pixels=g.getImageData(0,0,w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,n=Math.sin(x*12.9898+y*78.233)*43758.5453;
  const grain=(n-Math.floor(n)-.5)*9+Math.sin(y*2.8)*1.5;
  for(let j=0;j<3;j++)pixels.data[i+j]+=grain;
 }g.putImageData(pixels,0,0);
 const step=w/5;g.lineWidth=w*.0018;g.strokeStyle=d.color;g.fillStyle=d.color;
 g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=1;g.shadowOffsetY=2;
 for(let row=0;row<Math.ceil(h/step)+1;row++)for(let col=-1;col<6;col++){
  const x=(col+(row%2)*.5)*step,y=row*step,r=step*.28;
  g.save();g.translate(x,y);g.globalAlpha=.48;g.beginPath();
  switch(d.envelopePattern){
   case 'trellis':g.moveTo(0,-r*1.8);g.lineTo(r,0);g.lineTo(0,r*1.8);g.lineTo(-r,0);g.closePath();break;
   case 'deco':for(let k=1;k<=4;k++){g.moveTo(-r*k/2,0);g.arc(0,0,r*k/2,Math.PI,0);}break;
   case 'clouds':g.moveTo(-r,r/2);g.bezierCurveTo(-r*2,-r,0,-r*2,r/2,-r/2);g.bezierCurveTo(r*2,-r/2,r*2,r,r,r);g.lineTo(-r,r);break;
   case 'olive':case 'laurel':g.moveTo(0,r*1.6);g.quadraticCurveTo(-r,-r,0,-r*1.6);for(let k=-2;k<=2;k++){g.moveTo(0,k*r/2);g.ellipse(-r*.35,k*r/2,r*.42,r*.15,-.5,0,Math.PI*2);g.moveTo(0,k*r/2);g.ellipse(r*.3,k*r/2,r*.4,r*.13,.5,0,Math.PI*2);}break;
   case 'chapel':g.moveTo(-r,r);g.lineTo(-r,0);g.bezierCurveTo(-r,-r,0,-r*2,0,-r*2);g.bezierCurveTo(0,-r*2,r,-r,r,0);g.lineTo(r,r);g.moveTo(-r*.4,0);g.lineTo(r*.4,0);g.moveTo(0,-r*.6);g.lineTo(0,r*.6);break;
   case 'damask':g.moveTo(0,-r*1.5);g.bezierCurveTo(r*2,-r, r*2,r,0,r*1.5);g.bezierCurveTo(-r*2,r,-r*2,-r,0,-r*1.5);g.moveTo(0,-r);g.lineTo(0,r);break;
   case 'snowflakes':for(let k=0;k<6;k++){g.save();g.rotate(k*Math.PI/3);g.moveTo(0,0);g.lineTo(0,-r);g.moveTo(-r*.3,-r*.5);g.lineTo(0,-r*.75);g.lineTo(r*.3,-r*.5);g.restore();}break;
   default:for(let k=0;k<8;k++){const a=k*Math.PI/4,rr=k%2?r*.3:r;const px=Math.cos(a)*rr,py=Math.sin(a)*rr;k?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();
  }g.stroke();g.restore();
 }
}

export function waxStock(image,design={}){
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
 const g=c.getContext('2d'),w=c.width,h=c.height;
 g.filter=`hue-rotate(${design.waxHue||0}deg)`;g.drawImage(image,0,0);g.filter='none';
 if(!design.sealShape||design.id==='sage')return c;
 // Keep the photographed wax grain and molten edge, with a new pressed die and silhouette.
 g.globalCompositeOperation='destination-in';g.beginPath();
 const count={diamond:4,octagon:8,star:10,scalloped:32}[design.sealShape];
 if(count){for(let k=0;k<count;k++){const a=-Math.PI/2+k*Math.PI*2/count;const radius=(design.sealShape==='star'&&k%2?.79:design.sealShape==='scalloped'&&k%2?.94:1);const x=w/2+Math.cos(a)*w*.47*radius,y=h/2+Math.sin(a)*h*.48*radius;k?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();}
 else g.ellipse(w/2,h/2,w*.40,h*.48,0,0,Math.PI*2);
 g.fill();g.globalCompositeOperation='source-over';
 // Engraved category emblem, below the Maison impression, catches light at its lower edge.
 g.textAlign='center';g.textBaseline='middle';g.font=`${h*.12}px Georgia`;
 g.fillStyle='rgba(255,225,197,.65)';g.fillText(ornamentGlyph(design.ornament),w*.5+2,h*.72+3);
 g.fillStyle='rgba(70,18,22,.8)';g.fillText(ornamentGlyph(design.ornament),w*.5,h*.72);
 return c;
}
export function paperRelief(source){
 const c=document.createElement('canvas');c.width=source.width;c.height=source.height;
 const g=c.getContext('2d');g.drawImage(source,0,0);const d=g.getImageData(0,0,c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
  const i=(y*c.width+x)*4,l=d.data[i]*.3+d.data[i+1]*.59+d.data[i+2]*.11;
  const fibre=Math.sin(x*2.1+y*.13)*2.5+Math.sin(y*1.7+x*.07)*2;
  const h=Math.max(0,Math.min(255,128+(l-125)*.45+fibre));d.data[i]=d.data[i+1]=d.data[i+2]=h;
 }g.putImageData(d,0,0);return c;
}
export function ornamentGlyph(kind){return {botanical:'❧',stars:'✦',diamonds:'◇',clouds:'☁',laurel:'❧',olive:'❦',medallion:'✧',geometric:'◆',cross:'✝',snowflake:'❄',blossom:'✿'}[kind]||'❧'}

let scriptReady;
export function invitationScript(){
 return scriptReady??=(async()=>{
  if(![...document.fonts].some(f=>f.family.replace(/['"]/g,'')==='Great Vibes')){
   const face=new FontFace('Great Vibes',"url(/fonts/great-vibes-400.woff2) format('woff2')");document.fonts.add(await face.load());
  }
 })().catch(()=>{});
}
