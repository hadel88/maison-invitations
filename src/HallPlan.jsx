import React, { useEffect, useRef, useState } from 'react';
import { Upload, Crop, Ruler, ScanSearch, Save, Download, Trash2, RotateCw, RotateCcw, Plus, Check, X, LayoutGrid } from 'lucide-react';
import { api } from './client';
import { KINDS, straightSize, warpQuad, toGray, detectCircles, tablesOf, mergeTables } from './hallPlan';

// The hall plan: upload the venue's floor plan (photo, screenshot or drawing), straighten it, set its scale,
// then place tables, dance floor, stage and buffet on it. Its tables are the seating-plan tables.
// Everything (straightening, detection) runs in the browser: no AI, no cost per use.

const uid = () => crypto.randomUUID();
// colours as attributes (not only CSS) so the downloaded picture looks the same as the screen
const shapeStyle = (kind, ppm) => ({ fill: kind === 'dance' ? '#f3ead4' : kind === 'stage' ? '#e9dfc8' : kind === 'buffet' ? '#f1e8d6' : '#fffdf8', stroke: '#a8813f', strokeWidth: Math.max(1.5, ppm * 0.05), strokeDasharray: kind === 'dance' ? `${ppm * 0.25} ${ppm * 0.15}` : undefined });
const BLANK = { w: 2000, h: 1200, pxPerM: 50, scaled: true, items: [] }; // an empty 40 × 24 m hall

