import { point as ribbonPoint } from './ribbonGL.js';

const clamp = x => Math.max(0, Math.min(1, x));
export const celebrationEase = x => { x=clamp(x);return x*x*x*(x*(x*6-15)+10); };
export const CELEBRATION_END = 6.2;
export function celebrationPhases(t) {
  return { ribbon: celebrationEase(t/1.1), lid: celebrationEase((t-.55)/2.2), panels: celebrationEase((t-1.35)/2.5), scroll: celebrationEase((t-1.35)/2.5), leave: celebrationEase((t-4.2)/1.65) };
}
export function giftPanelPoint(x,y,z,side,t) {
  const a=celebrationPhases(t).panels*Math.PI*.61,dy=y+.8;
  if(side==='front')return[x,-.8+dy*Math.cos(a),z+dy*Math.sin(a)];
  if(side==='back')return[x,-.8+dy*Math.cos(a),z-dy*Math.sin(a)];
  if(side==='left')return[x-dy*Math.sin(a),-.8+dy*Math.cos(a),z];
  if(side==='right')return[x+dy*Math.sin(a),-.8+dy*Math.cos(a),z];
  return[x,y,z];
}
export function diplomaPoint(u,v,t) {
  const p=celebrationPhases(t),s=v*3,laid=p.scroll*3,r=.19;
  let y,z;
  if(s<=laid){y=1.45-s;z=0;}
  else{const a=(s-laid)/r;y=1.45-laid-r*Math.sin(a);z=r*(1-Math.cos(a));}
  return[(u-.5)*2.65,y+p.leave*5,z-.25];
}
const add=(a,b)=>a.map((n,i)=>n+b[i]);
function rotate(p,rx=0,ry=0,rz=0){let[x,y,z]=p;[y,z]=[y*Math.cos(rx)-z*Math.sin(rx),y*Math.sin(rx)+z*Math.cos(rx)];[x,z]=[x*Math.cos(ry)+z*Math.sin(ry),-x*Math.sin(ry)+z*Math.cos(ry)];return[x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz),z];}

