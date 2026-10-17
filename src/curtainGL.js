// Material coordinates stay attached to the cloth as the overhead rings gather.
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
export const CURTAIN_END = 8.8;
export function curtainPoint(u, v, side, seconds, width, height) {
  const p = ease((seconds - 3.3 - v * .5) / 4.8);
  const target = width * (.17 - .105 * Math.pow(Math.sin(Math.PI * v), 1.3) + .025 * v);
  const span = width * .5 * (1 - p) + target * p;
  const edge = Math.sin(Math.PI * u), vertical = Math.sin(Math.PI * v);
  const moving = Math.sin(p * Math.PI);
  const ripple = Math.sin(u * 16 - v * 5 - seconds * 2.1) * moving;
  const x = u * span + edge * ripple * width * .006;
  const y = v * height + vertical * edge * (3 + 8 * p) + ripple * vertical * 3;
  const z = (3 + p * 19) * Math.sin(u * Math.PI * 20 + v * .4) * edge
    + vertical * edge * moving * 17 + p * u * u * 14;
  return [side < 0 ? x : width - x, y, z];
}

function shader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
  return shader;
}
const vertex = `attribute vec3 position; attribute vec3 normal; attribute vec2 uv;
uniform vec2 size; varying vec3 N; varying vec2 U;
void main(){
  float perspective=1100./(1100.-position.z);
  vec2 xy=(position.xy-size*.5)*perspective/size*2.;
  gl_Position=vec4(xy.x,-xy.y,-position.z/400.,1.);
  N=normal; U=uv;
}`;
const fragment = `precision mediump float;
uniform sampler2D fabric; varying vec3 N; varying vec2 U;
void main(){
  vec3 n=normalize(N); if(n.z<0.)n=-n;
  vec3 l=normalize(vec3(-.4,-.55,1.));
  float diffuse=max(dot(n,l),0.);
  float sheen=pow(max(dot(n,normalize(l+vec3(0.,0.,1.))),0.),18.);
  vec4 textile=texture2D(fabric,U);
  vec3 color=mix(vec3(.94,.90,.81),textile.rgb,textile.a);
  color*=.72+.29*diffuse;
  color+=vec3(1.,.94,.8)*sheen*.045;
  gl_FragColor=vec4(color,1.);
}`;

export function createCurtainRenderer(canvas, { onComplete, onError } = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!gl) throw Error('WebGL unavailable');
  const program = gl.createProgram();
  const vs = shader(gl, gl.VERTEX_SHADER, vertex), fs = shader(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Curtain shader unavailable');
  gl.useProgram(program);
  const columns = 100, rows = 48, stride = 8;
  const vertices = new Float32Array((columns + 1) * (rows + 1) * stride), indices = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const a = y * (columns + 1) + x, b = a + columns + 1;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const vbo = gl.createBuffer(), ibo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, vertices.byteLength, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  for (const [name, count, offset] of [['position', 3, 0], ['normal', 3, 12], ['uv', 2, 24]]) {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, count, gl.FLOAT, false, stride * 4, offset);
  }
  const size = gl.getUniformLocation(program, 'size'), texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([241, 231, 210, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  let disposed = false, running = false, elapsed = 0, last = 0, raf = 0, done = false, width = 1, height = 1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const photo = new Image();
  photo.onload = () => {
    if (disposed) return;
    gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo); draw();
  };
  photo.src = '/craft-ivory-curtains.webp';
  gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.clearColor(0, 0, 0, 0);
  function leaf(side) {
    let k = 0;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= columns; i++) {
      const u = i / columns, v = j / rows;
      const p = curtainPoint(u, v, side, elapsed, width, height);
      const a = curtainPoint(u + .0005, v, side, elapsed, width, height);
      const b = curtainPoint(u, Math.min(1, v + .0005), side, elapsed, width, height);
      // Use a backwards difference on the lower hem to avoid a zero normal.
      if (v === 1) { const prev = curtainPoint(u, v - .0005, side, elapsed, width, height); for (let n = 0; n < 3; n++) b[n] = p[n] + p[n] - prev[n]; }
      const ax = a[0] - p[0], ay = a[1] - p[1], az = a[2] - p[2];
      const bx = b[0] - p[0], by = b[1] - p[1], bz = b[2] - p[2];
      vertices[k++] = p[0]; vertices[k++] = p[1]; vertices[k++] = p[2];
      vertices[k++] = ay * bz - az * by; vertices[k++] = az * bx - ax * bz; vertices[k++] = ax * by - ay * bx;
      vertices[k++] = side < 0 ? u * .5 : 1 - u * .5; vertices[k++] = v;
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices); gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  }
  function draw() {
    if (disposed) return;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); leaf(-1); leaf(1);
    canvas.dataset.phase = !running ? 'closed' : elapsed < 3.3 ? 'cover' : elapsed < 5.3 ? 'gathering' : elapsed < CURTAIN_END ? 'settling' : 'open';
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.75);
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(size, width, height); draw();
  }
  function frame(now) {
    if (disposed || !running) return;
    elapsed += Math.min((now - last) / 1000, .06); last = now;
    if (reduced) elapsed = CURTAIN_END;
    draw();
    if (elapsed >= CURTAIN_END) { if (!done) { done = true; onComplete?.(); } return; }
    raf = requestAnimationFrame(frame);
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  const lost = event => { event.preventDefault(); cancelAnimationFrame(raf); onError?.(); };
  canvas.addEventListener('webglcontextlost', lost);
  return {
    open() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    reset() { cancelAnimationFrame(raf); running = false; elapsed = 0; done = false; draw(); },
    dispose() { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); photo.onload = null; canvas.removeEventListener('webglcontextlost', lost); gl.deleteBuffer(vbo); gl.deleteBuffer(ibo); gl.deleteTexture(texture); gl.deleteProgram(program); },
  };
}
