import React, { useEffect, useState } from 'react';
import { Copy, UserPlus, Trash2, ArrowUpRight, Check } from 'lucide-react';
import { api } from './client';
import './team.css';

// "Your team": the host invites their planner with a private link. The planner signs in through it and
// lands in their own workspace for this event, already filled with guests, replies, meals and the programme.
// Other vendor categories use the same model and are listed as coming next.
const NEXT = ['Catering', 'Photography', 'Music', 'Flowers', 'Cakes'];

export default function TeamPanel({ invite, notify }) {
  const [team, setTeam] = useState(null), [error, setError] = useState(''), [name, setName] = useState(''), [busy, setBusy] = useState(false);
  async function load() { try { setTeam(await api('team', { query: { id: invite.id } })); setError(''); } catch (e) { setError(e.message); setTeam([]); } }
  useEffect(() => { load(); }, [invite.id]);
  const planner = team?.find((t) => t.category === 'planner');
  const link = planner?.invite_token ? `${location.origin}/?join=${planner.invite_token}` : '';
  async function invitePlanner(e) {
    e.preventDefault(); setBusy(true);
    try { await api('team', { method: 'POST', data: { invitation: invite.id, category: 'planner', name } }); setName(''); await load(); notify('Your planner’s private link is ready. Copy it and send it to them.'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm('Remove your planner? Their access to this event ends immediately and the old link stops working.')) return;
    setBusy(true);
    try { await api('team', { method: 'DELETE', data: { id: planner.id } }); await load(); notify('Planner removed.'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function copy() { try { await navigator.clipboard.writeText(link); notify('Link copied. Send it only to your planner.'); } catch { window.prompt('Copy this link for your planner:', link); } }

  if (!team) return <section className="ws-panel"><p role="status">Preparing your team…</p></section>;
  return <section className="ws-panel team-panel">
    <span className="maison-kicker">THE PEOPLE BEHIND YOUR DAY</span>
    <h3>Your team</h3>
    <p className="ws-muted">Invite your planner into this event. They get their own workspace with your guests, replies, menu choices, allergies, tables and programme, already filled in. Guests’ personal links and private notes stay with you.</p>
    {error && <p className="error" role="alert">{error}</p>}
    <div className="team-card">
      <span className="maison-kicker">YOUR PLANNER</span>
      {!planner ? <form onSubmit={invitePlanner} className="team-invite">
        <label>Planner or studio name (optional)<input value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. Atelier Blanc Events" /></label>
        <button className="lx-btn lx-btn-solid" disabled={busy}><UserPlus size={14} />Invite your planner</button>
      </form> : <>
        <strong className="team-name">{planner.vendor_name || 'Your planner'}</strong>
        <p className="ws-muted">{planner.status === 'joined' ? <><Check size={13} /> Joined. Working in their workspace.</> : 'Invited. Waiting for them to open the link.'}</p>
        {planner.status !== 'joined' && link && <div className="team-link"><input readOnly value={link} aria-label="Private planner link" onFocus={(e) => e.target.select()} /><button className="lx-btn lx-btn-solid" onClick={copy}><Copy size={14} />Copy link</button></div>}
        {planner.status !== 'joined' && <p className="ws-muted">Send this link only to your planner: the first account that signs in with it becomes your planner.</p>}
        <div className="team-actions">
          <a className="lx-btn lx-btn-line" href={`/?workspace=planner&event=${invite.id}`} target="_blank" rel="noreferrer">See the planner workspace<ArrowUpRight size={14} /></a>
          <button className="lx-btn lx-btn-line" disabled={busy} onClick={remove}><Trash2 size={14} />Remove</button>
        </div>
      </>}
    </div>
    <p className="ws-muted team-next">Coming next with the same private link: {NEXT.join(' · ')}.</p>
  </section>;
}
