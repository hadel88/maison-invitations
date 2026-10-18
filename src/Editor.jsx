import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  MapPin,
  Music2,
  Package as PackageIcon,
  Palette,
  Play,
  ShieldCheck,
  Type,
  Users,
  X,
} from "lucide-react";
import { FONTS, fontFor, ensureAllFonts } from "./fonts";
import { dateLabel } from "./catalog";
import { Modal, Field } from "./ui";
import { PACKAGES } from "./packages";

// New invitations start as "invitation"; older ones keep the package they effectively had.
const withPackage = (record) => ({
  ...record.content,
  package: record.content.package || (record.id ? "journey" : "invitation"),
});
import { cinemaThemes, sceneFor } from "./cinemaThemes";
import { worldThemes, eventWorlds, occasionFor } from "./worlds";
import { templates } from "./catalog";

// The studio is one clear path: design → details → guest page → package → publish.
const small = (name) => "/" + name + "-sm.webp";
// The studio: tools on the left, the card in the middle, quick touches on the right.
const TOOLS = [
  ["design", "Designs", LayoutTemplate],
  ["details", "Text", Type],
  ["photo", "Photos", ImageIcon],
  ["music", "Music", Music2],
  ["background", "Backgrounds", Palette],
  ["guests", "Guest page", Users],
  ["package", "Package", PackageIcon],
];
const MUSIC = [["soft", "Soft piano"], ["celestial", "Celestial chimes"], ["none", "No music"]];
const ZONES = [
  "Europe/Berlin", "Europe/Paris", "Europe/London", "Europe/Rome",
  "Europe/Amsterdam", "Europe/Madrid", "Europe/Lisbon", "Europe/Zurich",
  "Europe/Vienna", "Europe/Stockholm", "Europe/Athens", "Europe/Helsinki",
  "Europe/Warsaw", "Europe/Prague", "Europe/Dublin",
];

