import React, { useEffect, useState } from "react";
import { ArrowLeft, Camera, Check, Loader2, Mail, MessageCircle, Phone, Send, ShieldCheck, Trash2, X } from "lucide-react";
import { api } from "./client";

// Maison experts: a business page for venues & service providers, their inbox
// (quote requests + conversations), and the approval list for Maison admins.
export const EXPERT_CATEGORIES = [
  ["venues", "Venues"], ["planners", "Planners"], ["dining", "Catering"], ["flowers", "Flowers"],
  ["photography", "Photography"], ["bridal", "Bridal shops"], ["music", "Music & entertainment"],
  ["cakes", "Cakes"], ["beauty", "Beauty"], ["decoration", "Decoration"], ["family", "Family activities"],
];
export const categoryName = (key) => (EXPERT_CATEGORIES.find(([k]) => k === key) || [, key])[1];
const STATUS = { pending: "Waiting for approval", approved: "Live on Maison", hidden: "Hidden" };
const when = (d) => new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

async function resize(file, width, quality, max) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, width / img.width);
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  img.close();
  let q = quality, out = c.toDataURL("image/jpeg", q);
  while (out.length > max && q > 0.3) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
  if (out.length > max) throw new Error("This photo is too large. Please choose a smaller one.");
  return out;
}

