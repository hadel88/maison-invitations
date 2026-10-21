// Colour, height and fibre maps only. No geometry, camera or animation code.
export function paperStock(image, design={}){
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
 const g=c.getContext('2d');g.drawImage(image,0,0);
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
