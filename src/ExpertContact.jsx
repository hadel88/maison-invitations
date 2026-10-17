import React, { useState } from "react";
import { ArrowUpRight, Check, Loader2, MessageCircle, Phone, Send } from "lucide-react";
import { api } from "./client";
import { safeWebsite } from "./providers";

// Detail view of an expert who listed their business on Maison:
// gallery, details, and three ways to get in touch — call, website, or a quote request.
export default function ExpertContact({ p, user, city, onAuth, onSpace, notify }) {
  const [big, setBig] = useState(null);
  const [form, setForm] = useState({ name: "", email: user?.email || "", phone: "", date: "", guests: "", budget: "", message: "", website: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const site = safeWebsite(p.website);
  async function show(photo) {
    setBig({ id: photo.id, src: photo.thumb });
    try { const r = await api("expert-photo", { query: { id: photo.id } }); setBig({ id: photo.id, src: r.image }); } catch { /* keep the thumbnail */ }
  }
  async function send(e) {
    e.preventDefault();
    setSending(true); setError("");
    try {
      await api("expert-request", { method: "POST", data: { ...form, listing_id: p.maisonId } });
      setSent(true);
      notify("Your request was sent to " + p.name + ".");
    } catch (err) { setError(err.message); } finally { setSending(false); }
  }
  return (
    <div className="ec">
      <span className="royal-eyebrow dark">MAISON EXPERT · {p.category.toUpperCase()}</span>
      <h2>{p.name}</h2>
      <p className="ec-where">{[p.address, p.city].filter(Boolean).join(" · ")}</p>
      {p.photos?.length > 0 && (
        <div className="ec-gallery">
          <img className="ec-main" src={big?.src || p.photos[0].thumb} alt={p.name} />
          {p.photos.length > 1 && (
            <div className="ec-thumbs">{p.photos.map((ph) => <button key={ph.id} onClick={() => show(ph)} aria-label="Show photo"><img src={ph.thumb} alt="" /></button>)}</div>
          )}
        </div>
      )}
      {p.description && <p className="ec-text">{p.description}</p>}
      {p.services && <p className="ec-text"><b>Services:</b> {p.services}</p>}
      {p.price_from && <p className="ec-price">{p.price_from}</p>}
      <div className="ec-contact">
        {p.phone && <a className="royal-btn outline" href={"tel:" + p.phone.replace(/[^+\d]/g, "")}><Phone size={14} />Call {p.phone}</a>}
        {site && <a className="royal-btn outline" href={site} target="_blank" rel="noopener noreferrer">Website<ArrowUpRight size={14} /></a>}
      </div>
      {sent ? (
        <div className="ec-sent">
          <Check size={18} />
          <div>
            <strong>Request sent.</strong>
            <p>{user ? "Replies arrive in Messages — you can keep chatting there." : "The expert will answer by email or phone."}</p>
            {user && <button className="royal-text" onClick={() => onSpace("messages")}><MessageCircle size={14} />Open Messages</button>}
          </div>
        </div>
      ) : (
        <form className="ec-form" onSubmit={send}>
          <h3>Ask for a quote</h3>
          <p className="ec-note">{user ? "Free and without obligation. Replies arrive in your Messages." : "Free and without obligation. "}{!user && <button type="button" className="royal-text" onClick={onAuth}>Sign in to chat in Maison</button>}</p>
          <div className="ec-two">
            <label className="field">Your name<input value={form.name} onChange={set("name")} required minLength={2} maxLength={80} autoComplete="name" /></label>
            <label className="field">Email{user ? "" : " (or phone)"}<input type="email" value={form.email} onChange={set("email")} maxLength={120} autoComplete="email" /></label>
          </div>
          <div className="ec-three">
            <label className="field">Phone<input type="tel" value={form.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" /></label>
            <label className="field">Date<input type="date" value={form.date} onChange={set("date")} /></label>
            <label className="field">Guests<input type="number" min="1" max="5000" value={form.guests} onChange={set("guests")} /></label>
          </div>
          <label className="field">Budget <small>(optional)</small><input value={form.budget} onChange={set("budget")} maxLength={60} placeholder="e.g. €1,500" /></label>
          <label className="field">Your message<textarea rows={4} value={form.message} onChange={set("message")} required minLength={5} maxLength={3000} placeholder={`Hello ${p.name}, we are planning a celebration in ${city}…`} /></label>
          <input className="ec-hp" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} aria-hidden="true" />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="royal-btn ink" disabled={sending}>{sending ? <Loader2 className="spin" size={14} /> : <Send size={14} />}Send request</button>
          <small className="ec-fine">Your details go only to this expert. Maison sends no message or booking on its own.</small>
        </form>
      )}
    </div>
  );
}