export default function Editor({ record, user, onClose, onSave, onPreview }) {
  const [event, setEvent] = useState(withPackage(record));
  const [tool, setTool] = useState(TOOLS.some(([id]) => id === record.step) ? record.step : "details");
  useEffect(() => { ensureAllFonts(); }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (k, v) => setEvent((e) => ({ ...e, [k]: v }));
  useEffect(() => {
    setEvent(withPackage(record));
  }, [record.id]);
  useEffect(() => {
    try {
      localStorage.setItem("maison-draft", JSON.stringify(event));
    } catch {}
  }, [event]);
  function check() {
    if (!event.names?.trim()) { setTool("details"); return "Please add names or a title (Text)."; }
    if (!event.date || !event.time) { setTool("details"); return "Please add the date and time (Text)."; }
    if (!event.rsvpDeadline) { setTool("guests"); return "Please set a reply date (Guest page)."; }
    if (event.rsvpDeadline > event.date) { setTool("guests"); return "The reply date should be before the celebration (Guest page)."; }
    return "";
  }
  async function save(publish) {
    const problem = publish ? check() : "";
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(
        { ...record, content: event },
        publish || !!record.published,
        publish,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function photo(file) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8000000
    ) {
      setError("Choose a JPG, PNG or WebP photo under 8 MB.");
      return;
    }
    const image = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1100 / image.width);
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    update("photo", canvas.toDataURL("image/jpeg", 0.72));
    image.close();
  }
  const scene = sceneFor(event);
  const choose = (x) =>
    setEvent((e) => ({
      ...e,
      scene: x.id,
      occasion: x.occasion,
      // keep the host's own words; only swap the sample text of the old design
      names: e.names === scene.names ? x.names : e.names,
      subtitle: e.subtitle === scene.line ? x.line : e.subtitle,
    }));

  const panel = {
    design: (
      <>
        <p className="st-lead">
          Choose the invitation your guests will open. Your words and details
          stay when you switch.
        </p>
        <div className="cinema-scene-picker st-scenes">
          {cinemaThemes.map((x) => (
            <button
              key={x.id}
              aria-pressed={scene.id === x.id}
              className={scene.id === x.id ? "selected" : ""}
              onClick={() => choose(x)}
            >
              <img src={small(x.cover)} alt="" loading="lazy" width="300" height="533" />
              <span>{x.name}</span>
            </button>
          ))}
        </div>
      </>
    ),
    details: (
      <>
        <label className="field">
          What are you celebrating?
          <select
            value={event.occasion || occasionFor({ content: event }, templates)}
            onChange={(e) => update("occasion", e.target.value)}
          >
            {eventWorlds.map((w) => (
              <option key={w.occasion}>{w.occasion}</option>
            ))}
          </select>
          <small>Your journey checklist follows this occasion (Invitation & Journey).</small>
        </label>
        <Field
          label="Names or celebration title"
          value={event.names}
          onChange={(v) => update("names", v)}
          maxLength={160}
          required
        />
        <Field
          label="A short line under the names"
          value={event.subtitle}
          onChange={(v) => update("subtitle", v)}
          maxLength={180}
        />
        <div className="field-row">
          <Field
            label="Date"
            type="date"
            value={event.date}
            onChange={(v) => update("date", v)}
          />
          <Field
            label="Time"
            type="time"
            value={event.time}
            onChange={(v) => update("time", v)}
          />
        </div>
        <label className="field">
          Time zone
          <select
            value={event.timezone}
            onChange={(e) => update("timezone", e.target.value)}
          >
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </label>
        <Field
          label="Venue"
          value={event.venue}
          onChange={(v) => update("venue", v)}
          maxLength={180}
        />
        <Field
          label="Address"
          value={event.address}
          onChange={(v) => update("address", v)}
          maxLength={300}
        />
        <label className="field">
          A note to your guests
          <textarea
            value={event.message}
            maxLength={2000}
            onChange={(e) => update("message", e.target.value)}
            rows={3}
          />
        </label>
      </>
    ),
    guests: (
      <>
        <p className="st-lead">What your guests see after they open the envelope.</p>
        <div className="field-row">
          <Field
            label="Reply by"
            type="date"
            value={event.rsvpDeadline}
            onChange={(v) => update("rsvpDeadline", v)}
          />
          <label className="field">
            Language
            <select
              value={event.language}
              onChange={(e) => update("language", e.target.value)}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </select>
          </label>
        </div>
        <Field
          label="Dress code (optional)"
          value={event.dressCode}
          onChange={(v) => update("dressCode", v)}
          maxLength={120}
        />
        <div className="small-note">
          <ShieldCheck size={19} />
          <span>Guests don’t need an account. Their replies are visible only to you.</span>
        </div>
      </>
    ),
    music: (
      <>
        <p className="st-lead">Music starts softly after your guest opens the envelope.</p>
        <div className="st-choice-list">
          {MUSIC.map(([id, label]) => (
            <button key={id} className={(event.music || "soft") === id ? "selected" : ""} onClick={() => update("music", id)}>
              <Music2 size={15} /> {label} {(event.music || "soft") === id && <Check size={14} />}
            </button>
          ))}
        </div>
      </>
    ),
    background: (
      <>
        <p className="st-lead">The colour world of the details page your guests see after opening, and of your dashboard.</p>
        <div className="st-worlds">
          {worldThemes.map((w) => (
            <button key={w.id} className={(event.worldTheme || "midnight") === w.id ? "selected" : ""} onClick={() => update("worldTheme", w.id)}>
              <span style={{ backgroundImage: `url(${w.image})` }} />
              <strong>{w.name}</strong>
              <small>{w.subtitle}</small>
            </button>
          ))}
        </div>
      </>
    ),
    photo: (
      <>
        <p className="st-lead">A photo of you, shown on the details page of your invitation.</p>
        {event.photo && <img className="st-photo" src={event.photo} alt="Your photo" />}
        <label className="field">
          {event.photo ? "Choose another photo" : "Your photo (optional)"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => photo(e.target.files[0])} />
          <small>JPG, PNG or WebP, resized automatically.</small>
        </label>
        {event.photo && (
          <button className="text-link" onClick={() => update("photo", "")}>
            Remove photo <X size={14} />
          </button>
        )}
      </>
    ),
    package: (
      <>
        <p className="st-lead">
          Choose how you want to send and plan. You can change this later in
          your dashboard.
        </p>
        <div className="st-packages" role="radiogroup" aria-label="Package">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={event.package === p.id}
              disabled={p.soon}
              className={
                "st-package" +
                (event.package === p.id ? " selected" : "") +
                (p.soon ? " soon" : "")
              }
              onClick={() => update("package", p.id)}
            >
              <span className="st-package-top">
                <strong>{p.name}</strong>
                <em>{p.soon ? "Coming soon" : "€" + p.price}</em>
              </span>
              <span className="st-package-line">{p.tagline}</span>
              <span className="st-package-list">
                {p.features.map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
        <div className="small-note">
          <span>
            Free during the preview: checkout is not connected yet, so no
            payment is taken.
          </span>
        </div>
      </>
    ),
  }[tool];

  const font = fontFor(event.font);
  const label = TOOLS.find(([id]) => id === tool)?.[1];
  return (
    <Modal className="editor-modal st-studio" onClose={onClose}>
      <div className="editor-top">
        <button className="text-link" onClick={onClose}>
          <ArrowLeft size={16} />
          <span>Close studio</span>
        </button>
        <div className="st-title">
          <strong>Personalise & create</strong>
          <span>Make it uniquely yours.</span>
        </div>
        <div className="st-top-actions">
          <button className="btn secondary" disabled={saving} onClick={() => save(false)}>
            {saving ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
            {record.published ? "Save" : "Save draft"}
          </button>
          <button className="btn primary" disabled={saving} onClick={() => save(true)}>
            {record.published ? "Save & share" : "Publish & share"}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div className="st-layout">
        <nav className="st-tools" aria-label="Studio tools">
          {TOOLS.map(([id, name, Icon]) => (
            <button key={id} className={tool === id ? "selected" : ""} aria-pressed={tool === id} onClick={() => setTool(id)}>
              <span><Icon size={17} strokeWidth={1.5} /></span>
              {name}
            </button>
          ))}
        </nav>
        <section className="st-panel" aria-label={label}>
          <h2>{label}</h2>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {panel}
          {!user && <div className="small-note">Explore freely. You’ll sign in when you save or publish.</div>}
        </section>
        <div className="st-stage">
          <div className={"st-card" + (scene.kind === "birthday" ? " st-card-birthday" : "")} style={{ backgroundImage: `url(${small(scene.cover)})` }}>
            <div className="st-card-text" style={{ fontFamily: font.family }}>
              <span className="st-card-over">You’re invited</span>
              <h3>{event.names}</h3>
              {event.subtitle && <p>{event.subtitle}</p>}
              <small>{dateLabel(event.date, event.language)} · {event.time}</small>
              {event.venue && <em>{event.venue}</em>}
            </div>
          </div>
          <div className="st-card-designs" aria-label="Choose the design">
            {cinemaThemes.map((x) => (
              <button key={x.id} className={scene.id === x.id ? "selected" : ""} aria-pressed={scene.id === x.id} onClick={() => choose(x)} title={x.name}>
                <img src={small(x.cover)} alt={x.name} loading="lazy" />
              </button>
            ))}
          </div>
          <button className="text-link st-open" onClick={() => onPreview(event)}>
            <Play size={13} /> Open the envelope
          </button>
          <p className="preview-caption">
            {scene.name} <span>·</span> {PACKAGES.find((p) => p.id === event.package)?.name || "Invitation"}
          </p>
        </div>
        <aside className="st-touch" aria-label="Add your touch">
          <h3>Add your touch</h3>
          <div className="st-touch-designs">
            {cinemaThemes.map((x) => (
              <button key={x.id} className={scene.id === x.id ? "selected" : ""} onClick={() => choose(x)} aria-label={x.name}>
                <img src={small(x.cover)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
          <h3>Fonts</h3>
          <div className="st-fonts">
            {FONTS.map((f) => (
              <button
                key={f.id}
                className={font.id === f.id ? "selected" : ""}
                style={{ fontFamily: f.family }}
                onClick={() => update("font", f.id)}
                aria-label={f.name + " font"}
                title={f.name}
              >
                A
              </button>
            ))}
          </div>
          <h3>Add music</h3>
          <select className="st-music" value={event.music || "soft"} onChange={(e) => update("music", e.target.value)} aria-label="Music">
            {MUSIC.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <h3>Colour world</h3>
          <div className="st-swatches">
            {worldThemes.map((w) => (
              <button key={w.id} className={(event.worldTheme || "midnight") === w.id ? "selected" : ""} style={{ background: w.color }} onClick={() => update("worldTheme", w.id)} aria-label={w.name} title={w.name} />
            ))}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