function loadImage(src) { return new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error('This image could not be opened. Please use a JPG or PNG photo or screenshot.')); i.src = src; }); }
function canvasOf(img, maxSide) {
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  const c = document.createElement('canvas'); c.width = Math.round((img.naturalWidth || img.width) * k); c.height = Math.round((img.naturalHeight || img.height) * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c;
}
// JPEG small enough for the database (about 1 MB of text at most)
function jpeg(canvas) {
  let c = canvas;
  for (let q = 0.85; ; q -= 0.1) {
    const url = c.toDataURL('image/jpeg', Math.max(0.45, q));
    if (url.length <= 1400000) return url;
    if (q < 0.5) { const s = document.createElement('canvas'); s.width = Math.round(c.width * 0.8); s.height = Math.round(c.height * 0.8); s.getContext('2d').drawImage(c, 0, 0, s.width, s.height); c = s; q = 0.95; }
  }
}

export default function HallPlan({ id, isDemo, demoTables = [], onSaved }) {
  const [layout, setLayout] = useState(null), [image, setImage] = useState(null), [newImage, setNewImage] = useState(false);
  const [seated, setSeated] = useState({}), [sel, setSel] = useState(null), [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState('edit'), [source, setSource] = useState(null), [sourceUrl, setSourceUrl] = useState(''), [corners, setCorners] = useState(null);
  const [scalePts, setScalePts] = useState([]), [meters, setMeters] = useState('');
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [error, setError] = useState('');
  const svg = useRef(null), drag = useRef(null), file = useRef(null);

  useEffect(() => {
    if (isDemo) { setLayout(mergeTables(BLANK, demoTables)); return; }
    let live = true;
    api('hall', { query: { id } }).then((d) => { if (!live) return; const base = d.layout?.w ? d.layout : BLANK; setLayout(mergeTables(base, d.tables || [])); setImage(d.image || null); setSeated(d.seated || {}); })
      .catch((e) => { if (live) { setError(e.message); setLayout(null); } });
    return () => { live = false; };
  }, [id, isDemo]);

  const ppm = layout?.pxPerM || 50;
  const items = layout?.items || [];
  const selected = items.find((it) => it.id === sel);
  const change = (fn) => { setLayout((l) => ({ ...l, items: fn(l.items) })); setDirty(true); };
  const update = (patch) => change((all) => all.map((it) => it.id === sel ? { ...it, ...patch } : it));

  // pointer position in plan coordinates
  function point(e, el = svg.current) { const p = el.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const r = p.matrixTransform(el.getScreenCTM().inverse()); return [r.x, r.y]; }

  function add(kind) {
    const k = KINDS[kind], n = items.filter((it) => KINDS[it.kind]?.table).length + 1;
    const it = { id: uid(), kind, x: layout.w / 2, y: layout.h / 2, w: k.w * ppm, h: k.h * ppm, rot: 0, name: k.table ? 'Table ' + n : k.label, ...(k.table ? { capacity: k.capacity } : {}) };
    change((all) => [...all, it]); setSel(it.id);
  }
  function startDrag(e, it) { e.stopPropagation(); setSel(it.id); const [x, y] = point(e); drag.current = { id: it.id, dx: it.x - x, dy: it.y - y }; e.currentTarget.setPointerCapture?.(e.pointerId); }
  function moveDrag(e) { if (!drag.current) return; const [x, y] = point(e), d = drag.current; change((all) => all.map((it) => it.id === d.id ? { ...it, x: Math.round(x + d.dx), y: Math.round(y + d.dy) } : it)); }

  // ——— upload → straighten → scale ———
  async function pick(f) {
    if (!f) return; setError(''); setMsg('');
    try {
      const url = URL.createObjectURL(f), img = await loadImage(url); URL.revokeObjectURL(url);
      const c = canvasOf(img, 2000), w = c.width, h = c.height, m = Math.round(Math.min(w, h) * 0.06);
      setSource(c); setSourceUrl(c.toDataURL('image/jpeg', 0.8)); setCorners([[m, m], [w - m, m], [w - m, h - m], [m, h - m]]); setMode('corners');
    } catch (e) { setError(e.message); }
  }
  async function useImage(straighten) {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 30));
    try {
      let out = source;
      if (straighten) {
        const [ow, oh] = straightSize(corners, 1600), ctx = source.getContext('2d');
        const px = warpQuad(ctx.getImageData(0, 0, source.width, source.height).data, source.width, source.height, corners, ow, oh);
        out = document.createElement('canvas'); out.width = ow; out.height = oh; out.getContext('2d').putImageData(new ImageData(px, ow, oh), 0, 0);
      } else out = canvasOf(source, 1600);
      const url = jpeg(out), img = await loadImage(url);
      const old = layout || BLANK, kx = img.width / old.w, ky = img.height / old.h;
      setLayout({ w: img.width, h: img.height, pxPerM: img.width / 30, scaled: false, items: (old.items || []).map((it) => ({ ...it, x: it.x * kx, y: it.y * ky, w: it.w * kx, h: it.h * kx })) });
      setImage(url); setNewImage(true); setDirty(true); setSource(null); setCorners(null); setScalePts([]); setMeters(''); setMode('scale');
      setMsg('Now set the scale: click two points whose distance you know, for example both ends of a wall.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function applyScale() {
    const m = Number(String(meters).replace(',', '.'));
    if (!(m > 0) || scalePts.length < 2) return;
    const px = Math.hypot(scalePts[1][0] - scalePts[0][0], scalePts[1][1] - scalePts[0][1]), next = px / m, k = next / ppm;
    // keep each item's real size in metres
    setLayout((l) => ({ ...l, pxPerM: next, scaled: true, items: l.items.map((it) => ({ ...it, w: it.w * k, h: it.h * k })) }));
    setDirty(true); setMode('edit'); setScalePts([]); setMsg(`Scale set: ${m} m. Tables now have their real size.`);
  }

  // ——— detect round tables ———
  async function detect() {
    if (!image) return;
    setBusy(true); setError(''); setMsg('');
    await new Promise((r) => setTimeout(r, 30));
    try {
      const img = await loadImage(image), c = canvasOf(img, 520), k = layout.w / c.width;
      const g = toGray(c.getContext('2d').getImageData(0, 0, c.width, c.height).data, c.width, c.height);
      // a round table is roughly 1.2–2.6 m across
      // without a scale, look for circles 1.2–6 % of the plan's width
      const rMin = layout.scaled ? (0.6 * ppm) / k : c.width * 0.012, rMax = layout.scaled ? (1.3 * ppm) / k : c.width * 0.06;
      const found = detectCircles(g, c.width, c.height, rMin, rMax)
        .map((x) => ({ x: x.x * k, y: x.y * k, r: x.r * k }))
        .filter((x) => !items.some((it) => Math.hypot(it.x - x.x, it.y - x.y) < Math.max(it.w, it.h) / 2 + x.r * 0.5));
      let n = items.filter((it) => KINDS[it.kind]?.table).length;
      const fresh = found.map((x) => ({ id: uid(), kind: 'round', x: Math.round(x.x), y: Math.round(x.y), w: Math.round(x.r * 2), h: Math.round(x.r * 2), rot: 0, name: 'Table ' + (++n), capacity: 8 }));
      if (fresh.length) { change((all) => [...all, ...fresh]); setMsg(`Found ${fresh.length} round ${fresh.length === 1 ? 'table' : 'tables'}. Please check them and set the right number of seats.`); }
      else setMsg('No round tables found. Detection works best on clean, top-down drawings; please place the tables by hand.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function save() {
    setBusy(true); setError(''); setMsg('');
    const clean = { ...layout, items: items.map(({ fresh, ...it }) => it) };
    try {
      if (isDemo) { setMsg('Demo: nothing is saved.'); setDirty(false); return; }
      const d = await api('hall', { method: 'POST', data: { invitation: id, image: newImage ? (image || '') : null, layout: clean, tables: tablesOf(items) } });
      setSeated(d.seated || {}); setNewImage(false); setDirty(false); setMsg('Hall plan saved. Its tables are now the tables of your seating plan.'); onSaved?.();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function exportPng() {
    const node = svg.current.cloneNode(true);
    node.querySelectorAll('.hp-handle,.hp-selection').forEach((n) => n.remove());
    node.setAttribute('width', layout.w); node.setAttribute('height', layout.h);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(node));
    const img = await loadImage(url), c = document.createElement('canvas'); c.width = layout.w; c.height = layout.h;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fbf8f1'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0);
    const a = document.createElement('a'); a.download = 'hall-plan.png'; a.href = c.toDataURL('image/png'); a.click();
  }

  if (error && !layout) return <section className="pw-card pw-wide"><p className="pw-warn" role="alert">{error}</p></section>;
  if (!layout) return <section className="pw-card pw-wide"><p className="pw-muted" role="status">Opening the hall plan…</p></section>;

  const font = Math.max(12, ppm * 0.32);
  const people = (it) => (seated[it.id] || []);
  const count = (it) => people(it).reduce((n, p) => n + (p.party || 1), 0);

  // ——— corners: drag the 4 handles onto the room's corners ———
  if (mode === 'corners' && source) return <section className="pw-card pw-wide hp">
    <h2><Crop size={17} />Straighten the plan</h2>
    <p className="pw-muted">Drag the four gold points onto the corners of the room (or of the drawing). The plan is then flattened to a top-down view.</p>
    <div className="hp-stage">
      <svg viewBox={`0 0 ${source.width} ${source.height}`} className="hp-svg" onPointerMove={(e) => { if (drag.current?.corner == null) return; const [x, y] = point(e, e.currentTarget); setCorners((c) => c.map((p, i) => i === drag.current.corner ? [Math.max(0, Math.min(source.width, x)), Math.max(0, Math.min(source.height, y))] : p)); }} onPointerUp={() => { drag.current = null; }}>
        <image href={sourceUrl} width={source.width} height={source.height} />
        <polygon points={corners.map((p) => p.join(',')).join(' ')} className="hp-quad" />
        {corners.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={Math.max(source.width, source.height) * 0.018} className="hp-corner" onPointerDown={(e) => { drag.current = { corner: i }; e.currentTarget.setPointerCapture?.(e.pointerId); }} />)}
      </svg>
    </div>
    <div className="hp-bar">
      <button className="pw-btn" disabled={busy} onClick={() => useImage(true)}><Check size={14} />{busy ? 'Straightening…' : 'Straighten'}</button>
      <button className="pw-btn ghost" disabled={busy} onClick={() => useImage(false)}>Use it as it is</button>
      <button className="pw-btn ghost" disabled={busy} onClick={() => { setMode('edit'); setSource(null); }}><X size={14} />Cancel</button>
    </div>
  </section>;

  return <section className="pw-card pw-wide hp">
    <h2><LayoutGrid size={17} />Hall plan</h2>
    {!image && !items.length && <p className="pw-muted">Upload the venue’s floor plan (a photo, a screenshot or the drawing), or start on an empty hall and place the tables.</p>}
    <div className="hp-bar">
      <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pick(e.target.files[0]); e.target.value = ''; }} />
      <button className="pw-btn ghost" onClick={() => file.current.click()}><Upload size={14} />{image ? 'Replace plan' : 'Upload floor plan'}</button>
      {image && <button className="pw-btn ghost" onClick={() => { setMode(mode === 'scale' ? 'edit' : 'scale'); setScalePts([]); setMsg('Click two points whose distance you know.'); }}><Ruler size={14} />Set scale</button>}
      {image && <button className="pw-btn ghost" disabled={busy} onClick={detect}><ScanSearch size={14} />{busy ? 'Looking…' : 'Find round tables'}</button>}
      <span className="hp-gap" />
      <button className="pw-btn ghost" onClick={exportPng}><Download size={14} />Download</button>
      <button className="pw-btn" disabled={busy || !dirty} onClick={save}><Save size={14} />{dirty ? 'Save' : 'Saved'}</button>
    </div>
    <div className="hp-add">{Object.entries(KINDS).map(([k, v]) => <button key={k} onClick={() => add(k)}><Plus size={13} />{v.label}</button>)}</div>
    {mode === 'scale' && <div className="hp-scale">
      <Ruler size={15} /><span>{scalePts.length < 2 ? `Click point ${scalePts.length + 1} of 2 on the plan.` : 'Distance between the two points:'}</span>
      {scalePts.length === 2 && <><input inputMode="decimal" value={meters} onChange={(e) => setMeters(e.target.value)} placeholder="e.g. 12" aria-label="Metres" autoFocus /><span>m</span><button className="pw-btn" disabled={!(Number(String(meters).replace(',', '.')) > 0)} onClick={applyScale}>Set</button></>}
      <button className="pw-btn ghost" onClick={() => { setMode('edit'); setScalePts([]); setMsg(''); }}>{scalePts.length ? 'Cancel' : 'Skip'}</button>
    </div>}
    {msg && <p className="pw-muted hp-msg" role="status">{msg}</p>}
    {error && <p className="pw-warn" role="alert">{error}</p>}

    <div className="hp-layout">
      <div className="hp-stage">
        <svg ref={svg} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${layout.w} ${layout.h}`} className={'hp-svg' + (mode === 'scale' ? ' measuring' : '')}
          onPointerMove={moveDrag} onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}
          onPointerDown={(e) => { if (mode === 'scale') { const p = point(e); setScalePts((s) => s.length >= 2 ? [p] : [...s, p]); } else setSel(null); }}>
          <defs>
            <pattern id="hp-grid" width={ppm} height={ppm} patternUnits="userSpaceOnUse"><path d={`M ${ppm} 0 L 0 0 0 ${ppm}`} fill="none" stroke="#d9cdb1" strokeWidth="1" /></pattern>
          </defs>
          <rect width={layout.w} height={layout.h} fill={image ? '#fff' : '#fbf8f1'} />
          {image ? <image href={image} width={layout.w} height={layout.h} opacity=".9" /> : <rect width={layout.w} height={layout.h} fill="url(#hp-grid)" />}
          {items.map((it) => {
            const k = KINDS[it.kind] || KINDS.round, on = it.id === sel, seats = it.capacity || 0, n = count(it);
            const chairs = k.table ? Array.from({ length: Math.min(seats, 24) }, (_, i) => {
              if (it.kind === 'round') { const a = (i / seats) * Math.PI * 2, R = it.w / 2 + ppm * 0.28; return [Math.cos(a) * R, Math.sin(a) * R]; }
              const side = i % 2 ? 1 : -1, per = Math.ceil(seats / 2), j = Math.floor(i / 2); return [-it.w / 2 + (it.w / per) * (j + 0.5), side * (it.h / 2 + ppm * 0.28)];
            }) : [];
            return <g key={it.id} transform={`translate(${it.x} ${it.y}) rotate(${it.rot || 0})`} className={'hp-item hp-' + it.kind + (on ? ' on' : '')} onPointerDown={(e) => mode !== 'scale' && startDrag(e, it)}>
              {chairs.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={ppm * 0.2} className="hp-chair" fill="#efe3c6" stroke="#b8924f" strokeWidth={Math.max(1, ppm * 0.03)} />)}
              {it.kind === 'round' ? <circle r={it.w / 2} className="hp-shape" {...shapeStyle(it.kind, ppm)} /> : <rect x={-it.w / 2} y={-it.h / 2} width={it.w} height={it.h} rx={it.kind === 'dance' ? 2 : ppm * 0.06} className="hp-shape" {...shapeStyle(it.kind, ppm)} />}
              {on && (it.kind === 'round' ? <circle r={it.w / 2 + ppm * 0.6} className="hp-selection" /> : <rect x={-it.w / 2 - ppm * 0.5} y={-it.h / 2 - ppm * 0.5} width={it.w + ppm} height={it.h + ppm} className="hp-selection" />)}
              <g transform={`rotate(${-(it.rot || 0)})`}>
                <text y={k.table ? -font * 0.15 : font * 0.35} fontSize={font} className="hp-label" textAnchor="middle" fill="#3d4436" fontFamily="Cormorant Garamond, Georgia, serif">{it.name}</text>
                {k.table && <text y={font * 1.05} fontSize={font * 0.72} className="hp-sub" textAnchor="middle" fill={n > seats ? '#9b3d2f' : '#8a7546'} fontFamily="DM Sans, Arial, sans-serif">{n}/{seats}</text>}
              </g>
            </g>;
          })}
          {scalePts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={Math.max(6, layout.w * 0.006)} className="hp-handle" />)}
          {scalePts.length === 2 && <line x1={scalePts[0][0]} y1={scalePts[0][1]} x2={scalePts[1][0]} y2={scalePts[1][1]} className="hp-handle hp-measure" />}
        </svg>
      </div>

      <aside className="hp-panel">
        {selected ? <>
          <span className="pw-kicker">{(KINDS[selected.kind]?.label || '').toUpperCase()}</span>
          <label>Name<input value={selected.name || ''} maxLength={60} onChange={(e) => update({ name: e.target.value })} /></label>
          {KINDS[selected.kind]?.table && <label>Seats<input type="number" min={1} max={50} value={selected.capacity} onChange={(e) => update({ capacity: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} /></label>}
          {selected.kind === 'round'
            ? <label>Diameter (m)<input type="number" step="0.1" min="0.6" max="4" value={(selected.w / ppm).toFixed(1)} onChange={(e) => { const v = Math.max(0.6, Number(e.target.value) || 0.6) * ppm; update({ w: v, h: v }); }} /></label>
            : <div className="hp-two"><label>Length (m)<input type="number" step="0.1" min="0.5" max="40" value={(selected.w / ppm).toFixed(1)} onChange={(e) => update({ w: Math.max(0.5, Number(e.target.value) || 0.5) * ppm })} /></label><label>Width (m)<input type="number" step="0.1" min="0.5" max="40" value={(selected.h / ppm).toFixed(1)} onChange={(e) => update({ h: Math.max(0.5, Number(e.target.value) || 0.5) * ppm })} /></label></div>}
          {selected.kind !== 'round' && <div className="hp-rot"><button className="pw-btn ghost" onClick={() => update({ rot: ((selected.rot || 0) - 15) % 360 })} aria-label="Rotate left"><RotateCcw size={14} /></button><span>{selected.rot || 0}°</span><button className="pw-btn ghost" onClick={() => update({ rot: ((selected.rot || 0) + 15) % 360 })} aria-label="Rotate right"><RotateCw size={14} /></button></div>}
          {KINDS[selected.kind]?.table && <div className="hp-guests"><small>SEATED HERE</small>{people(selected).length ? people(selected).map((p, i) => <span key={i}>{p.name}{p.party > 1 ? ` (${p.party})` : ''}</span>) : <span className="pw-muted">Nobody yet. Guests are seated in the host’s seating plan.</span>}</div>}
          <button className="pw-btn ghost hp-delete" onClick={() => { change((all) => all.filter((it) => it.id !== sel)); setSel(null); }}><Trash2 size={14} />Remove</button>
        </> : <>
          <span className="pw-kicker">THE ROOM</span>
          <p className="pw-muted">{items.filter((it) => KINDS[it.kind]?.table).length} tables · {tablesOf(items).reduce((n, t) => n + t.capacity, 0)} seats · {items.reduce((n, it) => n + count(it), 0)} guests seated</p>
          <p className="pw-muted">Tap an item to edit it, drag it to move it. {image ? '' : 'Each grid square is 1 m.'}</p>
          {image && ppm && <p className="pw-muted">Scale: {(layout.w / ppm).toFixed(1)} m wide{layout.scaled === false ? ' (assumed; use “Set scale” for real sizes)' : ''}.</p>}
        </>}
      </aside>
    </div>
  </section>;
}
