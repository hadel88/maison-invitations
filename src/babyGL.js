// A Little Wonder: photo memories and the personalised card share the video clock.
// Foreground frame ornaments occlude portraits on frames passing behind them.
// This file is independent of the two existing castle film renderers.
//
// data: { fps, frameW, frameH, band: [x, y, w, h] | null, first, frames: [[kind, id, x0,y0, x1,y1, x2,y2, x3,y3, opacity, masked], …] }
// kind 0 = photo slot (id 1–4), kind 1 = text texture (id = name). Corners are in frame pixels, clockwise from top-left.

const VS = `
attribute vec2 aPos; attribute vec3 aUV;
uniform vec2 uFrame; varying vec3 vUV; varying vec2 vPx;
void main(){ vPx = aPos; vUV = aUV; vec2 c = aPos / uFrame * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); }`;
const FS_VIDEO = `
precision mediump float; uniform sampler2D uVideo; uniform vec2 uScale; varying vec3 vUV;
void main(){ vec2 uv = vUV.xy / vUV.z; gl_FragColor = texture2D(uVideo, vec2(uv.x, uv.y * uScale.y)); }`;
const FS_LAYER = `
precision mediump float;
uniform sampler2D uTex; uniform sampler2D uVideo;
uniform float uOpacity, uMasked, uShade; uniform float uPocketOn; uniform vec4 uPocketA,uPocketB;
uniform float uCoverCount; uniform vec4 uCover1A,uCover1B,uCover2A,uCover2B,uCover3A,uCover3B; uniform vec4 uBand; uniform vec2 uVideoSize;
varying vec3 vUV; varying vec2 vPx;
float cross2(vec2 a,vec2 b){return a.x*b.y-a.y*b.x;}
bool covered(vec4 a,vec4 b){
  vec4 v=vec4(cross2(a.zw-a.xy,vPx-a.xy),cross2(b.xy-a.zw,vPx-a.zw),cross2(b.zw-b.xy,vPx-b.xy),cross2(a.xy-b.zw,vPx-b.zw));
  return all(greaterThanEqual(v,vec4(0.)))||all(lessThanEqual(v,vec4(0.)));
}
void main(){
  if(uCoverCount>0.5&&covered(uCover1A,uCover1B))discard;
  if(uCoverCount>1.5&&covered(uCover2A,uCover2B))discard;
  if(uCoverCount>2.5&&covered(uCover3A,uCover3B))discard;
  if(uPocketOn>.5){
    vec2 a=uPocketA.xy,b=uPocketA.zw,c=uPocketB.xy,d=uPocketB.zw;
    float edge=vPx.x<b.x?mix(a.y,b.y,clamp((vPx.x-a.x)/(b.x-a.x),0.,1.)):vPx.x<c.x?mix(b.y,c.y,clamp((vPx.x-b.x)/(c.x-b.x),0.,1.)):mix(c.y,d.y,clamp((vPx.x-c.x)/(d.x-c.x),0.,1.));
    if(vPx.y>edge)discard;
  }
  vec2 uv = vUV.xy / vUV.z;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
  vec4 c = texture2D(uTex, uv);
  float a = c.a * uOpacity;
  // Keep the film's gold leaves and butterfly in front of the photograph.
  if(uShade>0.5){
    vec3 source=texture2D(uVideo,vPx/uVideoSize).rgb;
    float sat=(max(max(source.r,source.g),source.b)-min(min(source.r,source.g),source.b))/max(0.01,max(max(source.r,source.g),source.b));
    float gold=smoothstep(.32,.48,sat)*smoothstep(.06,.14,source.g-source.b)*smoothstep(.28,.48,source.r)*step(source.g*.95,source.r);
    a*=1.-gold;
  }
  if (uMasked > 0.5) {
    vec2 m = (uBand.xy + vPx * uBand.zw) / uVideoSize;
    float person = smoothstep(0.35, 0.65, texture2D(uVideo, m).r);
    a *= 1.0 - person;
  }
  // a painted surface sits a little inside its frame: soft shadow from the edge
  float e = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  c.rgb *= mix(1.0, 0.55 + 0.45 * smoothstep(0.0, 0.07, e), uShade);
  gl_FragColor = vec4(c.rgb * a, a);
}`;

function shader(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}
function texture(gl) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
// perspective-correct texture coordinates for a quad (q from the diagonals' intersection)
function quadUV(p) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = p;
  const d = (x2 - x0) * (y3 - y1) - (y2 - y0) * (x3 - x1);
  let q = [1, 1, 1, 1];
  if (Math.abs(d) > 1e-6) {
    const t = ((x1 - x0) * (y3 - y1) - (y1 - y0) * (x3 - x1)) / d, s = ((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)) / d;
    const cx = x0 + t * (x2 - x0), cy = y0 + t * (y2 - y0);
    const dist = (x, y) => Math.hypot(x - cx, y - cy);
    const di = [dist(x0, y0), dist(x1, y1), dist(x2, y2), dist(x3, y3)];
    if (t > 0 && t < 1 && s > 0 && s < 1) q = di.map((v, i) => (v + di[(i + 2) % 4]) / Math.max(1e-6, di[(i + 2) % 4]));
  }
  const uv = [[0, 0], [1, 0], [1, 1], [0, 1]];
  return [0, 1, 2, 0, 2, 3].flatMap((i) => [p[i * 2], p[i * 2 + 1], uv[i][0] * q[i], uv[i][1] * q[i], q[i]]);
}

