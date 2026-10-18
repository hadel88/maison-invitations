const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
export const BIRTHDAY_OPEN_END = 6.2;
export function birthdayLidPoint(x, y, z, time, width, height) {
  const p = ease((time - .95) / 4.9), angle = p * Math.PI * .61;
  // The rear brass hinge stays fixed; the front and underside have real thickness.
  return [x, y * Math.cos(angle) - (z - 12) * Math.sin(angle), 12 + y * Math.sin(angle) + (z - 12) * Math.cos(angle)];
}
const vertex = `attribute vec3 position; attribute vec3 normal; attribute vec2 uv;
uniform vec2 size; varying vec3 N; varying vec2 U;
void main(){float lens=max(size.x,size.y)*2.8;float zoom=lens/(lens-position.z);
vec2 p=(position.xy-size*.5)*zoom/size*2.;gl_Position=vec4(p.x,-p.y,-position.z/(lens*2.),1.);N=normal;U=uv;}`;
const fragment = `precision mediump float; uniform sampler2D cloth; uniform float material; varying vec3 N; varying vec2 U;
void main(){vec3 n=normalize(N);if(n.z<0.)n=-n;vec3 l=normalize(vec3(-.4,-.5,1.));
float light=max(dot(n,l),0.);float sheen=pow(max(dot(n,normalize(l+vec3(0.,0.,1.))),0.),28.);
vec3 c=texture2D(cloth,U).rgb;
if(material>1.5)c=vec3(.24,.13,.20);else if(material>.5)c=vec3(.57,.39,.20);
else{float e=min(min(U.x,1.-U.x),min(U.y,1.-U.y));float foil=smoothstep(.010,.012,e)*(1.-smoothstep(.014,.016,e));c=mix(c,vec3(.66,.48,.26),foil);}
c*=.62+.39*light;c+=vec3(1.,.82,.56)*sheen*(material>.5?.13:.025);gl_FragColor=vec4(c,1.);}`;
function compile(gl, type, source) { const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s; }
export function createBirthdayBox(canvas,{onComplete,onError}={}) {
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)throw Error('WebGL unavailable');
  const program=gl.createProgram(),v=compile(gl,gl.VERTEX_SHADER,vertex),f=compile(gl,gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);gl.deleteShader(v);gl.deleteShader(f);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Box shader unavailable');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(const [name,count,offset]of[['position',3,0],['normal',3,12],['uv',2,24]]){const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,count,gl.FLOAT,false,32,offset);}
  const size=gl.getUniformLocation(program,'size'),material=gl.getUniformLocation(program,'material'),texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([65,39,57,255]));
  for(const [key,value]of[[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,key,value);
  let disposed=false,running=false,elapsed=0,last=0,raf=0,done=false,w=1,h=1;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,photo=new Image();
  photo.onload=()=>{if(disposed)return;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,photo);draw();};photo.src='/birthday-cloth.webp';
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);
  function face(points,type){
    const p=points.map(a=>birthdayLidPoint(...a,elapsed,w,h));
    const a=p[1].map((x,i)=>x-p[0][i]),b=p[2].map((x,i)=>x-p[0][i]);
    const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...n)||1;
    const data=[];for(const i of[0,1,2,0,2,3])data.push(...p[i],...n.map(x=>x/length),points[i][0]/w,points[i][1]/h);
    gl.uniform1f(material,type);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function draw(){if(disposed)return;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    face([[0,0,2],[0,h,2],[w,h,2],[w,0,2]],2);
    face([[0,h,2],[0,h,12],[w,h,12],[w,h,2]],1);
    face([[0,0,2],[0,0,12],[0,h,12],[0,h,2]],1);
    face([[w,0,12],[w,0,2],[w,h,2],[w,h,12]],1);
    face([[0,0,12],[w,0,12],[w,h,12],[0,h,12]],0);
    canvas.dataset.phase=!running?'sealed':elapsed<.95?'seal':elapsed<BIRTHDAY_OPEN_END?'lid':'open';
  }
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=Math.max(1,r.width);h=Math.max(1,r.height);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(size,w,h);draw();}
  function frame(now){if(disposed||!running)return;elapsed+=Math.min((now-last)/1000,.06);last=now;if(reduced)elapsed=BIRTHDAY_OPEN_END;draw();if(elapsed>=BIRTHDAY_OPEN_END){if(!done){done=true;onComplete?.();}return;}raf=requestAnimationFrame(frame);}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const lost=event=>{event.preventDefault();cancelAnimationFrame(raf);onError?.();};canvas.addEventListener('webglcontextlost',lost);
  return{open(){if(running)return;running=true;last=performance.now();raf=requestAnimationFrame(frame);},reset(){cancelAnimationFrame(raf);elapsed=0;running=false;done=false;draw();},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();photo.onload=null;canvas.removeEventListener('webglcontextlost',lost);gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);}};
}

// Warm, softly focused flecks are projected from a small three-dimensional field.
export function createBirthdayDust(canvas) {
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w=1,h=1,raf=0,active=false,disposed=false,started=0,burstAt=-Infinity;
  const particles=Array.from({length:32},(_,i)=>({x:((i*73)%101)/101,y:((i*47)%97)/97,z:.35+(i%7)/10,s: .5+(i%4)*.35}));
  function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}
  function frame(now){if(disposed||!active)return;ctx.clearRect(0,0,w,h);const t=(now-started)/1000;
    for(const [i,p]of particles.entries()){
      const y=((p.y-t*.009*p.z)%1+1)%1,depth=1/(1.7-p.z),x=(p.x-.5)*w*depth+w*.5+Math.sin(t*.22+i)*7;
      ctx.globalAlpha=(.14+.3*(.5+.5*Math.sin(t*.6+i)))*Math.sin(y*Math.PI);ctx.fillStyle='#f4ce8b';ctx.shadowColor='#edb65e';ctx.shadowBlur=7;
      ctx.beginPath();ctx.ellipse(x,y*h,p.s*depth,p.s*depth*.6,t*.2+i,0,Math.PI*2);ctx.fill();
    }
    const age=(now-burstAt)/1000;
    if(age<3.8)for(let i=0;i<42;i++){
      const angle=i*2.399,velocity=25+(i%9)*8,x=w*.55+Math.cos(angle)*velocity*age,y=h*.59+Math.sin(angle)*velocity*age-age*43+age*age*10;
      ctx.globalAlpha=Math.max(0,1-age/3.8)*.75;ctx.fillStyle='#f6d59b';ctx.beginPath();ctx.ellipse(x,y,1.2+(i%3)*.4,.7,angle+age,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;ctx.shadowBlur=0;raf=requestAnimationFrame(frame);
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  return{start(){if(active||reduced)return;active=true;started=performance.now();raf=requestAnimationFrame(frame);},wish(){if(!reduced)burstAt=performance.now();},reset(){active=false;cancelAnimationFrame(raf);ctx.clearRect(0,0,w,h);},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();}};
}
