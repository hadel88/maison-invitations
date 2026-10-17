// Continuous deforming ribbon surfaces: the bow unties, then gravity carries it off-screen.
const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function ribbonPhases(t){return{loosen:smooth(t/.9),release:smooth((t-.65)/1.8),fall:Math.max(0,t-2.5)}}
function compile(gl,type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
const vs=`attribute vec3 p;attribute vec3 n;attribute vec2 uv;attribute vec3 tangent;uniform mat4 vp;varying vec3 N;varying vec3 P;varying vec3 T;varying vec2 U;void main(){P=p;N=n;T=tangent;U=uv;gl_Position=vp*vec4(p,1.);}`;
const fs=`
precision highp float;
uniform sampler2D satin; uniform float cameraZ;
varying vec3 N; varying vec3 P; varying vec3 T; varying vec2 U;
void main(){
  vec3 n=normalize(N),v=normalize(vec3(0.,0.,cameraZ)-P);
  if(dot(n,v)<0.) n=-n;
  vec3 t=normalize(T),b=normalize(cross(n,t));
  vec3 l=normalize(vec3(-4.,7.,9.)-P),h=normalize(l+v);
  float nl=max(dot(n,l),0.),nv=max(dot(n,v),.02),nh=max(dot(n,h),.02);
  // A wide sheen along the satin threads, with soft light across them.
  float ht=dot(h,t)/.44,hb=dot(h,b)/.19;
  float silk=exp(-(ht*ht+hb*hb)/(nh*nh))*.075;
  float fill=max(dot(n,normalize(vec3(5.,2.,6.)-P)),0.);
  vec3 fabric=mix(texture2D(satin,vec2(.13+U.x*.20,.16+U.y*.18)).rgb,vec3(.91,.67,.69),.25);
  float weave=sin(U.x*1200.)*sin(U.y*760.)*.003;
  float edge=min(U.y,1.-U.y);
  float hem=exp(-pow((edge-.018)/.009,2.));
  vec3 c=fabric*(.82+.15*nl+.06*fill+weave);
  c+=vec3(1.,.82,.78)*(silk+.025*pow(1.-nv,4.)+hem*.025);
  c*=.92+.08*smoothstep(0.,.012,edge);
  gl_FragColor=vec4(c,1.);
}`;
function center(u,side,type,t){const {loosen,release,fall}=ribbonPhases(t);let x,y,z,w,twist;
 if(type==='loop'){const a=Math.PI*2*u;x=side*(2.2*Math.sin(Math.PI*u));y=.28*Math.sin(a)+.27*Math.sin(Math.PI*u);z=.62*Math.sin(a)+.15;w=.20+.92*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.6);twist=.38*Math.sin(a)+.12;const end=side*(.1+3.3*u);x=x*(1-release)+end*release;y=y*(1-release)+(-.35*u+.25*Math.sin(u*7-t*2)*release)*release;z=z*(1-release)+(.35*Math.sin(u*5-t)*u)*release;w=w*(1-release)+.58*release;twist+=release*Math.sin(u*8-t*2)*.7;x+=side*loosen*.12;
 }else if(type==='tail'){x=side*(.1+.45*u+.95*u*u+.2*Math.sin(u*7));y=-.1-2.5*u;z=.18+.38*Math.sin(u*6);w=.4+.36*u;twist=.7*Math.sin(u*5+side);x+=side*release*(.2+.65*u);y+=release*.45*u;z+=Math.sin(u*8-t*2)*release*.3;
 }else if(type==='band'){x=side*(.15+10*u)+side*release*(.35+.7*u);y=.03-release*.12*u;z=.03+.04*Math.sin(u*5);w=.55;twist=.08*Math.sin(u*7);
 }else{const a=2*Math.PI*u;x=.29*Math.sin(a)*(1+loosen*.35);y=.03;z=.37*Math.cos(a)+.35;w=.66;twist=0;const pull=smooth((t-1.8)/.85);x=x*(1-pull)+(u-.5)*1.7*pull;y=-.15*pull;z=z*(1-pull)+.3*pull;twist=pull*Math.sin(u*5);}
 const fallOffset=2.6*fall*fall;const flutter=Math.sin(u*9-fall*5+side)*Math.min(fall,1);x+=side*fall*.42+flutter*.23;y-=fallOffset;z+=flutter*.25;twist+=flutter*.65;
 return {x,y,z,w,twist};}