// A small perspective renderer. The gift, ribbon, cap and paper are actual meshes,
// not whole-screen photographs being stretched or faded to imitate an opening.
export function createCelebrationCanvas(canvas,{kind='birthday',names='',year='2027',onComplete}={}) {
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw Error('Canvas unavailable');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=1,height=1,dpr=1,time=0,running=false,done=false,disposed=false,last=0,raf=0,faces=[];
  const cloth=new Image(),paper=new Image();cloth.src='/birthday-cloth.webp';paper.src='/craft-cotton-paper.webp';
  const diploma=document.createElement('canvas');diploma.width=720;diploma.height=900;
  const dc=diploma.getContext('2d');
  function writeDiploma(){
    dc.fillStyle='#f5e8cc';dc.fillRect(0,0,720,900);if(paper.complete&&paper.naturalWidth){dc.globalAlpha=.42;dc.drawImage(paper,0,0,720,900);dc.globalAlpha=1;}
    dc.strokeStyle='#b49558';dc.lineWidth=3;dc.strokeRect(35,35,650,830);dc.lineWidth=1;dc.strokeRect(45,45,630,810);
    dc.textAlign='center';dc.fillStyle='#284054';dc.font='22px Georgia';dc.fillText('THE NEXT CHAPTER',360,180);
    dc.font='italic 44px Georgia';dc.fillText('Class of '+year,360,295);
    dc.font='32px Georgia';const label=names.length>28?names.slice(0,27)+'…':names;dc.fillText(label,360,430,565);
    dc.fillStyle='#a58247';dc.font='18px Georgia';dc.fillText('A future worth celebrating',360,520);
    dc.beginPath();dc.arc(360,680,48,0,Math.PI*2);dc.stroke();dc.font='40px Georgia';dc.fillText('✦',360,694);
  }
  writeDiploma();paper.onload=()=>{writeDiploma();if(!running)draw();};cloth.onload=()=>{if(!running)draw();};
  function camera(p){return rotate(p,.32,kind==='birthday'?.36:-.20,0);}
  function project(p){const q=camera(p),scale=Math.min(width*.255,height*.17),f=8/(8-q[2]);return[width*.5+q[0]*scale*f,height*.57-q[1]*scale*f,q[2]];}
  function face(points,color,texture=null,uv=null,alpha=1){faces.push({points,color,texture,uv:uv||[[0,0],[1,0],[1,1],[0,1]],alpha});}
  function cuboid(x0,x1,y0,y1,z0,z1,color,transform=p=>p,texture=null){
    for(const points of[
      [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],
      [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],
      [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],
      [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],
      [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],
      [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],
    ])face(points.map(transform),color,texture);
  }
  function texturedTriangle(image,src,dst){
    const [a,b,c]=src.map(p=>[p[0]*image.width,p[1]*image.height]),[p,q,r]=dst;
    const det=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);if(Math.abs(det)<.00001)return;
    const m00=((q[0]-p[0])*(c[1]-a[1])-(r[0]-p[0])*(b[1]-a[1]))/det;
    const m01=((r[0]-p[0])*(b[0]-a[0])-(q[0]-p[0])*(c[0]-a[0]))/det;
    const m10=((q[1]-p[1])*(c[1]-a[1])-(r[1]-p[1])*(b[1]-a[1]))/det;
    const m11=((r[1]-p[1])*(b[0]-a[0])-(q[1]-p[1])*(c[0]-a[0]))/det;
    ctx.save();ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.lineTo(...r);ctx.closePath();ctx.clip();
    ctx.transform(m00,m10,m01,m11,p[0]-m00*a[0]-m01*a[1],p[1]-m10*a[0]-m11*a[1]);ctx.drawImage(image,0,0);ctx.restore();
  }
  function renderFace(f){
    const pts=f.points.map(project),cp=f.points.map(camera),a=cp[1].map((v,i)=>v-cp[0][i]),b=cp[2].map((v,i)=>v-cp[0][i]);
    const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...n)||1;
    const light=.66+.34*Math.abs((n[0]*-.35+n[1]*.60+n[2]*.72)/length);
    ctx.save();ctx.globalAlpha=f.alpha;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=f.color;ctx.fill();
    if(f.texture&&(f.texture.complete||f.texture===diploma)&&f.texture.width){
      for(let i=1;i<pts.length-1;i++)texturedTriangle(f.texture,[f.uv[0],f.uv[i],f.uv[i+1]],[pts[0].slice(0,2),pts[i].slice(0,2),pts[i+1].slice(0,2)]);
    }
    ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
    ctx.fillStyle=`rgba(0,0,0,${1-light})`;ctx.fill();ctx.strokeStyle='rgba(255,224,170,.09)';ctx.lineWidth=.65;ctx.stroke();ctx.restore();
  }
  function ribbon(){
    const rt=running?time*1.25:0;
    if(rt>4)return;
    for(const side of[-1,1])for(const type of['loop','tail'])for(let i=0;i<26;i++){
      const sample=(u,v)=>{const p=ribbonPoint(u,v,side,type,rt);return[p[0]*.40,1.03+p[1]*.40,.55+p[2]*.40];};
      face([sample(i/26,0),sample((i+1)/26,0),sample((i+1)/26,1),sample(i/26,1)],'#d8a74f');
    }
  }
  function gift(){
    const p=celebrationPhases(time),alpha=1-p.leave;
    if(alpha<=0)return;
    for(const [side,points]of[
      ['front',[[-1,-.8,1],[1,-.8,1],[1,.8,1],[-1,.8,1]]],
      ['back',[[1,-.8,-1],[-1,-.8,-1],[-1,.8,-1],[1,.8,-1]]],
      ['left',[[-1,-.8,-1],[-1,-.8,1],[-1,.8,1],[-1,.8,-1]]],
      ['right',[[1,-.8,1],[1,-.8,-1],[1,.8,-1],[1,.8,1]]],
    ])face(points.map(a=>giftPanelPoint(...a,side,time)),'#8c264c',cloth,null,alpha);
    face([[-1,-.8,-1],[1,-.8,-1],[1,-.8,1],[-1,-.8,1]],'#c8a26c',paper,null,alpha);
    if(p.lid<1||time<4.6){
      const flight=celebrationEase((time-1.7)/2.6),transform=a=>add(rotate(a,.08*p.lid,p.lid*.65,flight*-.45),[-flight*2,p.lid*1.45+flight*5,flight*.6]);
      cuboid(-1.07,1.07,.82,1,-1.07,1.07,'#7e2452',transform,cloth);
      const band=[[-.13,1.005,-1.075],[.13,1.005,-1.075],[.13,1.005,1.075],[-.13,1.005,1.075]].map(transform);face(band,'#e7bb60',null,null,1-p.ribbon);
    }
    ribbon();
  }
  function graduation(){
    const toss=celebrationEase((time-.75)/2.6),leave=celebrationEase((time-2.6)/1.35);
    if(leave<1){
      const tr=p=>add(rotate(p,toss*-.3,toss*.85,toss*-.38),[leave*3.5,toss*1.8+leave*5,0]);
      cuboid(-1.25,1.25,.38,.48,-1.25,1.25,'#152332',tr);
      for(let i=0;i<32;i++){
        const a=i/32*Math.PI*2,b=(i+1)/32*Math.PI*2;
        face([[Math.cos(a)*.67,-.3,Math.sin(a)*.67],[Math.cos(b)*.67,-.3,Math.sin(b)*.67],[Math.cos(b)*.67,.37,Math.sin(b)*.67],[Math.cos(a)*.67,.37,Math.sin(a)*.67]].map(tr),'#172735');
      }
      // The tassel sweeps across the board, then trails the cap with a damped swing.
      const swing=(running?celebrationEase(time/1.1):0)*Math.PI,anchor=[0,.51,0],corner=[Math.cos(swing)*1.1,.51,.80],end=[corner[0]+Math.sin(time*4)*toss*.17,-.48,.91];
      const thread=(a,b,r)=>{const delta=b.map((v,i)=>v-a[i]);for(let i=0;i<8;i++){const q=i/8*Math.PI*2,qn=(i+1)/8*Math.PI*2;face([[a[0]+Math.cos(q)*r,a[1],a[2]+Math.sin(q)*r],[a[0]+Math.cos(qn)*r,a[1],a[2]+Math.sin(qn)*r],[b[0]+Math.cos(qn)*r,b[1],b[2]+Math.sin(qn)*r],[b[0]+Math.cos(q)*r,b[1],b[2]+Math.sin(q)*r]].map(tr),'#d7ae54');}};
      // Thin strips follow the cord in both directions instead of a rigid icon.
      face([anchor,corner,[corner[0],corner[1]+.025,corner[2]],[0,.535,0]].map(tr),'#e9c96b');thread(corner,end,.025);
      for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*.08,z=Math.sin(a)*.08;face([[end[0]+x,end[1],end[2]+z],[end[0]+x+.016,end[1],end[2]+z],[end[0]+x+.025,end[1]-.43,end[2]+z+.07],[end[0]+x-.01,end[1]-.43,end[2]+z+.07]].map(tr),'#dab263');}
    }
    if(time>1.2){const alpha=1-celebrationEase((time-5.1)/.8);for(let j=0;j<38;j++)for(let i=0;i<3;i++){
      const u=i/3,v=j/38,du=1/3,dv=1/38;
      face([diplomaPoint(u,v,time),diplomaPoint(u+du,v,time),diplomaPoint(u+du,v+dv,time),diplomaPoint(u,v+dv,time)],'#f0ddba',diploma,[[u,v],[u+du,v],[u+du,v+dv],[u,v+dv]],alpha);
    }}
  }
  function confetti(){
    if(!running||time<1.6||reduced)return;
    for(let i=0;i<74;i++){
      const age=time-1.6-delay(i),cycle=age>4.3?(age%4.3):age;if(cycle<0)continue;
      const angle=i*2.399,velocity=.8+(i%11)*.12;
      const p=[Math.cos(angle)*velocity*cycle,.8+Math.sin(angle)*velocity*cycle+.8*cycle-.45*cycle*cycle,Math.sin(i*7)*1.5];
      const q=project(p),size=(2+i%4)*8/(8-q[2]);ctx.save();ctx.translate(q[0],q[1]);ctx.rotate(time*2+i);ctx.globalAlpha=clamp(1-cycle/4.3)*.8;ctx.fillStyle=(kind==='birthday'?['#ef466c','#e8b655','#6494d9','#f4d9d0']:['#d9b45b','#f5e8ba','#4a6681'])[i%(kind==='birthday'?4:3)];ctx.fillRect(-size/2,-size/3,size,size*.6*Math.cos(time*3+i));ctx.restore();
    }
  }
  const delay=i=>(i%7)*.035;
  function draw(){
    if(disposed)return;ctx.clearRect(0,0,width,height);faces=[];
    ctx.save();ctx.globalAlpha=1-celebrationEase((time-3.2)/2);const g=ctx.createRadialGradient(width*.5,height*.76,0,width*.5,height*.76,width*.38);g.addColorStop(0,'#0006');g.addColorStop(1,'#0000');ctx.fillStyle=g;ctx.fillRect(0,height*.63,width,height*.30);ctx.restore();
    if(kind==='birthday')gift();else graduation();
    faces.sort((a,b)=>a.points.reduce((s,p)=>s+camera(p)[2],0)/a.points.length-b.points.reduce((s,p)=>s+camera(p)[2],0)/b.points.length);faces.forEach(renderFace);confetti();
    canvas.dataset.phase=!running?'closed':time<1.35?'release':time<4.2?'transform':time<CELEBRATION_END?'reveal':'open';
  }
  function frame(now){if(disposed||!running)return;time+=Math.min((now-last)/1000,.05);last=now;if(reduced)time=CELEBRATION_END;draw();if(time>=CELEBRATION_END&&!done){done=true;onComplete?.();}if(!reduced)raf=requestAnimationFrame(frame);}
  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  return{open(){if(running)return;running=true;last=performance.now();raf=requestAnimationFrame(frame);},reset(){cancelAnimationFrame(raf);running=false;time=0;done=false;draw();},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();paper.onload=null;cloth.onload=null;}};
}
