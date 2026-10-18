import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Heart, RotateCcw } from "lucide-react";
import { dateLabel } from "./catalog";
import { ensureFont } from "./fonts";
import "./film.css";
import PORTRAITS from "./castlePortraits.json";

// "The Castle Gates": a cinematic film invitation.
// The film (castle gates opening, the ballroom, an envelope rising on a crystal pedestal) plays once.
// Then everything becomes the couple's own: their photos replace the portraits on the stands, and their card
// rises out of the envelope in the film. The guest answers yes or no right there.
// The envelope geometry below is measured on the film's last frame (720 × 1280).

export const filmWords = {
  en: { invited: "YOU ARE INVITED", touch: "Touch to open the gates", families: "TOGETHER WITH THEIR FAMILIES", ask: "Will you celebrate with us?", yes: "Joyfully, yes", no: "Sadly, no", more: "All the details", replay: "Watch again", photo: "Your photo" },
  de: { invited: "DU BIST EINGELADEN", touch: "Berühren, um die Tore zu öffnen", families: "GEMEINSAM MIT IHREN FAMILIEN", ask: "Feierst du mit uns?", yes: "Ja, sehr gern", no: "Leider nein", more: "Alle Details", replay: "Noch einmal ansehen", photo: "Dein Foto" },
  fr: { invited: "VOUS ÊTES INVITÉ", touch: "Touchez pour ouvrir les grilles", families: "ENTOURÉS DE LEURS FAMILLES", ask: "Célébrerez-vous avec nous ?", yes: "Avec joie, oui", no: "Hélas, non", more: "Tous les détails", replay: "Revoir", photo: "Votre photo" },
};

// The portraits on the stands, tracked frame by frame in the film (30 fps): for each frame a list of
// [slot, left%, top%, width%, height%, clipLeft%, clipRight%, opacity] in the 720 × 1280 frame.
// Each video frame and its photos are painted together into one canvas, so the photos can never lag
// behind the film (a separate layer on top of a <video> is always a frame late while things move).

// a photo, toned once like an oil portrait in warm candlelight
export function tonePhoto(src) {
  return new Promise((ok) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 700 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0, c.width, c.height);
      g.globalCompositeOperation = "soft-light"; g.fillStyle = "#c79a5a"; g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = "multiply"; g.fillStyle = "#f3e2c8"; g.fillRect(0, 0, c.width, c.height);
      ok(c);
    };
    img.onerror = () => ok(null);
    img.src = src;
  });
}