export function point(u,v,side,type,t){const c=center(u,side,type,t);const q=(v-.5)*c.w;const gathers=type==='loop'?Math.exp(-u*9)+Math.exp(-(1-u)*9):Math.exp(-u*6);const crease=Math.sin(v*Math.PI*3+u*5)*.032+Math.sin(v*Math.PI*9+u*8)*.025*gathers;return[c.x+q*(type==='tail'?Math.cos(c.twist):Math.sin(c.twist)*.23),c.y+q*(type==='tail'?Math.sin(c.twist)*.25:Math.cos(c.twist)),c.z+q*Math.sin(c.twist)+crease]}
export function createRibbonRenderer(canvas,{onReady,onComplete,onError}={}){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)throw Error('WebGL unavailable');const prog=gl.createProgram();const a=compile(gl,gl.VERTEX_SHADER,vs),b=compile(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(prog,a);gl.attachShader(prog,b);gl.linkProgram(prog);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error('Ribbon shader unavailable');gl.useProgram(prog);
 const locP=gl.getAttribLocation(prog,'p'),locN=gl.getAttribLocation(prog,'n'),locUV=gl.getAttribLocation(prog,'uv'),vp=gl.getUniformLocation(prog,'vp'),camera=gl.getUniformLocation(prog,'cameraZ');const NU=96,NV=12;const data=new Float32Array((NU+1)*(NV+1)*11),idx=[];for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){let k=i*(NV+1)+j;idx.push(k,k+1,k+NV+1,k+1,k+NV+2,k+NV+1)}const ib=gl.createBuffer(),vb=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,data.byteLength,gl.DYNAMIC_DRAW);for(const [loc,size,off]of[[locP,3,0],[locN,3,12],[locUV,2,24],[gl.getAttribLocation(prog,'tangent'),3,32]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,44,off)}
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([233,185,187,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const silkPhoto=new Image();silkPhoto.onload=()=>{if(!disposed){gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,silkPhoto)}};silkPhoto.src='/atelier-bow.webp';
 let running=false,elapsed=0,last=0,raf=0,done=false,disposed=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,r.width*d);canvas.height=Math.max(1,r.height*d);gl.viewport(0,0,canvas.width,canvas.height);const aspect=canvas.width/canvas.height,f=2.6,near=.1,far=100,z=Math.max(7.2,.15+5.84/aspect);gl.uniform1f(camera,z);gl.uniformMatrix4fv(vp,false,[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,z*(far+near)/(far-near)+2*far*near/(near-far),z]);}
 const ro=new ResizeObserver(resize);ro.observe(canvas);resize();gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
 function draw(side,type,t){let k=0;for(let i=0;i<=NU;i++)for(let j=0;j<=NV;j++){const u=i/NU,v=j/NV,p=point(u,v,side,type,t),p1=point(u+.001,v,side,type,t),p2=point(u,v+.001,side,type,t);const ax=p1[0]-p[0],ay=p1[1]-p[1],az=p1[2]-p[2],bx=p2[0]-p[0],by=p2[1]-p[1],bz=p2[2]-p[2];data[k++]=p[0];data[k++]=p[1]+.45;data[k++]=p[2];data[k++]=ay*bz-az*by;data[k++]=az*bx-ax*bz;data[k++]=ax*by-ay*bx;data[k++]=u;data[k++]=v;data[k++]=ax;data[k++]=ay;data[k++]=az;}gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0)}
 function frame(now){if(disposed)return;const dt=Math.min((now-last)/1000||0,.04);last=now;if(running)elapsed+=dt;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);if(!(reduced&&running)&&elapsed<5.2){for(const side of [-1,1]){draw(side,'band',elapsed);draw(side,'tail',elapsed);draw(side,'loop',elapsed)}draw(1,'knot',elapsed)}if(running&&!done&&(elapsed>5.2||reduced)){done=true;onComplete?.()}if(!done)raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame);onReady?.();
 const lost=e=>{e.preventDefault();cancelAnimationFrame(raf);onError?.()};canvas.addEventListener('webglcontextlost',lost);
 return{open(){running=true},reset(){running=false;elapsed=0;done=false;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)},dispose(){disposed=true;cancelAnimationFrame(raf);ro.disconnect();canvas.removeEventListener('webglcontextlost',lost);silkPhoto.onload=null;gl.deleteTexture(texture);gl.deleteBuffer(ib);gl.deleteBuffer(vb);gl.deleteProgram(prog)}};
}

