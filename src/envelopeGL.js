const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
export const ENVELOPE_END = 5.2;
export function envelopeMotion(t) {
  return { flap: ease((t - .2) / 1.9), sides: ease((t - 1.05) / 1.9) };
}
export function envelopeVertex(x, y, part, t, w, h) {
  const m = envelopeMotion(t);
  let z = { back: 0, left: 5, right: 7, bottom: 10, top: 14 }[part];
  if (part === 'top') { const angle = m.flap * Math.PI * .97; z += Math.sin(angle) * y; y *= Math.cos(angle); }
  if (part === 'left') { const angle = m.sides * Math.PI * .35; z += Math.sin(angle) * x; x *= Math.cos(angle); }
  if (part === 'right') { const angle = m.sides * Math.PI * .35, distance = w - x; z += Math.sin(angle) * distance; x = w - Math.cos(angle) * distance; }
  if (part === 'bottom') { const angle = m.sides * Math.PI * .35, distance = h - y; z += Math.sin(angle) * distance; y = h - Math.cos(angle) * distance; }
  return [x, y, z];
}
const vs = `attribute vec3 position; attribute vec3 normal; attribute vec2 uv; attribute vec3 bary;
uniform vec2 size; varying vec3 N; varying vec2 U; varying vec3 B;
void main(){ float lens=max(size.x,size.y)*2.7; float zoom=lens/(lens-position.z);
vec2 p=(position.xy-size*.5)*zoom/size*2.; gl_Position=vec4(p.x,-p.y,-position.z/(lens*2.),1.); N=normal;U=uv;B=bary; }`;
const fs = `precision mediump float; uniform sampler2D paper; uniform sampler2D insidePaper; uniform float rim; uniform float tone; varying vec3 N; varying vec2 U; varying vec3 B;
void main(){ vec3 n=normalize(N); if(n.z<0.)n=-n; float light=max(dot(n,normalize(vec3(-.35,-.45,1.))),0.);
vec3 base; if(rim<.5){base=texture2D(insidePaper,U).rgb;}else{base=texture2D(paper,U).rgb;} float edge=min(B.x,min(B.y,B.z));
float crease=(1.-smoothstep(0.,.005,edge))*rim;
base*=(.59+.40*light)*tone; base=mix(base,base*.60,crease*.50);
gl_FragColor=vec4(base,1.); }`;
function compile(gl, type, source) { const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s); if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)); return s; }
export function createEnvelopeRenderer(canvas,{onComplete,onError}={}) {
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
  if(!gl)throw Error('WebGL unavailable');
  const program=gl.createProgram(),v=compile(gl,gl.VERTEX_SHADER,vs),f=compile(gl,gl.FRAGMENT_SHADER,fs);
  gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Envelope shader unavailable');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,count,offset] of [['position',3,0],['normal',3,12],['uv',2,24],['bary',3,32]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,count,gl.FLOAT,false,44,offset);}
  const size=gl.getUniformLocation(program,'size'),rim=gl.getUniformLocation(program,'rim'),tone=gl.getUniformLocation(program,'tone'),texture=gl.createTexture(),insideTexture=gl.createTexture(),insidePaper=gl.getUniformLocation(program,'insidePaper');
  gl.uniform1i(gl.getUniformLocation(program,'paper'),0);gl.uniform1i(insidePaper,1);
  for(const [unit,target,colour] of [[gl.TEXTURE0,texture,[100,113,76,255]],[gl.TEXTURE1,insideTexture,[231,235,219,255]]]){gl.activeTexture(unit);gl.bindTexture(gl.TEXTURE_2D,target);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(colour));for(const [key,value] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);}
  let width=1,height=1,elapsed=0,last=0,raf=0,running=false,disposed=false,done=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,photo=new Image(),insidePhoto=new Image();
  photo.onload=()=>{if(disposed)return;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,photo);draw();};photo.src='/atelier-sage-cover.webp';
  insidePhoto.onload=()=>{if(disposed)return;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,insideTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,insidePhoto);draw();};insidePhoto.src='/atelier-sage.webp';
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
  function triangle(points,part){
    const positions=points.map(p=>envelopeVertex(p[0],p[1],part,elapsed,width,height));
    const a=positions[1].map((x,i)=>x-positions[0][i]),b=positions[2].map((x,i)=>x-positions[0][i]);
    const normal=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...normal)||1;
    const data=[];for(let i=0;i<3;i++)data.push(...positions[i],...normal.map(n=>n/length),points[i][0]/width,points[i][1]/height,...[0,1,2].map(j=>i===j?1:0));
    gl.uniform1f(rim,part==='back'?0:1);gl.uniform1f(tone,{back:.80,left:.94,right:.88,bottom:.98,top:1.10}[part]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,3);
  }
  function draw(){if(disposed)return;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,insideTexture);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const w=width,h=height;
    triangle([[0,0],[w,0],[0,h]],'back');triangle([[w,0],[w,h],[0,h]],'back');
    triangle([[0,0],[w*.55,h*.51],[0,h]],'left');triangle([[w,0],[w,h],[w*.45,h*.51]],'right');
    triangle([[0,h],[w,h],[w*.5,h*.43]],'bottom');triangle([[0,0],[w,0],[w*.5,h*.48]],'top');
    canvas.dataset.phase=!running?'sealed':elapsed<1.05?'seal':elapsed<3.65?'flap':elapsed<ENVELOPE_END?'envelope':'open';
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);width=Math.max(1,r.width);height=Math.max(1,r.height);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(size,width,height);draw();}
  function frame(now){if(disposed||!running)return;elapsed+=Math.min((now-last)/1000,.06);last=now;if(reduced)elapsed=ENVELOPE_END;draw();if(elapsed>=ENVELOPE_END){if(!done){done=true;onComplete?.();}return;}raf=requestAnimationFrame(frame);}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const lost=event=>{event.preventDefault();cancelAnimationFrame(raf);onError?.();};canvas.addEventListener('webglcontextlost',lost);
  return{open(){if(running)return;running=true;last=performance.now();raf=requestAnimationFrame(frame);},reset(){cancelAnimationFrame(raf);elapsed=0;running=false;done=false;draw();},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();photo.onload=null;insidePhoto.onload=null;canvas.removeEventListener('webglcontextlost',lost);gl.deleteTexture(texture);gl.deleteTexture(insideTexture);gl.deleteBuffer(buffer);gl.deleteProgram(program);}};
}
