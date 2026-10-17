// Small self-contained WebGL scene renderer. All ornaments have real geometry,
// perspective, depth testing and animated transforms; no remote runtime dependency.
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export function multiply(a,b){const c=new Array(16).fill(0);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[j*4+i]+=a[k*4+i]*b[j*4+k];return c;}
function transform(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx){const cx=Math.cos(rx),ax=Math.sin(rx),cy=Math.cos(ry),ay=Math.sin(ry),cz=Math.cos(rz),az=Math.sin(rz);const t=I();t[12]=x;t[13]=y;t[14]=z;return multiply(multiply(multiply(t,[cy,0,-ay,0,0,1,0,0,ay,0,cy,0,0,0,0,1]),[1,0,0,0,0,cx,ax,0,0,-ax,cx,0,0,0,0,1]),[cz*sx,az*sx,0,0,-az*sy,cz*sy,0,0,0,0,sz,0,0,0,0,1]);}
function perspective(aspect){const f=1/Math.tan(.38),near=.1,far=100;return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function hex(c){return [1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);}
export const ease=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p)};
function surface(fn,u=36,v=20){const a=[];for(let j=0;j<v;j++)for(let i=0;i<u;i++)for(const [s,t] of [[i,j],[i+1,j],[i,j+1],[i+1,j],[i+1,j+1],[i,j+1]])a.push(...fn(s/u,t/v));return new Float32Array(a);}
function sphere(){return surface((u,v)=>{const a=u*Math.PI*2,b=v*Math.PI;const p=[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];return [...p,...p]})}
function torus(){return surface((u,v)=>{const a=u*Math.PI*2,b=v*Math.PI*2,r=1+.065*Math.cos(b);return [r*Math.cos(a),r*Math.sin(a),.065*Math.sin(b),Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)]},64,8)}
function box(){const data=[];for(let axis=0;axis<3;axis++)for(const sign of [-1,1])for(const [u,v] of [[-1,-1],[1,-1],[-1,1],[1,-1],[1,1],[-1,1]]){const p=[0,0,0],n=[0,0,0];p[axis]=sign;p[(axis+1)%3]=u;p[(axis+2)%3]=v;n[axis]=sign;data.push(...p,...n)}return new Float32Array(data)}
function cylinder(){return surface((u,v)=>{const a=u*Math.PI*2;return [Math.cos(a),v*2-1,Math.sin(a),Math.cos(a),0,Math.sin(a)]},40,1)}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error)}return s}
function program(gl,vs,fs){const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,vs),f=shader(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('3D program unavailable');return p}
const vertex=`attribute vec3 position;attribute vec3 normal;uniform mat4 model;uniform mat4 vp;varying vec3 N;varying vec3 P;void main(){vec4 p=model*vec4(position,1.);P=p.xyz;N=normalize(mat3(model)*normal);gl_Position=vp*p;}`;
const fragment=`precision mediump float;varying vec3 N;varying vec3 P;uniform vec3 color;uniform vec3 eye;uniform float metal;uniform float alpha;void main(){vec3 n=normalize(N),v=normalize(eye-P);vec3 l=normalize(vec3(-3.,6.,7.)-P);float d=max(dot(n,l),0.);float rim=pow(1.-abs(dot(n,v)),3.);float spec=pow(max(dot(n,normalize(l+v)),0.),50.);float strip=pow(max(dot(n,normalize(vec3(4.,2.,5.)-P)),0.),18.);vec3 c=color*(.25+.64*d)+mix(vec3(1.),color,.65)*spec*(.8+metal*1.4)+color*rim*.48+vec3(1.,.85,.63)*strip*.48;gl_FragColor=vec4(c,alpha);}`;
export function createCinemaRenderer(canvas,theme,{onReady,onError}={}){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
 const p=program(gl,vertex,fragment);const loc={};for(const k of ['model','vp','color','eye','metal','alpha'])loc[k]=gl.getUniformLocation(p,k);const pos=gl.getAttribLocation(p,'position'),norm=gl.getAttribLocation(p,'normal');
 const buffers={};for(const [key,data] of Object.entries({sphere:sphere(),torus:torus(),box:box(),cylinder:cylinder()})){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);buffers[key]={b,count:data.length/6}}
 const ornaments=[],gate=[];const gold=hex(theme.color),pearl=[.96,.9,.83];
 const add=(geo,x,y,z,sx,sy,sz,color=gold,rx=0,ry=0,rz=0,group='decor',phase=0)=>{const item={geo,x,y,z,sx,sy,sz,color,rx,ry,rz,group,phase};(group.startsWith('gate')?gate:ornaments).push(item);return item};
 // The entrance is hinged in world space. The camera physically travels through it.
 for(const side of [-1,1]){
  const group='gate'+side;
  for(let i=0;i<7;i++)add('cylinder',side*(.17+i*.35),0,1,.021,2.45,.021,gold,0,0,0,group);
  for(const y of [-2.45,-1.9,1.6,2.45])add('box',side*1.2,y,1,1.22,.026,.045,gold,0,0,0,group);
  for(let j=0;j<3;j++)add('torus',side*1.2,-1.15+j*1.15,1,.48,.48,.52,gold,0,0,0,group);
  add('sphere',side*.15,-.1,1.1,.08,.15,.08,gold,0,0,0,group);
  add('cylinder',side*2.55,0,.8,.09,2.8,.09,gold);
  add('sphere',side*2.55,2.85,.8,.14,.22,.14,gold);
 }
 const center=(geo,x,y,z,sx,sy,sz,color=gold,rx=0,ry=0,rz=0)=>add(geo,x,y,z,sx,sy,sz,color,rx,ry,rz,'center');
 const balloon=(x,y,z,c,i)=>{add('sphere',x,y,z,.37,.49,.37,c,0,0,.1,'float',i);add('cylinder',x,y-.8,z,.006,.42,.006,c,0,0,0,'float',i)};
 const flower=(x,y,z,c,scale=.2,group='decor',phase=0)=>{for(let k=0;k<6;k++){const a=k*Math.PI/3;add('sphere',x+Math.cos(a)*scale*.65,y+Math.sin(a)*scale*.65,z,scale*.62,scale*.45,scale*.24,c,0,0,a,group,phase)}add('sphere',x,y,z+.05,scale*.25,scale*.25,scale*.25,gold,0,0,0,group,phase)};
 if(theme.motif==='rings'){
  center('torus',-.46,.25,0,.82,.82,.82,gold,.3,.5,-.2);center('torus',.46,.25,.12,.82,.82,.82,gold,-.2,-.5,.2);
  center('box',.7,1.01,.18,.15,.15,.15,pearl,.5,.5,.7);
 }else if(theme.motif==='cake'){
  for(let i=0;i<3;i++){const r=.95-i*.23;center('cylinder',0,-.6+i*.52,0,r,.26,r,i%2?pearl:gold);center('sphere',0,-.34+i*.52,0,r,.035,r,pearl);center('torus',0,-.79+i*.52,0,r,r,r,gold,Math.PI/2)}
  for(const x of [-.3,0,.3]){center('cylinder',x,1.05,0,.025,.23,.025,pearl);center('sphere',x,1.34,0,.05,.12,.05,[1,.72,.2])}
 }else if(theme.motif==='rocket'){
  center('sphere',0,.2,0,.43,1.2,.43,pearl);center('sphere',0,.35,.4,.23,.23,.06,[.18,.5,.8]);center('torus',0,.35,.44,.25,.25,.25,gold);for(const side of [-1,1])center('sphere',side*.42,-.48,0,.14,.47,.17,gold,0,0,side*-.4);center('sphere',0,-1.1,0,.25,.65,.25,[1,.48,.15]);
 }else if(theme.motif==='moon'){
  center('torus',0,.25,0,.94,.94,.94,gold,0,.4,-.4);for(let i=0;i<7;i++){const a=-1.6+i*.35;center('sphere',Math.cos(a)*.75,Math.sin(a)*.75+.25,0,.28,.28,.23,pearl)}
 }else if(theme.motif==='disco'){
  center('sphere',0,.35,0,1,1,1,[.6,.66,.76]);for(let i=0;i<16;i++)for(let j=1;j<9;j++){const a=i*Math.PI/8,b=j*Math.PI/10;const x=Math.sin(b)*Math.cos(a),y=Math.cos(b),z=Math.sin(b)*Math.sin(a);center('box',x,y+.35,z,.095,.095,.013,(i+j)%3?pearl:gold,0,Math.PI/2-a,0)}
 }else if(theme.motif==='cap'){
  center('box',0,.6,0,.95,.06,.95,[.08,.1,.2],.18,.4,.18);center('cylinder',0,.22,0,.45,.3,.45,[.08,.1,.2]);center('cylinder',.65,.1,.4,.02,.5,.02,gold,0,0,.2);center('sphere',.75,-.42,.4,.06,.16,.06,gold);
 }else if(theme.motif==='crown'){
  center('torus',0,-.3,0,.9,.9,.9,gold,Math.PI/2);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;center('sphere',Math.cos(a)*.82,.15,Math.sin(a)*.82,.1,.5,.1,gold,0,0,-Math.cos(a)*.2);center('sphere',Math.cos(a)*.9,.66,Math.sin(a)*.9,.13,.13,.13,i%2?pearl:gold)}
 }else if(theme.motif==='candles'){
  for(let i=0;i<5;i++){const x=(i-2)*.5,y=.2+Math.sin(i)*.25;center('cylinder',x,y,0,.09,.5,.09,pearl);center('sphere',x,y+.6,0,.045,.14,.045,[1,.65,.15]);center('torus',x,y-.5,0,.14,.14,.14,gold,Math.PI/2)}
 }else if(theme.motif==='flowers'){
  for(let i=0;i<18;i++){const a=i*Math.PI*2/18;flower(Math.cos(a)*1.2,Math.sin(a)*1.2+.2,0,i%2?pearl:gold,.22,'center')}
 }else if(theme.motif==='snow'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3;center('box',0,.2,0,.025,1.2,.025,pearl,0,0,a);center('sphere',Math.cos(a)*1.2,Math.sin(a)*1.2+.2,0,.08,.08,.08,gold)}
 }else{center('torus',0,.2,0,1.05,1.05,1.05,gold);center('torus',0,.2,0,.94,.94,.94,gold,0,.4);}
 if(['candy','noir'].includes(theme.kind)||theme.motif==='balloons')for(let i=0;i<12;i++){const side=i%2?-1:1;balloon(side*(2.5+(i%3)*.32),-1.8+(i%6)*.7,-1-(i%3),i%3===0?pearl:gold,i)}
 if(theme.kind==='garden')for(let i=0;i<16;i++){const side=i%2?-1:1;flower(side*(2.3+Math.sin(i)*.3),-2.4+(i%8)*.65,-.5,i%3?pearl:gold,.24,'float',i)}
 if(theme.kind==='cosmos'){
  add('sphere',-2.5,1.7,-2,.65,.65,.65,[.48,.35,.8],0,0,0,'orbit',0);add('torus',-2.5,1.7,-2,1.05,.38,1.05,gold,.5,.3,.3,'orbit',0);add('sphere',2.5,-1,-1,.38,.38,.38,[.2,.6,.7],0,0,0,'orbit',2);
 }
 const particleProgram=program(gl,`attribute vec3 position;uniform mat4 vp;uniform float time;uniform float pixel;varying float twinkle;void main(){vec3 q=position;q.y=mod(q.y+time*.13+5.,10.)-5.;q.x+=sin(time*.2+q.z)*.18;vec4 p=vp*vec4(q,1.);gl_Position=p;twinkle=.4+.6*abs(sin(time*.7+q.x*5.));gl_PointSize=clamp(36./p.w,1.5,5.)*pixel;}`,`precision mediump float;uniform vec3 color;varying float twinkle;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(color,pow(1.-d*2.,1.4)*twinkle);}`);
 const stars=new Float32Array(220*3);let seed=991;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};for(let i=0;i<stars.length;i+=3){stars[i]=(random()-.5)*15;stars[i+1]=(random()-.5)*10;stars[i+2]=(random()-.5)*12}
 const starBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,starBuffer);gl.bufferData(gl.ARRAY_BUFFER,stars,gl.STATIC_DRAW);const starPos=gl.getAttribLocation(particleProgram,'position');const starLoc={};for(const k of ['vp','time','pixel','color'])starLoc[k]=gl.getUniformLocation(particleProgram,k);
 let target=0,progress=0,last=0,elapsed=0,raf=0,disposed=false,paused=false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,pointer=[0,0];
 const resize=()=>{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));gl.viewport(0,0,canvas.width,canvas.height)};const ro=new ResizeObserver(resize);ro.observe(canvas);resize();
 const move=e=>{const r=canvas.getBoundingClientRect();pointer=[(e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5]};canvas.parentElement.addEventListener('pointermove',move,{passive:true});
 const lost=e=>{e.preventDefault();cancelAnimationFrame(raf);onError?.()};canvas.addEventListener('webglcontextlost',lost);
 function frame(now){if(disposed)return;const dt=Math.min((now-last)/1000||0,.05);last=now;if(!document.hidden){if(!paused&&!reduced)elapsed+=dt;progress+=(target-progress)*Math.min(1,dt*(reduced?18:1.3));if(Math.abs(target-progress)<.001)progress=target;
  const aspect=canvas.width/canvas.height,zoom=aspect<.8?13.2:11.4;const eye=[reduced?0:pointer[0]*.4,reduced?0:-pointer[1]*.24,zoom-progress*2.1];const vp=multiply(perspective(aspect),transform(-eye[0],-eye[1],-eye[2]));gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(p);gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(norm);gl.uniformMatrix4fv(loc.vp,false,vp);gl.uniform3fv(loc.eye,eye);gl.uniform1f(loc.metal,1);
  for(const obj of [...gate,...ornaments]){const {geo,x,y,z,sx,sy,sz,color,rx,ry,rz,group,phase}=obj;let model;let alpha=1;
   if(group.startsWith('gate')){const side=Number(group.slice(4)),hinge=side*2.5;model=multiply(multiply(transform(hinge,0,1,0,side*progress*1.65),transform(x-hinge,y,z-1,rx,ry,rz,sx,sy,sz)),I());alpha=1-ease((progress-.65)/.35)}
   else {const floating=group==='float'||group==='orbit',central=group==='center';model=transform(x+(floating?Math.sin(elapsed*.4+phase)*.09:0),y+(floating?Math.sin(elapsed*.7+phase)*.13:0)-(central?progress*2.7:0),z+(central?progress*.1:0),rx+(central?Math.sin(elapsed*.3)*.07:0),ry+(central?Math.sin(elapsed*.35)*.22:0),rz,sx,sy,sz);alpha=central?1-progress*.1:1}
   const b=buffers[geo];gl.bindBuffer(gl.ARRAY_BUFFER,b.b);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(norm,3,gl.FLOAT,false,24,12);gl.uniformMatrix4fv(loc.model,false,model);gl.uniform3fv(loc.color,color);gl.uniform1f(loc.alpha,alpha);gl.drawArrays(gl.TRIANGLES,0,b.count);
  }
  gl.useProgram(particleProgram);gl.disableVertexAttribArray(norm);gl.bindBuffer(gl.ARRAY_BUFFER,starBuffer);gl.enableVertexAttribArray(starPos);gl.vertexAttribPointer(starPos,3,gl.FLOAT,false,0,0);gl.uniformMatrix4fv(starLoc.vp,false,vp);gl.uniform1f(starLoc.time,elapsed);gl.uniform1f(starLoc.pixel,Math.min(devicePixelRatio||1,1.6));gl.uniform3fv(starLoc.color,gold);gl.depthMask(false);gl.drawArrays(gl.POINTS,0,stars.length/3);gl.depthMask(true);
 }raf=requestAnimationFrame(frame)}
 raf=requestAnimationFrame(frame);onReady?.();
 return {open(value){target=value?1:0},pause(value){paused=value},dispose(){disposed=true;cancelAnimationFrame(raf);ro.disconnect();canvas.parentElement?.removeEventListener('pointermove',move);canvas.removeEventListener('webglcontextlost',lost);for(const b of Object.values(buffers))gl.deleteBuffer(b.b);gl.deleteBuffer(starBuffer);gl.deleteProgram(p);gl.deleteProgram(particleProgram)}};
}
