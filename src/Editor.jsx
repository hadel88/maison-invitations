import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Edit3,
  Eye,
  Loader2,
  MapPin,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";
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
const STEPS = [
  ["design", "Design"],
  ["details", "Details"],
  ["guests", "Guest page"],
  ["package", "Package"],
];
const ZONES = [
  "Europe/Berlin", "Europe/Paris", "Europe/London", "Europe/Rome",
  "Europe/Amsterdam", "Europe/Madrid", "Europe/Lisbon", "Europe/Zurich",
  "Europe/Vienna", "Europe/Stockholm", "Europe/Athens", "Europe/Helsinki",
  "Europe/Warsaw", "Europe/Prague", "Europe/Dublin",
];

export default function Editor({ record, user, onClose, onSave, onPreview }) {
  const [event, setEvent] = useState(withPackage(record));
  const [step, setStep] = useState(
    STEPS.findIndex(([id]) => id === (record.step || "details")),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);
  const update = (k, v) => setEvent((e) => ({ ...e, [k]: v }));
  useEffect(() => {
    setEvent(withPackage(record));
  }, [record.id]);
  useEffect(() => {
    try {
      localStorage.setItem("maison-draft", JSON.stringify(event));
    } catch {}
  }, [event]);
  const last = step === STEPS.length - 1;
  function check() {
    if (!event.names?.trim()) return "Please add names or a title (step 2).";
    if (!event.date || !event.time) return "Please add the date and time (step 2).";
    if (!event.rsvpDeadline) return "Please set an RSVP date (step 3).";
    if (event.rsvpDeadline > event.date)
      return "The RSVP date should be before the celebration (step 3).";
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
        <label className="field">
          Opening music
          <select
            value={event.music}
            onChange={(e) => update("music", e.target.value)}
          >
            <option value="soft">Soft piano</option>
            <option value="celestial">Celestial chimes</option>
            <option value="none">No music</option>
          </select>
          <small>Plays only after your guest opens the envelope.</small>
        </label>
        <label className="field">
          Colour mood of the details page
          <select
            value={event.worldTheme || "midnight"}
            onChange={(e) => update("worldTheme", e.target.value)}
          >
            {worldThemes.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Your photo (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => photo(e.target.files[0])}
          />
          <small>JPG, PNG or WebP, resized automatically.</small>
        </label>
        {event.photo && (
          <button className="text-link" onClick={() => update("photo", "")}>
            Remove photo <X size={14} />
          </button>
        )}
        <div className="small-note">
          <ShieldCheck size={19} />
          <span>Guests don’t need an account. Their replies are visible only to you.</span>
        </div>
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
  }[STEPS[step][0]];

  return (
    <Modal className="editor-modal" onClose={onClose}>
      <div className="editor-top">
        <button className="text-link" onClick={onClose}>
          <ArrowLeft size={16} />
          <span>Close studio</span>
        </button>
        <ol className="st-steps" aria-label="Steps">
          {STEPS.map(([id, label], i) => (
            <li key={id}>
              <button
                className={(i === step ? "current " : "") + (i < step ? "past" : "")}
                aria-current={i === step ? "step" : undefined}
                onClick={() => setStep(i)}
              >
                <span>{i < step ? <Check size={12} /> : i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
        <button
          className="btn secondary"
          disabled={saving}
          onClick={() => save(false)}
        >
          {saving ? <Loader2 className="spin" size={14} /> : <Check size={14} />}
          {record.published ? "Save" : "Save draft"}
        </button>
      </div>
      <div className="editor-layout">
        <aside className={mobilePreview ? "hide-mobile" : ""}>
          <div className="editor-intro">
            <span className="eyebrow">
              STEP {step + 1} OF {STEPS.length}
            </span>
            <h2>
              {["Choose your", "Tell your", "Shape the", "Pick your"][step]}{" "}
              <em>{["design.", "story.", "guest page.", "package."][step]}</em>
            </h2>
          </div>
          <div className="editor-fields">
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {panel}
            {!user && (
              <div className="small-note">
                Explore freely. You’ll sign in when you save or publish.
              </div>
            )}
          </div>
          <div className="st-nav">
            {step > 0 ? (
              <button className="btn secondary" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <span />
            )}
            {last ? (
              <button
                className="btn primary"
                disabled={saving}
                onClick={() => save(true)}
              >
                {record.published ? "Save & share" : "Publish & share"}
                <ArrowRight size={15} />
              </button>
            ) : (
              <button className="btn primary" onClick={() => setStep(step + 1)}>
                Next: {STEPS[step + 1][1]}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </aside>
        <div
          className={
            "editor-preview " + (!mobilePreview ? "hide-mobile-preview" : "")
          }
        >
          <div className="preview-topline">
            <span>
              <span className="live-dot" /> LIVE PREVIEW
            </span>
            <button className="text-link" onClick={() => onPreview(event)}>
              <Play size={13} />
              Open the envelope
            </button>
          </div>
          <div className="preview-paper">
            <div className="cinema-editor-cover">
              <img src={small(scene.cover)} alt="Your invitation" />
              <div>
                <h3>{event.names}</h3>
                <p>{event.subtitle}</p>
                <small>{dateLabel(event.date, event.language)}</small>
              </div>
              <button onClick={() => onPreview(event)}>Open it full-screen ↗</button>
            </div>
            <div className="preview-event">
              <p>{event.message}</p>
              <span>
                <CalendarDays size={15} />
                {dateLabel(event.date, event.language)} · {event.time}
              </span>
              <span>
                <MapPin size={15} />
                {event.venue}, {event.address}
              </span>
            </div>
          </div>
          <p className="preview-caption">
            {scene.name} <span>·</span>{" "}
            {PACKAGES.find((p) => p.id === event.package)?.name || "Invitation"}
          </p>
        </div>
      </div>
      <button
        className="mobile-preview-toggle btn primary"
        onClick={() => setMobilePreview(!mobilePreview)}
      >
        {mobilePreview ? <Edit3 size={15} /> : <Eye size={15} />}{" "}
        {mobilePreview ? "Back to editing" : "See your preview"}
      </button>
    </Modal>
  );
}
