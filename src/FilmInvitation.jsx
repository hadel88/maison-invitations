import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Heart, RotateCcw } from "lucide-react";
import { dateLabel } from "./catalog";
import { ensureFont } from "./fonts";
import "./film.css";

// "The Castle Gates": a cinematic film invitation.
// The film (castle gates opening, the ballroom, an envelope rising on a crystal pedestal) plays once.
// Then everything becomes the couple's own: their photos float past in gold frames, and their card
// rises out of the envelope in the film. The guest answers yes or no right there.
// The envelope geometry below is measured on the film's last frame (720 × 1280).

const words = {
  en: { invited: "YOU ARE INVITED", touch: "Touch to open the gates", families: "TOGETHER WITH THEIR FAMILIES", ask: "Will you celebrate with us?", yes: "Joyfully, yes", no: "Sadly, no", more: "All the details", replay: "Watch again", photo: "Your photo" },
  de: { invited: "DU BIST EINGELADEN", touch: "Berühren, um die Tore zu öffnen", families: "GEMEINSAM MIT IHREN FAMILIEN", ask: "Feierst du mit uns?", yes: "Ja, sehr gern", no: "Leider nein", more: "Alle Details", replay: "Noch einmal ansehen", photo: "Dein Foto" },
  fr: { invited: "VOUS ÊTES INVITÉ", touch: "Touchez pour ouvrir les grilles", families: "ENTOURÉS DE LEURS FAMILLES", ask: "Célébrerez-vous avec nous ?", yes: "Avec joie, oui", no: "Hélas, non", more: "Tous les détails", replay: "Revoir", photo: "Votre photo" },
};

const FILM = { src: "/castle-film.mp4", webm: "/castle-film.webm", poster: "/castle-film-cover.webp", end: "/castle-film-end.webp", pocket: "/castle-pocket.webp" };

function CardFace({ event, lang, c, font }) {
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
  const c = words[lang] || words.en;
  const font = ensureFont(event.font && event.font !== "classic" ? event.font : "vibes");
  const stage = useRef(null), video = useRef(null), slotCard = useRef(null), present = useRef(null);
  const timers = useRef([]);
  const [phase, setPhase] = useState("idle"); // idle → playing → photos → rise → present → ask
  const [flip, setFlip] = useState(null);
  const own = [event.photo, event.photo2].filter((p) => typeof p === "string" && p.startsWith("data:image/"));
  const photos = own.length ? own : preview ? [null, null] : [];
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const names = event.names.split(/\s*&\s*/);

  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  // after the film: photos (if any), then the card rises out of the envelope
  function afterFilm() {
    if (reduced) { setPhase("ask"); return; }
    if (photos.length) { setPhase("photos"); later(4300, rise); } else rise();
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
        <img className="film-end" src={FILM.end} alt="" aria-hidden="true" style={{ opacity: ended ? 1 : 0 }} />
        <div className="film-slot" aria-hidden="true">
          <div ref={slotCard} className="film-card film-card-small" style={{ visibility: shown ? "hidden" : "visible" }}>
            <CardFace event={event} lang={lang} c={c} font={font} />
          </div>
        </div>
        <img className="film-pocket" src={FILM.pocket} alt="" aria-hidden="true" />
      </div>
      {ended && <div className="film-petals" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${-i * 1.7}s`, animationDuration: `${11 + (i % 5) * 2}s` }} />)}</div>}

      {photos.length > 0 && (
        <div className={`film-photos film-photos-${photos.length}`} aria-hidden={phase !== "photos"}>
          {photos.map((src, i) => (
            <figure key={i} className={`film-gold film-gold-${i}`}>
              <div className="film-gold-inner">{src ? <img src={src} alt={names[i] ? names[i] : ""} /> : <span>{c.photo}</span>}</div>
            </figure>
          ))}
        </div>
      )}

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