export function createBabyRenderer(canvas, video, data) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: false, antialias: true });
  if (!gl) throw new Error("WebGL is not available");
  const W = data.frameW, H = data.frameH, VH = data.band ? data.band[1] + data.band[3] : H;
  const pv = program(gl, VS, FS_VIDEO), pl = program(gl, VS, FS_LAYER);
  const buf = gl.createBuffer();
  const vtex = texture(gl), layers = new Map();
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  const bind = (p) => {
    gl.useProgram(p); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const a = gl.getAttribLocation(p, "aPos"), b = gl.getAttribLocation(p, "aUV");
    gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(b); gl.vertexAttribPointer(b, 3, gl.FLOAT, false, 20, 8);
    gl.uniform2f(gl.getUniformLocation(p, "uFrame"), W, H);
  };
  function setLayer(key, source) {
    if (!source) { layers.delete(key); return; }
    const t = layers.get(key) || texture(gl);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    layers.set(key, t);
  }
  function resize() {
    const r = canvas.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(Math.min(W, r.width * d));
    if (canvas.width !== w) { canvas.width = w; canvas.height = Math.round(w * H / W); }
  }
  function draw(t) {
    if (video.readyState < 2) return;
    resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, vtex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.disable(gl.BLEND);
    bind(pv);
    gl.uniform1i(gl.getUniformLocation(pv, "uVideo"), 0);
    gl.uniform2f(gl.getUniformLocation(pv, "uScale"), 1, H / VH);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadUV([0, 0, W, 0, W, H, 0, H])), gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    const items = data.frames[Math.round(t * data.fps) - data.first] || [];
    if (!items.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    bind(pl);
    gl.uniform1i(gl.getUniformLocation(pl, "uVideo"), 0);
    gl.uniform1i(gl.getUniformLocation(pl, "uTex"), 1);
    gl.uniform2f(gl.getUniformLocation(pl, "uVideoSize"), W, VH);
    const band = data.band || [0, 0, 0, 0];
    gl.uniform4f(gl.getUniformLocation(pl, "uBand"), band[0], band[1], band[2] / W, band[3] / H);
    for (const it of items) {
      const [kind, id, x0, y0, x1, y1, x2, y2, x3, y3, op, masked] = it;
      const tex = layers.get((kind === 0 ? "p" : "t") + id);
      const frame=Math.round(t*data.fps),front=data.foreground?.[frame];
      const behind=kind===0&&front&&[x0,y0,x1,y1,x2,y2,x3,y3].some((x,i)=>Math.abs(x-front[i])>.1);
      gl.uniform1f(gl.getUniformLocation(pl,"uCoverCount"),behind?1:0);
      if(behind){const cx=(front[0]+front[2]+front[4]+front[6])/4,cy=(front[1]+front[3]+front[5]+front[7])/4;const q=front.map((x,i)=>(i%2?cy:cx)+(x-(i%2?cy:cx))*1.17);gl.uniform4f(gl.getUniformLocation(pl,'uCover1A'),...q.slice(0,4));gl.uniform4f(gl.getUniformLocation(pl,'uCover1B'),...q.slice(4,8));}
      const pocket=kind===1?data.cardPocket?.[frame]:null;gl.uniform1f(gl.getUniformLocation(pl,'uPocketOn'),pocket?1:0);
      if(pocket){gl.uniform4f(gl.getUniformLocation(pl,'uPocketA'),...pocket.slice(0,4));gl.uniform4f(gl.getUniformLocation(pl,'uPocketB'),...pocket.slice(4,8));}
      if (!tex || op <= 0) continue;
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1f(gl.getUniformLocation(pl, "uOpacity"), op);
      gl.uniform1f(gl.getUniformLocation(pl, "uMasked"), masked && data.band ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(pl, "uShade"), kind === 0 ? 1 : 0);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadUV([x0, y0, x1, y1, x2, y2, x3, y3])), gl.STREAM_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    gl.activeTexture(gl.TEXTURE0);
  }
  let id = 0, raf = 0, running = false;
  function start() {
    if (running) return; running = true;
    if (video.requestVideoFrameCallback) {
      const cb = (_, meta) => { if (!running) return; draw(meta.mediaTime); id = video.requestVideoFrameCallback(cb); };
      id = video.requestVideoFrameCallback(cb);
    } else {
      const loop = () => { if (!running) return; draw(video.currentTime); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
  }
  function stop() { running = false; if (id && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(id); cancelAnimationFrame(raf); }
  return { setLayer, start, stop, draw, destroy() { stop(); gl.getExtension("WEBGL_lose_context")?.loseContext(); } };
}