export default function ExpertSpace({ user, tab: startTab = "listing", onBack, notify }) {
  const [tab, setTab] = useState(startTab);
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const load = () =>
    api("expert-me")
      .then(setMe)
      .catch((e) => {
        if (/experts\.sql/.test(e.message)) setMissing(true);
        else setError(e.message);
      });
  useEffect(() => { load(); }, [user?.id]);
  return (
    <main className="es-page">
      <div className="es-head">
        <button className="royal-text" onClick={onBack}><ArrowLeft size={14} />Venues & Experts</button>
        <span className="royal-eyebrow dark">FOR VENUES & EXPERTS</span>
        <h1>Your Maison business space</h1>
        <p>Show your place or service to hosts planning their celebration, and answer quote requests in one place.</p>
        <div className="es-tabs" role="tablist">
          {[["listing", "My business"], ["messages", "Messages"], ...(me?.admin ? [["admin", "Approve listings"]] : [])].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "selected" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      {missing ? (
        <div className="es-panel"><p className="error">Expert listings are not activated yet. Run <b>database/experts.sql</b> once in Supabase → SQL Editor.</p></div>
      ) : error ? (
        <div className="es-panel"><p className="error">{error}</p></div>
      ) : !me ? (
        <div className="es-panel es-loading"><Loader2 className="spin" size={20} /></div>
      ) : tab === "listing" ? (
        <ListingPanel me={me} reload={load} notify={notify} />
      ) : tab === "messages" ? (
        <Inbox notify={notify} />
      ) : (
        <AdminPanel notify={notify} />
      )}
    </main>
  );
}

function ListingPanel({ me, reload, notify }) {
  const l = me.listing;
  const [f, setF] = useState(() => ({
    name: l?.name || "", category: l?.category || "venues", city: l?.city || "", address: l?.address || "",
    description: l?.description || "", services: l?.services || "", price_from: l?.price_from || "",
    phone: l?.phone || "", email: l?.email || "", website: l?.website || "",
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function save(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api("expert-me", { method: "POST", data: f });
      notify(l ? "Your business page is saved." : "Your business page is saved and sent for approval.");
      await reload();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  async function addPhoto(file) {
    if (!file || !l) return;
    setUploading(true); setError("");
    try {
      const [thumb, image] = await Promise.all([resize(file, 480, 0.72, 79000), resize(file, 1280, 0.8, 340000)]);
      await api("expert-photos", { method: "POST", data: { listing_id: l.id, thumb, image } });
      await reload();
      notify("Photo added. Your page will be checked again before it shows.");
    } catch (err) { setError(err.message); } finally { setUploading(false); }
  }
  async function removePhoto(id) {
    try { await api("expert-photos", { method: "DELETE", data: { id } }); await reload(); } catch (err) { setError(err.message); }
  }
  async function removeListing() {
    if (!window.confirm("Delete your business page, photos and all its requests? This cannot be undone.")) return;
    try { await api("expert-me", { method: "DELETE" }); notify("Your business page was deleted."); await reload(); } catch (err) { setError(err.message); }
  }
  return (
    <div className="es-grid">
      <form className="es-panel es-form" onSubmit={save}>
        <div className="es-panel-head">
          <h2>{l ? "Your business page" : "Add your business"}</h2>
          {l && <span className={"es-status es-" + l.status}>{l.status === "approved" ? <ShieldCheck size={13} /> : null}{STATUS[l.status]}</span>}
        </div>
        {!l && <p className="es-note">Free during the preview. Maison checks every new page before it appears in search.</p>}
        {l?.status === "pending" && <p className="es-note">We check new and changed pages before they appear in search. You can keep editing meanwhile.</p>}
        <label className="field">Business name<input value={f.name} onChange={set("name")} required minLength={2} maxLength={120} /></label>
        <div className="es-two">
          <label className="field">Category<select value={f.category} onChange={set("category")}>{EXPERT_CATEGORIES.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label className="field">City<input value={f.city} onChange={set("city")} required minLength={2} maxLength={80} placeholder="e.g. Frankfurt" /></label>
        </div>
        <label className="field">Address <small>(optional)</small><input value={f.address} onChange={set("address")} maxLength={200} /></label>
        <label className="field">About you<textarea rows={5} value={f.description} onChange={set("description")} maxLength={2000} placeholder="What makes your place or service special for a celebration?" /></label>
        <label className="field">Services & packages<textarea rows={3} value={f.services} onChange={set("services")} maxLength={1000} placeholder="e.g. Bridal bouquet, table flowers, ceremony arch" /></label>
        <label className="field">Prices from <small>(optional)</small><input value={f.price_from} onChange={set("price_from")} maxLength={60} placeholder="e.g. from €450" /></label>
        <div className="es-two">
          <label className="field">Phone<input type="tel" value={f.phone} onChange={set("phone")} maxLength={40} /></label>
          <label className="field">Email<input type="email" value={f.email} onChange={set("email")} maxLength={120} /></label>
        </div>
        <label className="field">Website<input value={f.website} onChange={set("website")} maxLength={300} placeholder="https://" /></label>
        <small className="es-fine">Phone and website are shown on your page so hosts can call or visit you. Your email is not shown; requests arrive in Messages.</small>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="es-actions">
          <button className="royal-btn ink" disabled={saving}>{saving ? <Loader2 className="spin" size={15} /> : <Check size={15} />}{l ? "Save changes" : "Save & send for approval"}</button>
          {l && <button type="button" className="royal-text es-danger" onClick={removeListing}><Trash2 size={14} />Delete page</button>}
        </div>
      </form>
      <section className="es-panel">
        <div className="es-panel-head"><h2>Photos</h2><span className="es-count">{l?.photos?.length || 0} / 4</span></div>
        {!l ? (
          <p className="es-note">Save your business first, then add up to 4 photos.</p>
        ) : (
          <>
            <div className="es-photos">
              {l.photos.map((p) => (
                <figure key={p.id}><img src={p.thumb} alt="" /><button type="button" onClick={() => removePhoto(p.id)} aria-label="Remove photo"><X size={13} /></button></figure>
              ))}
              {l.photos.length < 4 && (
                <label className="es-add-photo">
                  {uploading ? <Loader2 className="spin" size={20} /> : <Camera size={20} />}
                  <span>{uploading ? "Uploading…" : "Add photo"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              )}
            </div>
            <p className="es-fine">Use your own photos, or photos you have the rights to. They are resized in your browser before upload.</p>
          </>
        )}
      </section>
    </div>
  );
}

function Inbox({ notify }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");
  const load = () => api("expert-inbox").then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); const id = setInterval(() => { if (!document.hidden) load(); }, 20000); return () => clearInterval(id); }, []);
  if (error) return <div className="es-panel"><p className="error">{error}</p></div>;
  if (!items) return <div className="es-panel es-loading"><Loader2 className="spin" size={20} /></div>;
  const current = items.find((i) => i.id === open);
  return (
    <div className={"es-inbox " + (current ? "has-open" : "")}>
      <section className="es-panel es-list">
        <h2>Messages</h2>
        {!items.length && <p className="es-note">No requests yet. Requests you send to experts, and requests hosts send to your business, appear here.</p>}
        {items.map((r) => (
          <button key={r.id} className={"es-item " + (open === r.id ? "selected" : "")} onClick={() => setOpen(r.id)}>
            <span className="es-item-top">
              <strong>{r.mine ? r.sender_name : r.listing?.name}</strong>
              {r.mine && r.status === "new" && <i className="es-dot">New</i>}
            </span>
            <small>{r.mine ? "Request to your business" : "Your request · " + categoryName(r.listing?.category)} · {when(r.created_at)}</small>
            <span className="es-item-text">{r.message}</span>
          </button>
        ))}
      </section>
      {current && <Thread r={current} onClose={() => setOpen(null)} onChange={load} notify={notify} />}
    </div>
  );
}

function Thread({ r, onClose, onChange, notify }) {
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const load = () => api("expert-thread", { query: { id: r.id } }).then(setMsgs).catch((e) => setError(e.message));
  useEffect(() => { setMsgs(null); load(); const id = setInterval(() => { if (!document.hidden) load(); }, 10000); return () => clearInterval(id); }, [r.id]);
  const canChat = r.status !== "closed" && (r.mine ? !!r.sender_id : true);
  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true); setError("");
    try { await api("expert-thread", { method: "POST", data: { request_id: r.id, body: text } }); setText(""); await load(); onChange(); }
    catch (err) { setError(err.message); } finally { setSending(false); }
  }
  async function status(s) {
    try { await api("expert-thread", { method: "POST", data: { request_id: r.id, status: s } }); onChange(); notify(s === "closed" ? "Conversation closed." : "Marked as answered."); }
    catch (err) { setError(err.message); }
  }
  return (
    <section className="es-panel es-thread">
      <div className="es-panel-head">
        <button className="royal-text" onClick={onClose}><ArrowLeft size={14} />All messages</button>
        {r.mine && r.status !== "closed" && <button className="royal-text" onClick={() => status("closed")}>Close request</button>}
      </div>
      <h2>{r.mine ? r.sender_name : r.listing?.name}</h2>
      <dl className="es-facts">
        {r.event_date && <><dt>Date</dt><dd>{new Date(r.event_date + "T12:00:00").toLocaleDateString()}</dd></>}
        {r.guests && <><dt>Guests</dt><dd>{r.guests}</dd></>}
        {r.budget && <><dt>Budget</dt><dd>{r.budget}</dd></>}
        {r.mine && r.sender_email && <><dt>Email</dt><dd><a href={"mailto:" + r.sender_email}>{r.sender_email}</a></dd></>}
        {r.mine && r.sender_phone && <><dt>Phone</dt><dd><a href={"tel:" + r.sender_phone.replace(/[^+\d]/g, "")}>{r.sender_phone}</a></dd></>}
        {!r.mine && r.listing?.phone && <><dt>Phone</dt><dd><a href={"tel:" + r.listing.phone.replace(/[^+\d]/g, "")}>{r.listing.phone}</a></dd></>}
      </dl>
      <div className="es-messages">
        {!msgs ? <Loader2 className="spin" size={18} /> : msgs.map((m) => (
          <div key={m.id} className={"es-msg " + (m.from_expert === r.mine ? "own" : "")}><p>{m.body}</p><small>{when(m.created_at)}</small></div>
        ))}
      </div>
      {r.mine && !r.sender_id && (
        <p className="es-note">This host sent the request without an account. Reply by {r.sender_email ? "email" : ""}{r.sender_email && r.sender_phone ? " or " : ""}{r.sender_phone ? "phone" : ""}, then mark it as answered.
          {r.status === "new" && <button className="royal-text" onClick={() => status("answered")}><Check size={13} />Mark as answered</button>}
        </p>
      )}
      {r.status === "closed" && <p className="es-note">This request is closed.</p>}
      {canChat && (
        <form className="es-reply" onSubmit={send}>
          <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} maxLength={3000} placeholder="Write a message…" aria-label="Message" />
          <button className="royal-btn ink" disabled={sending || !text.trim()}>{sending ? <Loader2 className="spin" size={14} /> : <Send size={14} />}Send</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

function AdminPanel({ notify }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const load = () => api("expert-admin").then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  async function decide(id, status) {
    try { await api("expert-admin", { method: "POST", data: { id, status } }); notify(status === "approved" ? "Listing approved — it now appears in search." : "Listing hidden."); load(); }
    catch (e) { setError(e.message); }
  }
  if (error) return <div className="es-panel"><p className="error">{error}</p></div>;
  if (!rows) return <div className="es-panel es-loading"><Loader2 className="spin" size={20} /></div>;
  return (
    <section className="es-panel">
      <h2>Waiting for approval</h2>
      {!rows.length && <p className="es-note">Nothing to check right now.</p>}
      <div className="es-admin">
        {rows.map((l) => (
          <article key={l.id}>
            <div className="es-admin-photos">{(l.maison_expert_photos || []).map((p) => <img key={p.id} src={p.thumb} alt="" />)}</div>
            <span className="expert-category">{categoryName(l.category)} · {l.city} · {STATUS[l.status]}</span>
            <h3>{l.name}</h3>
            <p>{l.description || <i>No description</i>}</p>
            {l.services && <p><b>Services:</b> {l.services}</p>}
            <small>{[l.price_from, l.phone && <><Phone size={11} /> {l.phone}</>, l.email && <><Mail size={11} /> {l.email}</>, l.website].filter(Boolean).map((x, i) => <span key={i}>{x}</span>)}</small>
            <div className="es-actions">
              <button className="royal-btn ink" onClick={() => decide(l.id, "approved")}><Check size={14} />Approve</button>
              {l.status !== "hidden" && <button className="royal-btn outline" onClick={() => decide(l.id, "hidden")}><X size={14} />Hide</button>}
            </div>
          </article>
        ))}
      </div>
      <p className="es-fine"><MessageCircle size={11} /> Approved listings show in Venues & Experts for their city and category. If an expert changes their text or photos, the listing comes back here.</p>
    </section>
  );
}
