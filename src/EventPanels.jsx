import React, { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Clock, Download, Gift, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { worldThemes } from "./worlds";
import { PACKAGES, packageOf } from "./packages";

// Panels of the "Manage your event" dashboard (package Invitation & Journey).
// Everything here edits the invitation itself, so guests see it on their page.

const ZONES = [
  "Europe/Berlin", "Europe/Paris", "Europe/London", "Europe/Rome", "Europe/Amsterdam", "Europe/Madrid",
  "Europe/Lisbon", "Europe/Zurich", "Europe/Vienna", "Europe/Stockholm", "Europe/Athens", "Europe/Helsinki",
  "Europe/Warsaw", "Europe/Prague", "Europe/Dublin",
];

function SaveBar({ busy, dirty, onSave, label = "Save changes" }) {
  return (
    <div className="ev-savebar">
      <button className="lx-btn lx-btn-solid ws-btn" disabled={busy || !dirty} onClick={onSave}>
        {busy ? <Loader2 className="spin" size={14} /> : <Check size={14} />} {label}
      </button>
      {dirty && !busy && <span className="ws-muted">Unsaved changes</span>}
    </div>
  );
}

export function DetailsPanel({ content, onSaveContent }) {
  const pick = (c) => ({
    names: c.names || "", subtitle: c.subtitle || "", date: c.date || "", time: c.time || "",
    timezone: c.timezone || "Europe/Berlin", venue: c.venue || "", address: c.address || "",
    message: c.message || "", rsvpDeadline: c.rsvpDeadline || "", dressCode: c.dressCode || "",
  });
  const [f, setF] = useState(() => pick(content));
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(f) !== JSON.stringify(pick(content));
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function save() {
    setBusy(true);
    try { await onSaveContent(f, "Event details saved. Your guests see them straight away."); } finally { setBusy(false); }
  }
  return (
    <section className="ws-panel ev-panel">
      <h3>Event details</h3>
      <p className="ws-muted">Changes appear on your invitation right after saving.</p>
      <div className="ev-form">
        <label className="field">Names or title<input value={f.names} onChange={set("names")} maxLength={160} /></label>
        <label className="field">Line under the names<input value={f.subtitle} onChange={set("subtitle")} maxLength={180} /></label>
        <div className="ev-two">
          <label className="field">Date<input type="date" value={f.date} onChange={set("date")} /></label>
          <label className="field">Time<input type="time" value={f.time} onChange={set("time")} /></label>
        </div>
        <div className="ev-two">
          <label className="field">Reply by<input type="date" value={f.rsvpDeadline} onChange={set("rsvpDeadline")} /></label>
          <label className="field">Time zone<select value={f.timezone} onChange={set("timezone")}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select></label>
        </div>
        <label className="field">Dress code<input value={f.dressCode} onChange={set("dressCode")} maxLength={120} /></label>
        <label className="field">A note to your guests<textarea rows={4} value={f.message} onChange={set("message")} maxLength={2000} /></label>
      </div>
      <SaveBar busy={busy} dirty={dirty} onSave={save} />
    </section>
  );
}

export function LocationPanel({ content, onSaveContent }) {
  const [venue, setVenue] = useState(content.venue || "");
  const [address, setAddress] = useState(content.address || "");
  const [busy, setBusy] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const dirty = venue !== (content.venue || "") || address !== (content.address || "");
  const query = encodeURIComponent([content.venue, content.address].filter(Boolean).join(", "));
  async function save() {
    setBusy(true);
    try { await onSaveContent({ venue, address }, "Location saved."); setShowMap(false); } finally { setBusy(false); }
  }
  return (
    <section className="ws-panel ev-panel">
      <h3>Location & map</h3>
      <div className="ev-form">
        <label className="field">Venue<input value={venue} onChange={(e) => setVenue(e.target.value)} maxLength={180} /></label>
        <label className="field">Address<input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} /></label>
      </div>
      <SaveBar busy={busy} dirty={dirty} onSave={save} />
      {query && (
        <>
          <div className="ev-map">
            {showMap ? (
              <iframe
                title="Map of the venue"
                src={"https://maps.google.com/maps?q=" + query + "&z=15&output=embed"}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <button className="ev-map-cover" onClick={() => setShowMap(true)}>
                <MapPin size={26} strokeWidth={1.3} />
                <strong>Show the map</strong>
                <small>Loads Google Maps, which may set its own cookies.</small>
              </button>
            )}
          </div>
          <div className="ws-row">
            <a className="lx-link" href={"https://www.google.com/maps/search/?api=1&query=" + query} target="_blank" rel="noopener noreferrer">
              Google Maps <ArrowUpRight size={13} />
            </a>
            <a className="lx-link" href={"https://maps.apple.com/?q=" + query} target="_blank" rel="noopener noreferrer">
              Apple Maps <ArrowUpRight size={13} />
            </a>
          </div>
          <p className="ws-muted">Guests get the same map button on their invitation.</p>
        </>
      )}
    </section>
  );
}

