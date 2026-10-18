import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Heart, RotateCcw } from "lucide-react";
import { dateLabel } from "./catalog";
import { ensureFont } from "./fonts";
import { CardFace, filmWords, tonePhoto } from "./FilmInvitation";
import { createStoryRenderer } from "./storyGL";
import STORY from "./storyFilm.json";
import "./film.css";

// "Once Upon a Castle": a 60-second film. The couple walks past the mirrors (which show their photos),
// writes the invitation (with their names in ink), seals it, and it flies to the castle, where the card
// opens with their own words. Then the guest answers. Everything is drawn into one WebGL canvas
// together with the film frame (see storyGL.js); surfaces were tracked in the film itself.

const FILM = { src: "/story-film.mp4", webm: "/story-film.webm", poster: "/story-film-poster.webp", end: "/story-film-end.webp" };
// the card standing on the crystal in the film's last frame (% of the 720 × 1280 frame)
const END_CARD = { left: 53.6, top: 58.8, width: 28.3 };

// the mirrors' glass is tall and narrow: photos are cover-cropped to it, faces kept in the upper part
const MIRROR_ASPECT = 0.42;
function coverCrop(c, aspect) {
  if (!c) return null;
  const r = c.width / c.height;
  let sw = c.width, sh = c.height, sx = 0, sy = 0;
  if (r > aspect) { sw = sh * aspect; sx = (c.width - sw) / 2; } else { sh = sw / aspect; sy = (c.height - sh) * 0.25; }
  const o = document.createElement("canvas");
  o.height = Math.min(900, Math.round(sh)); o.width = Math.round(o.height * aspect);
  o.getContext("2d").drawImage(c, sx, sy, sw, sh, 0, 0, o.width, o.height);
  return o;
}
const okPhoto = (p) => typeof p === "string" && p.startsWith("data:image/");

