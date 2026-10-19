import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Check,
  Heart,
  Play,
  Search,
  X,
  Globe,
  Mail,
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  MapPin,
  CalendarDays,
  Clock,
  Plus,
  Copy,
  Download,
  Users,
  Eye,
  Edit3,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Leaf,
  CheckCircle2,
  Settings2,
  ExternalLink,
  Menu,
  Loader2,
} from "lucide-react";
import { copy, dateLabel, defaultEvent, templates } from "./catalog";
import { api, download, calendar } from "./client";
import { Field } from "./ui";
import { CinemaStage } from "./Cinema";
import { CraftWelcome, CraftGarland, craftWords } from "./CraftInvitation";
import { eventPhase, responseNote } from './guestPlanning';

function useSound(music, active) {
  const [muted, setMuted] = useState(false);
  const audio = useRef(null);
  useEffect(() => {
    if (!active || music === "none" || muted) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    const ctx = new Context();
    audio.current = ctx;
    let index = 0;
    const notes =
      music === "celestial"
        ? [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25]
        : [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
    function play() {
      const oscillator = ctx.createOscillator(),
        gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = notes[index++ % notes.length];
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 2);
    }
    play();
    const timer = setInterval(play, 650);
    return () => {
      clearInterval(timer);
      ctx.close();
      audio.current = null;
    };
  }, [music, active, muted]);
  return [muted, () => setMuted((v) => !v)];
}
export function GuestExperience({
  event,
  guest,
  slug,
  token,
  preview = false,
  onEdit,
}) {
  const [opened, setOpened] = useState(false);

  useEffect(()=>{document.documentElement.dataset.world=event.worldTheme||"midnight"},[event.worldTheme]);
  const [lang, setLang] = useState(event.language || "en");
  const c = copy[lang];
  const crafted = event.scene === 'embroidered-chateau';
  const [muted, toggleSound] = useSound(event.music, opened);
  const [name, setName] = useState(guest?.name || "");
  const [response, setResponse] = useState(
    guest?.response === "no" ? "no" : "yes",
  );
  const [party, setParty] = useState(guest?.party_size || 1);
  const [note, setNote] = useState("");
  const [meal,setMeal]=useState(''),[allergies,setAllergies]=useState('');
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharedAccess, setSharedAccess] = useState(false);
  useEffect(()=>{
    if(!slug||!token||preview)return;
    let live=true;
    api('shared-dashboard',{query:{slug,guest:token}}).then(()=>{if(live)setSharedAccess(true)}).catch(()=>{if(live)setSharedAccess(false)});
    return()=>{live=false};
  },[slug,token,preview]);
  const [rsvpToken] = useState(
    () =>
      token ||
      localStorage.getItem("maison-rsvp-" + slug) ||
      crypto.randomUUID(),
  );
  async function respond(e) {
    e.preventDefault();
    if (preview) {
      setSaved(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("rsvp", {
        method: "POST",
        data: {
          slug,
          token: rsvpToken,
          name,
          response,
          partySize: party,
          note: responseNote({note,meal,allergies,attending:response==='yes'}),
          website,
        },
      });
      localStorage.setItem("maison-rsvp-" + slug, rsvpToken);
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="invitation-screen"><div className={"guest-experience cinema-guest " + (crafted ? "cinema-craft " : ["castle-gates","castle-story","pearl-promise","little-wonder"].includes(event.scene) ? "cinema-film " : event.scene === "birthday-wish" ? "cinema-birthday " : ["graduation-flight","graduation-curtain"].includes(event.scene) ? "cinema-birthday cinema-graduation " : "") + (opened ? "is-open" : "")}>
      <div className="guest-controls">
        <a href="/" className="brand">
          maison
        </a>
        <div>
          <select
            aria-label="Invitation language"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="fr">FR</option>
          </select>
          {opened && event.music !== "none" && (
            <button
              className="icon-btn"
              aria-label={muted ? "Play music" : "Mute music"}
              onClick={toggleSound}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}
        </div>
      </div>
      {preview && (
        <span className="preview-banner">
          DESIGN PREVIEW · Responses here are a demonstration
        </span>
      )}
      <CinemaStage event={event} guest={guest} opened={opened} onOpen={()=>setOpened(true)} onReplay={()=>setOpened(false)} onAnswer={(r)=>{if(r){setResponse(r);setSaved(false);}setTimeout(()=>document.querySelector('.cinema-detail-sheet .rsvp')?.scrollIntoView({behavior:'smooth',block:'start'}),60)}} lang={lang} preview={preview}/>
      {opened && (
        <div className="cinema-detail-sheet" aria-label="Invitation details and RSVP">
        <div className="opened-invite">
          <div className="guest-phase-message">{{en:{before:'The lovely anticipation begins.',today:'Today is the day. We are so happy you are here.',after:'Thank you for being part of our story.'},de:{before:'Die Vorfreude beginnt.',today:'Heute ist der große Tag. Schön, dass du da bist.',after:'Danke, dass du Teil unserer Geschichte bist.'},fr:{before:'Le bonheur de se retrouver approche.',today:'Le grand jour est arrivé. Quel bonheur de vous retrouver.',after:'Merci de faire partie de notre histoire.'}}[lang]?.[eventPhase(event)]}</div>
          {crafted ? <CraftWelcome event={event} lang={lang} /> : <p className="guest-message">{event.message}</p>}
          <section className="event-details">
            <span className="eyebrow">{c.details}</span>
            <h2>{crafted ? craftWords(lang).details : ['birthday-wish','graduation-flight','graduation-curtain'].includes(event.scene) ? ({en:'Let’s celebrate.',de:'Wir feiern!',fr:'Célébrons ensemble.'}[lang] || 'Let’s celebrate.') : 'A day to remember.'}</h2>
            <div>
              <CalendarDays />
              <span>
                <strong>
                  {dateLabel(event.date, lang, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                {event.time} · {event.timezone.replace("Europe/", "")}
              </span>
            </div>
            <div>
              <MapPin />
              <span>
                <strong>{event.venue}</strong>
                {event.address}
              </span>
            </div>
            {event.dressCode && !crafted && (
              <div>
                <Sparkles />
                <span>
                  <strong>{c.dress}</strong>
                  {event.dressCode}
                </span>
              </div>
            )}
            <div className="guest-links">
              <button
                className="btn secondary"
                onClick={() =>
                  download("invitation.ics", calendar(event), "text/calendar")
                }
              >
                {c.savedate}
                <Download size={14} />
              </button>
              <a
                className="btn secondary"
                href={
                  "https://www.google.com/maps/search/?api=1&query=" +
                  encodeURIComponent(event.venue + " " + event.address)
                }
                target="_blank"
                rel="noreferrer"
              >
                {c.venue}
                <ArrowUpRight size={14} />
              </a>
              <a className="btn secondary" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('parking near '+event.venue+' '+event.address)} target="_blank" rel="noreferrer">{{en:'Parking nearby',de:'Parken in der Nähe',fr:'Stationnement à proximité'}[lang]}<ArrowUpRight size={14}/></a>
              <a className="btn secondary" href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('hotels near '+event.venue+' '+event.address)} target="_blank" rel="noreferrer">{{en:'Places to stay',de:'Unterkünfte',fr:'Où séjourner'}[lang]}<ArrowUpRight size={14}/></a>
            </div>
          </section>
          {crafted && event.dressCode && <section className="craft-dress"><CraftGarland /><span className="craft-eyebrow">{craftWords(lang).attire}</span><h2>{craftWords(lang).dress}</h2><p>{event.dressCode}</p></section>}
          {Array.isArray(event.timeline) && event.timeline.length > 0 && (
            <section className="event-details guest-timeline">
              <span className="eyebrow">{{ en: "THE PROGRAMME", de: "DER ABLAUF", fr: "LE PROGRAMME" }[lang] || "THE PROGRAMME"}</span>
              {crafted && <h2>{{en:'The order of our day',de:'Unser gemeinsamer Tag',fr:'Le fil de notre journée'}[lang] || 'The order of our day'}</h2>}
              <ol>
                {event.timeline.map((t, i) => (
                  <li key={i}>
                    <time>{t.time}</time>
                    <span>
                      <strong>{t.title}</strong>
                      {t.note && <small>{t.note}</small>}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {Array.isArray(event.gifts) && event.gifts.length > 0 && (
            <section className="event-details guest-gifts">
              <span className="eyebrow">{{ en: "GIFT WISHES", de: "WUNSCHLISTE", fr: "LISTE DE SOUHAITS" }[lang] || "GIFT WISHES"}</span>
              {crafted && <h2>{craftWords(lang).gifts}</h2>}
              <ul>
                {event.gifts.map((g, i) => (
                  <li key={i}>
                    <span>
                      <strong>{g.title}</strong>
                      {g.note && <small>{g.note}</small>}
                    </span>
                    {/^https?:\/\//i.test(g.link || "") && (
                      <a className="text-link" href={g.link} target="_blank" rel="noopener noreferrer">
                        {{ en: "View", de: "Ansehen", fr: "Voir" }[lang] || "View"} <ArrowUpRight size={13} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="rsvp">
            <span className="eyebrow">WE SAVED YOU A PLACE</span>
            <h2>{c.rsvp}</h2>
            <p>{dateLabel(event.rsvpDeadline, lang)}</p>
            {saved ? (
              <div className="response-saved" role="status">
                <CheckCircle2 size={35} />
                <h3>{c.thankyou}</h3>
                <p>
                  {preview
                    ? "This is a preview response. Publish your invitation to collect real RSVPs."
                    : response === "yes"
                      ? "We can’t wait to celebrate with you."
                      : "Your host has received your reply."}
                </p>
                <button className="text-link" onClick={() => setSaved(false)}>
                  Edit response
                  <Edit3 size={14} />
                </button>
              </div>
            ) : (
              <form onSubmit={respond}>
                <Field
                  label={c.name}
                  value={name}
                  onChange={setName}
                  required
                  maxLength={120}
                />
                <div className="response-choice">
                  <button
                    type="button"
                    className={response === "yes" ? "selected" : ""}
                    onClick={() => setResponse("yes")}
                  >
                    <Heart size={16} />
                    {c.yes}
                  </button>
                  <button
                    type="button"
                    className={response === "no" ? "selected" : ""}
                    onClick={() => setResponse("no")}
                  >
                    {c.no}
                  </button>
                </div>
                {response === "yes" && (
                  <label className="field">
                    {lang === "de"
                      ? "Anzahl der Gäste"
                      : lang === "fr"
                        ? "Nombre de personnes"
                        : "Number of guests"}
                    <select
                      value={party}
                      onChange={(e) => setParty(Number(e.target.value))}
                    >
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {response==='yes'&&<div className="guest-dietary"><label className="field">{{en:'Meal preference (optional)',de:'Essenswunsch (optional)',fr:'Préférence de repas (facultatif)'}[lang]}<select value={meal} onChange={e=>setMeal(e.target.value)}><option value="">—</option><option value="Standard">{{en:'Standard',de:'Standard',fr:'Classique'}[lang]}</option><option value="Vegetarian">{{en:'Vegetarian',de:'Vegetarisch',fr:'Végétarien'}[lang]}</option><option value="Vegan">{{en:'Vegan',de:'Vegan',fr:'Végétalien'}[lang]}</option><option value="Other / see note">{{en:'Other · see note',de:'Andere · siehe Nachricht',fr:'Autre · voir le message'}[lang]}</option></select></label><Field label={{en:'Allergies or dietary needs (optional)',de:'Allergien oder Ernährungsbedürfnisse (optional)',fr:'Allergies ou besoins alimentaires (facultatif)'}[lang]} value={allergies} onChange={setAllergies} maxLength={150}/></div>}
                <label className="field">
                  {lang === "de"
                    ? "Nachricht an den Gastgeber (optional)"
                    : lang === "fr"
                      ? "Un mot pour votre hôte (facultatif)"
                      : "A note for your host (optional)"}
                  <textarea
                    rows={3}
                    maxLength={650}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <label className="honey" aria-hidden="true">
                  Website
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
                <label className="consent">
                  <input type="checkbox" required />
                  {lang === "de"
                    ? "Ich stimme zu, dass der Gastgeber meine Antwort zur Veranstaltungsplanung speichert."
                    : lang === "fr"
                      ? "J’accepte que mon hôte conserve ma réponse pour organiser cet événement."
                      : "I agree to share this response with the host for planning this event."}
                </label>
                {error && (
                  <div className="error" role="alert">
                    {error}
                  </div>
                )}
                <button className="btn primary" disabled={busy}>
                  {busy ? <Loader2 className="spin" size={15} /> : null}
                  {c.submit}
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </section>
          {preview && onEdit && (
            <button className="btn primary make-this" onClick={onEdit}>
              Make this invitation yours
              <ArrowUpRight size={15} />
            </button>
          )}
          <div className="guest-signoff">
            {sharedAccess&&<div className="maison-guest-share"><ShieldCheck size={24}/><p>Your host has shared a private celebration space with you.</p><a className="btn secondary" href={'/?shared='+encodeURIComponent(slug)+'&guest='+encodeURIComponent(token)}>Open shared dashboard <ArrowRight size={15}/></a></div>}
            With love, and a little <a href="/">maison</a>
            <small>
              Only essential cookies. Replies are private to your host.
            </small>
          </div>
        </div></div>
      )}
    </div></div>
  );
}
export default function GuestPage({ slug, token, initialLang }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api("open", { query: { slug, ...(token ? { guest: token } : {}) } })
      .then((d) => {
        if (!d)
          throw new Error(
            "This invitation is unavailable or the link has expired.",
          );
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [slug, token]);
  if (error)
    return (
      <div className="page-message">
        <Mail size={35} />
        <h1>A little mix-up.</h1>
        <p>{error}</p>
        <a className="btn primary" href="/">
          Discover Maison
        </a>
      </div>
    );
  if (!data)
    return (
      <div className="page-message">
        <Loader2 className="spin" />
        <p>Preparing something beautiful…</p>
      </div>
    );
  return (
    <GuestExperience
      event={data.content}
      guest={data.guest}
      slug={slug}
      token={token}
    />
  );
}