const rid = () => Math.random().toString(36).slice(2, 9);

function ListEditor({ items, setItems, render, blank, max, addLabel }) {
  const move = (i, d) => setItems((v) => { const n = [...v]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); return n; });
  return (
    <>
      <ol className="ev-list">
        {items.map((it, i) => (
          <li key={it._k}>
            <div className="ev-list-fields">{render(it, (k, val) => setItems((v) => v.map((x) => (x._k === it._k ? { ...x, [k]: val } : x))))}</div>
            <div className="ev-list-actions">
              <button className="ws-icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
              <button className="ws-icon" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
              <button className="ws-icon" aria-label="Remove" onClick={() => setItems((v) => v.filter((x) => x._k !== it._k))}><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
      </ol>
      {items.length < max && (
        <button className="lx-link" onClick={() => setItems((v) => [...v, { ...blank(), _k: rid() }])}>
          <Plus size={14} /> {addLabel}
        </button>
      )}
    </>
  );
}

const strip = (list) => list.map(({ _k, ...x }) => x);

export function TimelinePanel({ content, onSaveContent }) {
  const start = () => (content.timeline || []).map((t) => ({ ...t, _k: rid() }));
  const [items, setItems] = useState(start);
  const [busy, setBusy] = useState(false);
  const clean = (v) => strip(v).map((t) => ({ time: t.time, title: (t.title || "").trim(), ...(t.note?.trim() ? { note: t.note.trim() } : {}) })).filter((t) => t.title && t.time);
  const dirty = JSON.stringify(clean(items)) !== JSON.stringify(content.timeline || []);
  async function save() {
    const sorted = clean(items).sort((a, b) => a.time.localeCompare(b.time));
    setBusy(true);
    try { await onSaveContent({ timeline: sorted }, "Programme saved."); setItems(sorted.map((t) => ({ ...t, _k: rid() }))); } finally { setBusy(false); }
  }
  return (
    <section className="ws-panel ev-panel">
      <h3><Clock size={17} /> Timeline</h3>
      <p className="ws-muted">The programme of your day. Guests see it on their invitation, in time order.</p>
      <ListEditor
        items={items}
        setItems={setItems}
        max={30}
        addLabel="Add a moment"
        blank={() => ({ time: content.time || "18:00", title: "", note: "" })}
        render={(t, up) => (
          <>
            <input type="time" aria-label="Time" value={t.time} onChange={(e) => up("time", e.target.value)} />
            <input aria-label="What happens" placeholder="e.g. Ceremony in the garden" value={t.title} maxLength={120} onChange={(e) => up("title", e.target.value)} />
            <input aria-label="Note" placeholder="Note (optional)" value={t.note || ""} maxLength={300} onChange={(e) => up("note", e.target.value)} />
          </>
        )}
      />
      {!items.length && <p className="ws-muted">For example: 15:00 Ceremony · 16:30 Reception · 19:00 Dinner · 21:00 First dance.</p>}
      <SaveBar busy={busy} dirty={dirty} onSave={save} label="Save programme" />
    </section>
  );
}

export function GiftsPanel({ content, onSaveContent }) {
  const start = () => (content.gifts || []).map((g) => ({ ...g, _k: rid() }));
  const [items, setItems] = useState(start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const clean = (v) => strip(v).map((g) => ({ title: (g.title || "").trim(), ...(g.link?.trim() ? { link: g.link.trim() } : {}), ...(g.note?.trim() ? { note: g.note.trim() } : {}) })).filter((g) => g.title);
  const dirty = JSON.stringify(clean(items)) !== JSON.stringify(content.gifts || []);
  async function save() {
    const list = clean(items);
    if (list.some((g) => g.link && !/^https?:\/\/\S{3,}$/i.test(g.link))) { setError("Links must start with https://"); return; }
    setError(""); setBusy(true);
    try { await onSaveContent({ gifts: list }, "Gift registry saved."); } finally { setBusy(false); }
  }
  return (
    <section className="ws-panel ev-panel">
      <h3><Gift size={17} /> Gift registry</h3>
      <p className="ws-muted">Wishes with a link to the shop. Guests see the list on their invitation.</p>
      <ListEditor
        items={items}
        setItems={setItems}
        max={40}
        addLabel="Add a wish"
        blank={() => ({ title: "", link: "", note: "" })}
        render={(g, up) => (
          <>
            <input aria-label="Gift" placeholder="e.g. Espresso machine" value={g.title} maxLength={140} onChange={(e) => up("title", e.target.value)} />
            <input aria-label="Link" placeholder="https://shop…" value={g.link || ""} maxLength={500} onChange={(e) => up("link", e.target.value)} />
            <input aria-label="Note" placeholder="Note (optional)" value={g.note || ""} maxLength={300} onChange={(e) => up("note", e.target.value)} />
          </>
        )}
      />
      {error && <p className="error">{error}</p>}
      <SaveBar busy={busy} dirty={dirty} onSave={save} label="Save gift list" />
    </section>
  );
}

const replyTime = (g) => g.responded_at || g.updated_at || g.created_at;

export function RsvpPanel({ guests, onExport }) {
  const replies = guests.filter((g) => g.response !== "pending").sort((a, b) => String(replyTime(b) || "").localeCompare(String(replyTime(a) || "")));
  const waiting = guests.filter((g) => g.response === "pending");
  return (
    <section className="ws-panel ev-panel">
      <div className="ws-guests-head">
        <div>
          <h3>RSVPs</h3>
          <p className="ws-muted">Every reply with the number of people and their message.</p>
        </div>
        <button className="lx-link" onClick={onExport} disabled={!guests.length}><Download size={14} /> Export CSV</button>
      </div>
      {replies.length ? (
        <ul className="ev-replies">
          {replies.map((g) => (
            <li key={g.id}>
              <span className="ev-avatar" aria-hidden="true">{initials(g.name)}</span>
              <span className="ev-reply-body">
                <strong>{g.name}</strong>
                <small>{g.response === "yes" ? `Coming · ${g.party_size || 1} ${(g.party_size || 1) > 1 ? "people" : "person"}` : "Can’t come"}</small>
                {g.note && <em>“{g.note}”</em>}
              </span>
              <span className={"ws-status " + g.response}>{g.response === "yes" ? "Going" : "Can’t go"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ws-muted">No replies yet. Share your link and they will appear here.</p>
      )}
      {waiting.length > 0 && (
        <p className="ws-muted ev-waiting">Still waiting for: {waiting.map((g) => g.name).join(", ")}</p>
      )}
    </section>
  );
}

export function initials(name = "") {
  return name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "·";
}

export function SettingsPanel({ invite, onSaveContent, onEdit, onShare, onRefresh, notify, setPackage }) {
  const c = invite.content;
  const pkg = packageOf(c);
  return (
    <section className="ws-panel ev-panel">
      <h3>Settings</h3>
      <div className="ev-settings">
        <div>
          <strong>Colour world</strong>
          <span className="ws-muted">The look of your dashboard and of your guests’ details page.</span>
          <div className="ev-worlds">
            {worldThemes.map((w) => (
              <button
                key={w.id}
                className={(c.worldTheme || "midnight") === w.id ? "selected" : ""}
                onClick={() => onSaveContent({ worldTheme: w.id }, w.name + " is now your colour world.")}
              >
                <span style={{ backgroundImage: `url(${w.image})` }} />
                {w.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <strong>Package</strong>
          <span className="ws-muted">{PACKAGES.find((p) => p.id === pkg)?.name}. Changing to Invitation hides this dashboard; nothing is deleted.</span>
          <div className="ws-row">
            {PACKAGES.filter((p) => !p.soon).map((p) => (
              <button key={p.id} className={"lx-btn ws-btn " + (p.id === pkg ? "lx-btn-solid" : "lx-btn-line")} disabled={p.id === pkg} onClick={() => setPackage(invite, p.id, onRefresh, notify)}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <strong>Invitation</strong>
          <span className="ws-muted">{invite.published ? "Published — guests can open your link." : "Draft — publish it in the studio to share."}</span>
          <div className="ws-row">
            <button className="lx-btn lx-btn-line ws-btn" onClick={() => onEdit(invite)}>Open studio</button>
            <button className="lx-btn lx-btn-line ws-btn" disabled={!invite.published} onClick={() => onShare(invite)}>Share link</button>
          </div>
        </div>
      </div>
    </section>
  );
}