function useFilmCanvas(video, canvas, playing, srcFor) {
  const toned = useRef(new Map());
  // tone the couple's photos before the film starts
  useEffect(() => {
    [1, 2, 3, 4].forEach((slot) => {
      const src = srcFor(slot);
      if (src && src !== "blur" && !toned.current.has(src)) { toned.current.set(src, null); tonePhoto(src).then((c) => toned.current.set(src, c)); }
    });
  }, [srcFor]);
  useEffect(() => {
    const v = video.current, cv = canvas.current;
    if (!playing || !v || !cv) return;
    const g = cv.getContext("2d");
    const size = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(Math.min(720, r.width * d)); cv.height = Math.round(cv.width * 16 / 9);
    };
    size();
    const canFilter = typeof g.filter === "string";
    let id = 0, raf = 0, dead = false;
    const paint = (t) => {
      const W = cv.width, H = cv.height;
      if (v.readyState < 2) return;
      g.globalAlpha = 1; g.filter = "none";
      g.drawImage(v, 0, 0, W, H);
      const items = PORTRAITS.frames[Math.round(t * PORTRAITS.fps) - PORTRAITS.first] || [];
      for (const [slot, x, y, w, h, cl, cr, op] of items) {
        const src = srcFor(slot);
        if (src === null) continue;
        const dx = x * W / 100, dy = y * H / 100, dw = w * W / 100, dh = h * H / 100;
        const vx = dx + dw * cl / 100, vw = dw * (1 - (cl + cr) / 100);
        if (vw < 1 || dh < 1) continue;
        g.save();
        g.beginPath(); g.rect(vx, dy, vw, dh); g.clip();
        g.globalAlpha = op;
        const ph = src === "blur" ? null : toned.current.get(src);
        if (ph) {
          // cover-crop the photo into the painting, faces kept in the upper third
          const r = dw / dh, pr = ph.width / ph.height;
          let sw = ph.width, sh = ph.height, sx = 0, sy = 0;
          if (pr > r) { sw = sh * r; sx = (ph.width - sw) / 2; } else { sh = sw / r; sy = (ph.height - sh) * 0.28; }
          if (canFilter && w > 38) g.filter = `blur(${Math.min(3, (w - 38) / 10) * W / 720}px)`;
          g.drawImage(ph, sx, sy, sw, sh, dx, dy, dw, dh);
          g.filter = "none";
        } else if (canFilter) {
          g.filter = `blur(${12 * W / 720}px) sepia(0.4)`;
          g.drawImage(v, dx, dy, dw, dh, dx, dy, dw, dh);
          g.filter = "none";
        } else {
          g.fillStyle = "#3b2c20"; g.fillRect(dx, dy, dw, dh);
        }
        // the painting sits a little inside the frame: soft shadow from the gilded edge
        const sh = Math.max(2, dw * 0.06), grd = (x0, y0, x1, y1) => { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, "rgba(30,18,8,.55)"); q.addColorStop(1, "rgba(30,18,8,0)"); return q; };
        g.fillStyle = grd(dx, 0, dx + sh, 0); g.fillRect(dx, dy, sh, dh);
        g.fillStyle = grd(dx + dw, 0, dx + dw - sh, 0); g.fillRect(dx + dw - sh, dy, sh, dh);
        g.fillStyle = grd(0, dy, 0, dy + sh); g.fillRect(dx, dy, dw, sh);
        g.fillStyle = grd(0, dy + dh, 0, dy + dh - sh); g.fillRect(dx, dy + dh - sh, dw, sh);
        g.restore();
      }
    };
    if (v.requestVideoFrameCallback) {
      const cb = (_, meta) => { if (dead) return; paint(meta.mediaTime); id = v.requestVideoFrameCallback(cb); };
      id = v.requestVideoFrameCallback(cb);
    } else {
      const loop = () => { if (dead) return; paint(v.currentTime); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener("resize", size);
    return () => { dead = true; if (id && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(id); cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, [playing, video, canvas, srcFor]);
}

const FILM = { src: "/castle-film.mp4", webm: "/castle-film.webm", poster: "/castle-film-cover.webp", end: "/castle-film-end.webp", pocket: "/castle-pocket.webp" };

export function CardFace({ event, lang, c, font }) {
  const names = event.names.split(/\s*&\s*/);
  const initials = names.map((n) => n.trim()[0] || "").join("");
  return (
    <div className="film-card-face">
      <span className="film-card-monogram" aria-hidden="true">{initials}</span>
      <span className="film-card-over">{c.families}</span>
      <h2 className="film-card-names" style={{ fontFamily: font.family }}>
        {names.map((n, i) => (
          <React.Fragment key={i}>
            {i > 0 && <em>&amp;</em>}
            <span>{n}</span>
          </React.Fragment>
        ))}
      </h2>
      {event.subtitle && <p className="film-card-line">{event.subtitle}</p>}
      <span className="film-card-rule" aria-hidden="true" />
      <p className="film-card-date">
        {dateLabel(event.date, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        {event.time && <> · {event.time}</>}
      </p>
      <p className="film-card-venue">{event.venue}</p>
      {event.address && <p className="film-card-address">{event.address}</p>}
    </div>
  );
}

export function FilmStage({ event, guest, opened, onOpen, onReplay, onAnswer, lang = "en", preview = false }) {
  const c = filmWords[lang] || filmWords.en;
  const font = ensureFont(event.font && event.font !== "classic" ? event.font : "vibes");
  const stage = useRef(null), video = useRef(null), slotCard = useRef(null), present = useRef(null);
  const timers = useRef([]);
  const [phase, setPhase] = useState("idle"); // idle → playing → rise → present → ask
  const [flip, setFlip] = useState(null);
  const ok = (p) => typeof p === "string" && p.startsWith("data:image/");
  // four portraits stand in the film: 1st pair left/right, 2nd pair left/right
  const own = [event.photo, event.photo2, event.photo3, event.photo4].map((p) => (ok(p) ? p : null));
  const key = own.map((p) => (p ? p.length : 0)).join();
  // a missing photo borrows its partner's (3↔1, 4↔2), then any photo; with none, the sample shows the
  // film's own portraits and a real invitation softens them instead
  const srcFor = React.useCallback((slot) => {
    const order = [[0, 2, 1, 3], [1, 3, 0, 2], [2, 0, 3, 1], [3, 1, 2, 0]][slot - 1] || [0, 1, 2, 3];
    for (const i of order) if (own[i]) return own[i];
    return preview ? null : "blur";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, preview]);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const names = event.names.split(/\s*&\s*/);

  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  // after the film the card rises out of the envelope
  function afterFilm() {
    if (reduced) { setPhase("ask"); return; }
    rise();
  }
  function rise() { setPhase("rise"); later(1900, () => setPhase("present")); }

  useEffect(() => {
    if (!opened) { clear(); setPhase("idle"); setFlip(null); const v = video.current; if (v) { v.pause(); try { v.currentTime = 0; } catch { /* not loaded yet */ } } return; }
    if (phase !== "idle") return;
    if (reduced) { afterFilm(); return; }
    const v = video.current;
    setPhase("playing");
    const p = v?.play?.();
    if (p && p.catch) p.catch(() => afterFilm());
    else if (!v) afterFilm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  // FLIP: the presented card starts exactly where the risen card is, then glides to the centre
  useLayoutEffect(() => {
    if (phase !== "present") return;
    const from = slotCard.current?.getBoundingClientRect(), to = present.current?.getBoundingClientRect();
    if (!from || !to || !to.width) { setPhase("ask"); return; }
    setFlip({ x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top + from.height / 2 - (to.top + to.height / 2), s: from.width / to.width });
    requestAnimationFrame(() => requestAnimationFrame(() => setFlip(null)));
    later(1300, () => setPhase("ask"));
  }, [phase]);

  const canvas = useRef(null);
  useFilmCanvas(video, canvas, phase === "playing", srcFor);
  const shown = ["present", "ask"].includes(phase);
  const ended = !["idle", "playing"].includes(phase);
  return (
    <section ref={stage} className={`film-stage film-is-${phase}`} aria-label="The Castle Gates invitation">
      <div className="film-backdrop" style={{ backgroundImage: `url(${FILM.end})` }} aria-hidden="true" />
      <div className="film-frame">
        <video ref={video} className="film-video" poster={FILM.poster} muted playsInline preload="auto" onEnded={afterFilm} onError={() => phase === "playing" && afterFilm()} aria-hidden="true">
          <source src={FILM.src} type="video/mp4" />
          <source src={FILM.webm} type="video/webm" />
        </video>
        <canvas ref={canvas} className="film-canvas" aria-hidden="true" style={{ opacity: phase === "playing" ? 1 : 0 }} />
        <img className="film-end" src={FILM.end} alt="" aria-hidden="true" style={{ opacity: ended ? 1 : 0 }} />
        <div className="film-slot" aria-hidden="true">
          <div ref={slotCard} className="film-card film-card-small" style={{ visibility: shown ? "hidden" : "visible" }}>
            <CardFace event={event} lang={lang} c={c} font={font} />
          </div>
        </div>
        <img className="film-pocket" src={FILM.pocket} alt="" aria-hidden="true" />
      </div>
      {ended && <div className="film-petals" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${11 + (i % 5) * 2}s` }} />)}</div>}


      {shown && (
        <div className="film-present">
          <div ref={present} className="film-card film-card-big" style={flip ? { transform: `translate(${flip.x}px, ${flip.y}px) scale(${flip.s})`, transition: "none" } : undefined}>
            <CardFace event={event} lang={lang} c={c} font={font} />
          </div>
          <div className="film-ask" aria-hidden={phase !== "ask"}>
            <p>{c.ask}</p>
            <div>
              <button className="film-yes" onClick={() => onAnswer?.("yes")}><Heart size={15} />{c.yes}</button>
              <button className="film-no" onClick={() => onAnswer?.("no")}>{c.no}</button>
            </div>
            <button className="film-more" onClick={() => onAnswer?.(null)}>{c.more}<ArrowDown size={14} /></button>
          </div>
        </div>
      )}

      {phase === "idle" && (
        <div className="film-welcome">
          <div className="film-welcome-top">
            <span>{guest?.name ? `${guest.name.toUpperCase()},` : ""} {c.invited}</span>
            <h1 style={{ fontFamily: font.family }}>{names.map((n, i) => <React.Fragment key={i}>{i > 0 && <em>&amp;</em>}<span>{n}</span></React.Fragment>)}</h1>
          </div>
          <button className="film-open" onClick={onOpen} aria-label={c.touch}>
            <span className="film-open-seal">{names.map((n) => n.trim()[0]).join("")}</span>
            <span className="film-open-text">{c.touch}</span>
          </button>
        </div>
      )}
      {phase === "ask" && <button className="film-replay" aria-label={c.replay} title={c.replay} onClick={onReplay}><RotateCcw size={15} /></button>}
    </section>
  );
}