// the couple's words, written onto the film's blank card and the letter on the desk
export async function drawWords(event, lang, family) {
  try { await document.fonts.load(`64px ${family}`); } catch { /* fallback font */ }
  const c = filmWords[lang] || filmWords.en;
  const names = event.names.split(/\s*&\s*/);
  // the card: 870 × 760, gold-brown ink like the card's own ornaments
  const card = document.createElement("canvas"); card.width = 870; card.height = 760;
  const g = card.getContext("2d");
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#8a6a36"; g.font = "500 26px 'Cormorant Garamond', Georgia, serif";
  g.letterSpacing = "6px"; g.fillText(c.families, 435, 70); g.letterSpacing = "0px";
  g.fillStyle = "#4a3926";
  const fit = (txt, size, max) => { let s = size; do { g.font = `${s}px ${family}`; s -= 4; } while (g.measureText(txt).width > max && s > 30); };
  if (names.length > 1) {
    fit(names[0], 112, 760); g.fillText(names[0], 435, 190);
    g.fillStyle = "#b48a3c"; g.font = `64px ${family}`; g.fillText("&", 435, 285);
    g.fillStyle = "#4a3926"; fit(names[1], 112, 760); g.fillText(names[1], 435, 375);
  } else { fit(event.names, 112, 780); g.fillText(event.names, 435, 270); }
  g.fillStyle = "#c49a4e"; g.fillRect(345, 465, 180, 2);
  g.fillStyle = "#5d4a33"; g.font = "500 30px 'Cormorant Garamond', Georgia, serif";
  g.letterSpacing = "3px";
  g.fillText(dateLabel(event.date, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase() + (event.time ? " · " + event.time : ""), 435, 530, 820);
  g.letterSpacing = "0px";
  g.fillStyle = "#4a3926"; g.font = "italic 44px 'Cormorant Garamond', Georgia, serif";
  g.fillText(event.venue || "", 435, 610, 820);
  if (event.address) { g.fillStyle = "#8b7558"; g.font = "28px 'Cormorant Garamond', Georgia, serif"; g.fillText(event.address, 435, 670, 820); }
  // the letter: a line of handwriting in dark ink
  const letter = document.createElement("canvas"); letter.width = 1200; letter.height = 200;
  const l = letter.getContext("2d");
  l.textAlign = "center"; l.textBaseline = "middle"; l.fillStyle = "rgba(38,24,14,.9)";
  let s = 150; do { l.font = `${s}px ${family}`; s -= 6; } while (l.measureText(event.names).width > 1120 && s > 40);
  l.fillText(event.names, 600, 104);
  return { card, letter };
}

export function StoryStage({ event, guest, opened, onOpen, onReplay, onAnswer, lang = "en", preview = false }) {
  const c = filmWords[lang] || filmWords.en;
  const font = ensureFont(event.font && event.font !== "classic" ? event.font : "vibes");
  const video = useRef(null), canvas = useRef(null), engine = useRef(null), slot = useRef(null), present = useRef(null);
  const timers = useRef([]);
  const [phase, setPhase] = useState("idle"); // idle → playing → present → ask
  const [gl, setGl] = useState(true);
  const [flip, setFlip] = useState(null);
  const names = event.names.split(/\s*&\s*/);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // the renderer and its layers: photos (toned like portraits) and the couple's words
  useEffect(() => {
    let dead = false;
    try { engine.current = createStoryRenderer(canvas.current, video.current, STORY); } catch { setGl(false); return; }
    return () => { dead = true; engine.current?.destroy(); engine.current = null; clear(); void dead; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const own = [event.photo, event.photo2, event.photo3, event.photo4].map((p) => (okPhoto(p) ? p : null));
  const photoKey = own.map((p) => (p ? p.length : 0)).join();
  useEffect(() => {
    let dead = false;
    const e = engine.current; if (!e) return;
    [1, 2, 3, 4].forEach(async (n) => {
      // a missing photo borrows another one; with none, the sample keeps the film's own mirrors
      const order = [[0, 2, 1, 3], [1, 3, 0, 2], [2, 0, 3, 1], [3, 1, 2, 0]][n - 1];
      const src = order.map((i) => own[i]).find(Boolean);
      const toned = src ? coverCrop(await tonePhoto(src), MIRROR_ASPECT) : null;
      if (!dead) e.setLayer("p" + n, toned);
    });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey, gl]);
  const wordsKey = [event.names, event.date, event.time, event.venue, event.address, lang, font.family].join("|");
  useEffect(() => {
    let dead = false;
    drawWords(event, lang, font.family).then(({ card, letter }) => {
      if (dead || !engine.current) return;
      engine.current.setLayer("tcard", card); engine.current.setLayer("tletter", letter);
    });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordsKey, gl]);

  function afterFilm() {
    engine.current?.stop();
    setPhase("present");
  }
  useEffect(() => {
    const v = video.current;
    if (!opened) { clear(); setPhase("idle"); setFlip(null); engine.current?.stop(); if (v) { v.pause(); try { v.currentTime = 0; } catch { /* not loaded yet */ } } return; }
    if (phase !== "idle") return;
    if (reduced || !v) { setPhase("present"); return; }
    setPhase("playing");
    engine.current?.start();
    const p = v.play();
    if (p && p.catch) p.catch(() => afterFilm());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  // the card standing in the film glides to the centre and becomes the couple's card
  useLayoutEffect(() => {
    if (phase !== "present") return;
    const from = slot.current?.getBoundingClientRect(), to = present.current?.getBoundingClientRect();
    if (!from || !to || !to.width || reduced) { setPhase("ask"); return; }
    setFlip({ x: from.left + from.width / 2 - (to.left + to.width / 2), y: from.top + from.height / 2 - (to.top + to.height / 2), s: from.width / to.width, o: 0 });
    requestAnimationFrame(() => requestAnimationFrame(() => setFlip(null)));
    later(1300, () => setPhase("ask"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const shown = phase === "present" || phase === "ask";
  return (
    <section className={`film-stage story-stage film-is-${phase}`} aria-label="Once Upon a Castle invitation">
      <div className="film-backdrop" style={{ backgroundImage: `url(${FILM.end})` }} aria-hidden="true" />
      <div className="film-frame story-frame">
        <video ref={video} className="story-video" poster={FILM.poster} muted playsInline preload="auto" onEnded={afterFilm} aria-hidden="true">
          <source src={FILM.src} type="video/mp4" />
          <source src={FILM.webm} type="video/webm" />
        </video>
        <img className="story-still" src={phase === "idle" ? FILM.poster : FILM.end} alt="" aria-hidden="true" style={{ opacity: phase === "playing" ? 0 : 1 }} />
        {gl && <canvas ref={canvas} className="film-canvas" aria-hidden="true" style={{ opacity: phase === "idle" ? 0 : 1 }} />}
        <div ref={slot} className="story-end-card" aria-hidden="true" style={{ left: END_CARD.left + "%", top: END_CARD.top + "%", width: END_CARD.width + "%" }} />
      </div>
      {phase !== "idle" && phase !== "playing" && <div className="film-petals" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${11 + (i % 5) * 2}s` }} />)}</div>}

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
        <div className="film-welcome story-welcome">
          <div className="film-welcome-top">
            <span>{guest?.name ? `${guest.name.toUpperCase()},` : ""} {c.invited}</span>
            <h1 style={{ fontFamily: font.family }}>{names.map((n, i) => <React.Fragment key={i}>{i > 0 && <em>&amp;</em>}<span>{n}</span></React.Fragment>)}</h1>
          </div>
          <button className="film-open" onClick={onOpen} aria-label={c.open || c.touch}>
            <span className="film-open-seal">{names.map((n) => n.trim()[0]).join("")}</span>
            <span className="film-open-text">{{ en: "Touch to begin the story", de: "Berühren, um die Geschichte zu beginnen", fr: "Touchez pour commencer l’histoire" }[lang] || "Touch to begin the story"}</span>
          </button>
        </div>
      )}
      {phase === "ask" && <button className="film-replay" aria-label={c.replay} title={c.replay} onClick={onReplay}><RotateCcw size={15} /></button>}
    </section>
  );
}
