import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { CalendarDays, MapPin, Users, ListChecks, Clock, Megaphone, Store, LayoutDashboard, Search, Check, Plus, Send, Utensils, AlertTriangle, ArrowUpRight, Trash2, Lock, ArrowLeft, LayoutGrid } from 'lucide-react';
import HallPlan from './HallPlan';
import { api } from './client';
import { sceneFor } from './cinemaThemes';
import { sceneVariables } from './occasionScenes';
import { dateLabel } from './catalog';
import './plannerWorkspace.css';

const AuthDialog = lazy(() => import('./AuthDialog'));

// The planner's workspace. A planner joins through the host's private invite link and finds the event
// already set up: guests and replies, meals and allergies, the schedule, tasks and the vendor team.
// Every other vendor workspace (catering, photography, music…) plugs into the same event later.
// Demo (no account, nothing saved): /?workspace=planner&demo=1

const demo = {
  role: 'planner',
  event: { scene: 'sage', occasion: 'Wedding', names: 'Clara & Gabriel', date: '2027-06-19', time: '16:00', venue: 'Villa Balbiano', address: 'Lake Como, Italy',
    timeline: [{ time: '15:30', title: 'Guests arrive', note: 'Welcome drinks on the terrace', owner: 'Planner' }, { time: '16:00', title: 'The ceremony', note: 'Garden pergola', owner: 'Planner' }, { time: '17:00', title: 'Cocktails & portraits', note: 'Lake terrace', owner: 'Photography' }, { time: '19:00', title: 'Dinner is served', note: 'Three courses', owner: 'Catering' }, { time: '21:30', title: 'First dance', note: 'Ballroom', owner: 'Music' }] },
  guests: [
    ['Sophie Laurent', 'yes', 2, 'Fish', '', 'Table 4'], ['Marc Dubois', 'yes', 1, 'Meat', 'Nuts', 'Table 2'], ['Lena Hoffmann', 'pending', 2, '', '', ''], ['Amira Haddad', 'yes', 3, 'Vegetarian', '', 'Table 4'],
    ['Jonas Becker', 'no', 1, '', '', ''], ['Giulia Rossi', 'yes', 2, 'Vegan', 'Gluten', 'Table 1'], ['Tom Fischer', 'pending', 1, '', '', ''], ['Nora Schmidt', 'yes', 2, 'Meat', '', 'Table 3'],
    ['Paul Martin', 'yes', 1, 'Fish', 'Shellfish', 'Table 2'], ['Ella Wagner', 'pending', 2, '', '', ''], ['Yusuf Kaya', 'yes', 2, 'Vegetarian', '', 'Table 5'], ['Clara Novak', 'no', 2, '', '', ''],
  ].map(([name, reply, party, meal, allergy, table]) => ({ name, reply, party, meal, allergy, table })),
  tasks: [
    { id: 'd' + Math.random().toString(36).slice(2), title: 'Confirm final headcount with catering', due: '2027-05-29', who: 'Planner', done: false },
    { id: 'd' + Math.random().toString(36).slice(2), title: 'Send reminder to guests without a reply', due: '2027-05-25', who: 'Planner', done: false },
    { id: 'd' + Math.random().toString(36).slice(2), title: 'Approve the seating plan', due: '2027-06-01', who: 'Host', done: false },
    { id: 'd' + Math.random().toString(36).slice(2), title: 'Share shot list with the photographer', due: '2027-06-05', who: 'Planner', done: true },
    { id: 'd' + Math.random().toString(36).slice(2), title: 'Book the string quartet', due: '2027-03-01', who: 'Host', done: true },
  ],
  team: [
    { category: 'planner', name: 'Maison Planning', status: 'joined' },
    { category: 'catering', name: 'Cucina del Lago', status: 'joined' },
    { category: 'photography', name: 'Atelier Lumen', status: 'joined' },
    { category: 'music', name: 'Quartetto Aurora', status: 'invited' },
  ],
  updates: [{ id: 'u1', by: 'planner', when: '2027-05-10', text: 'Parking is now available at the Villa’s lower garden. Please follow the gold signs.' }],
};

const tabs = [['overview', 'Overview', LayoutDashboard], ['guests', 'Guests', Users], ['schedule', 'Schedule', Clock], ['hall', 'Hall plan', LayoutGrid], ['tasks', 'Tasks', ListChecks], ['team', 'Vendor team', Store], ['updates', 'Updates', Megaphone]];
const demoTables = [1, 2, 3, 4, 5].map((n) => ({ id: '00000000-0000-4000-8000-00000000000' + n, name: 'Table ' + n, capacity: 8 }));
const CATEGORIES = ['planner', 'catering', 'photography', 'music', 'flowers', 'cakes'];
const cap = (x) => String(x || '').charAt(0).toUpperCase() + String(x || '').slice(1);
const when = (d) => (d ? dateLabel(String(d).slice(0, 10), 'en') : 'No date');

function daysUntil(date) { const t = new Date(date + 'T12:00'); return isNaN(t) ? null : Math.max(0, Math.ceil((t - Date.now()) / 86400000)); }

function normalize(d) {
  const team = d.team || [];
  const extra = team.map((t) => t.category).filter((c) => !CATEGORIES.includes(c));
  return {
    role: d.role,
    event: { ...d.event, timeline: d.event?.timeline || [] },
    guests: (d.guests || []).map((x) => ({ ...x, party: Number(x.party) || 1 })),
    tasks: d.tasks || [],
    updates: d.updates || [],
    vendors: [...CATEGORIES, ...extra].map((c) => { const t = team.find((x) => x.category === c); return { category: c, name: t?.name || '', status: t?.status || 'none' }; }),
  };
}

export default function PlannerWorkspace({ demo: isDemo = false, eventId = null, join = null, Modal, Field }) {
  const [phase, setPhase] = useState(isDemo ? 'ready' : 'loading');
  const [data, setData] = useState(isDemo ? normalize(demo) : null);
  const [events, setEvents] = useState([]);
  const [id, setId] = useState(eventId);
  const [signIn, setSignIn] = useState(false);
  const [problem, setProblem] = useState('');

  async function openEvent(eid) {
    setPhase('loading');
    try { setData(normalize(await api('workspace', { query: { id: eid } }))); setId(eid); setPhase('ready'); const tab = new URLSearchParams(location.search).get('tab'); history.replaceState(null, '', '/?workspace=planner&event=' + eid + (tab ? '&tab=' + encodeURIComponent(tab) : '')); }
    catch (e) { setProblem(e.message); setPhase('error'); }
  }
  async function start() {
    setPhase('loading'); setProblem('');
    try {
      const { user } = await api('session');
      if (!user) { setPhase('signin'); return; }
      if (join) { const r = await api('team-join', { method: 'POST', data: { token: join } }); return openEvent(r.invitation_id); }
      if (eventId) return openEvent(eventId);
      const list = await api('workspaces'); setEvents(list || []);
      if (list?.length === 1) return openEvent(list[0].invitation_id);
      setPhase('pick');
    } catch (e) { setProblem(e.message); setPhase('error'); }
  }
  useEffect(() => { if (!isDemo) start(); }, []);

  if (phase !== 'ready') return <main className="pw pw-gate-page">
    <section className="pw-gate">
      <a className="pw-brand" href="/">MAISON<span>THE PLANNER’S ATELIER</span></a>
      {phase === 'loading' && <p className="pw-muted" role="status">Opening your workspace…</p>}
      {phase === 'signin' && <>
        <h1>{join ? 'You have been invited to plan an event.' : 'Your planner workspace.'}</h1>
        <p>Sign in or create your Maison account. {join ? 'The event, its guests and its schedule are already waiting for you.' : ''}</p>
        <button className="pw-btn" onClick={() => setSignIn(true)}><Lock size={14} />Sign in to continue</button>
      </>}
      {phase === 'pick' && <>
        <h1>Your events</h1>
        {events.length ? <div className="pw-events">{events.map((x) => <button key={x.invitation_id} onClick={() => openEvent(x.invitation_id)}><strong>{x.names || 'An event'}</strong><small>{when(x.date)}{x.venue ? ' · ' + x.venue : ''}</small><ArrowUpRight size={14} /></button>)}</div>
          : <p>No events yet. When a host invites you as their planner, open their link and the event appears here.</p>}
      </>}
      {phase === 'error' && <><h1>This workspace could not open.</h1><p role="alert">{problem}</p><button className="pw-btn ghost" onClick={start}>Try again</button></>}
    </section>
    {signIn && Modal && <Suspense fallback={null}><AuthDialog Modal={Modal} Field={Field} onClose={() => setSignIn(false)} onSuccess={() => { setSignIn(false); start(); }} /></Suspense>}
  </main>;
  return <Workspace data={data} setData={setData} id={id} isDemo={isDemo} multiple={events.length > 1} onAll={() => { setPhase('pick'); history.replaceState(null, '', '/?workspace=planner'); }} />;
}

function Workspace({ data, setData, id, isDemo, multiple, onAll }) {
  const [tab, setTab] = useState(() => (tabs.some((t) => t[0] === new URLSearchParams(location.search).get('tab')) ? new URLSearchParams(location.search).get('tab') : 'overview'));
  const [draft, setDraft] = useState(''), [busy, setBusy] = useState(false), [note, setNote] = useState('');
  const [newTask, setNewTask] = useState({ title: '', due: '', who: 'Planner' });
  const [query, setQuery] = useState(''), [filter, setFilter] = useState('all');
  const { tasks, updates, role } = data;
  const e = data.event, theme = sceneFor(e);
  const g = data.guests;
  const counts = useMemo(() => ({
    invited: g.reduce((n, x) => n + x.party, 0),
    attending: g.filter((x) => x.reply === 'yes').reduce((n, x) => n + x.party, 0),
    waiting: g.filter((x) => x.reply === 'pending').length,
    declined: g.filter((x) => x.reply === 'no').length,
  }), [g]);
  const meals = useMemo(() => { const m = {}; g.filter((x) => x.reply === 'yes' && x.meal).forEach((x) => { m[x.meal] = (m[x.meal] || 0) + x.party; }); return m; }, [g]);
  const allergies = g.filter((x) => x.reply === 'yes' && x.allergy);
  const shown = g.filter((x) => (filter === 'all' || x.reply === filter) && String(x.name || '').toLowerCase().includes(query.toLowerCase()));
  const open = tasks.filter((t) => !t.done).sort((a, b) => String(a.due || '9999').localeCompare(String(b.due || '9999')));
  const reply = { yes: 'Attending', no: 'Declined', pending: 'Awaiting reply' };
  const days = daysUntil(e.date);
  const patch = (fn) => setData((d) => ({ ...d, ...fn(d) }));

  // Saving: the demo keeps changes on this screen only; a real event saves for host and planner.
  async function save(action, payload, method = 'POST') {
    if (isDemo) return { id: 'd' + Date.now(), ...payload, when: new Date().toISOString(), by: role };
    setBusy(true); setNote('');
    try { return await api(action, { method, data: { invitation: id, ...payload } }); }
    catch (err) { setNote(err.message); throw err; }
    finally { setBusy(false); }
  }
  async function toggle(t) {
    patch((d) => ({ tasks: d.tasks.map((x) => x.id === t.id ? { ...x, done: !x.done } : x) }));
    try { await save('event-task', { ...t, done: !t.done }); } catch { patch((d) => ({ tasks: d.tasks.map((x) => x.id === t.id ? { ...x, done: t.done } : x) })); }
  }
  async function addTask(ev) {
    ev.preventDefault(); if (!newTask.title.trim()) return;
    try { const t = await save('event-task', { title: newTask.title.trim(), due: newTask.due || null, who: newTask.who, done: false }); patch((d) => ({ tasks: [...d.tasks, t] })); setNewTask({ title: '', due: '', who: newTask.who }); } catch {}
  }
  async function removeTask(t) { try { await save('event-task', { id: t.id }, 'DELETE'); patch((d) => ({ tasks: d.tasks.filter((x) => x.id !== t.id) })); } catch {} }
  async function post() {
    try { const u = await save('event-update', { text: draft.trim() }); patch((d) => ({ updates: [u.text ? u : { ...u, text: draft.trim() }, ...d.updates] })); setDraft(''); } catch {}
  }
  async function removeUpdate(u) { try { await save('event-update', { id: u.id }, 'DELETE'); patch((d) => ({ updates: d.updates.filter((x) => x.id !== u.id) })); } catch {} }

  const overview = <>
    <section className="pw-hero" style={{ '--pw-scene': theme.image ? `url(/${theme.image}.webp)` : 'none' }}>
      <div>
        <span className="pw-kicker">{String(e.occasion || theme.occasion || 'Celebration').toUpperCase()} · {role === 'host' ? 'YOUR EVENT' : 'PLANNER’S WORKSPACE'}</span>
        <h1>{e.names || 'Your event'}</h1>
        {e.date && <p><CalendarDays size={15} />{dateLabel(e.date, 'en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{e.time ? ' · ' + e.time : ''}</p>}
        {(e.venue || e.address) && <p><MapPin size={15} />{[e.venue, e.address].filter(Boolean).join(', ')}</p>}
      </div>
      {days !== null && <div className="pw-count"><small>THE COUNTDOWN</small><strong>{days}</strong><span>days to go</span></div>}
    </section>
    <section className="pw-kpis">
      {[['Invited', counts.invited], ['Attending', counts.attending], ['Awaiting reply', counts.waiting], ['Declined', counts.declined]].map(([l, v]) => <div key={l}><strong>{v}</strong><span>{l}</span></div>)}
    </section>
    <div className="pw-grid">
      <section className="pw-card">
        <h2><ListChecks size={17} />Next up</h2>
        {open.length ? open.slice(0, 3).map((t) => <div className="pw-task" key={t.id}><span className="pw-dot" /><div><strong>{t.title}</strong><small>{when(t.due)} · {t.who}</small></div></div>) : <p className="pw-muted">Nothing open. Beautifully on track.</p>}
        <button className="pw-link" onClick={() => setTab('tasks')}>All tasks<ArrowUpRight size={13} /></button>
      </section>
      <section className="pw-card">
        <h2><Utensils size={17} />Menu choices</h2>
        {Object.keys(meals).length ? <div className="pw-bars">{Object.entries(meals).map(([m, n]) => <div key={m}><span>{m}</span><i style={{ width: `${(n / Math.max(1, counts.attending)) * 100}%` }} /><b>{n}</b></div>)}</div> : <p className="pw-muted">Menu choices appear here as guests reply.</p>}
        {allergies.length > 0 && <p className="pw-warn"><AlertTriangle size={14} />{allergies.length} {allergies.length === 1 ? 'guest' : 'guests'} with allergies: {allergies.map((x) => `${String(x.name).split(' ')[0]} (${x.allergy})`).join(', ')}</p>}
      </section>
      <section className="pw-card">
        <h2><Store size={17} />Vendor team</h2>
        <div className="pw-chips">{data.vendors.map((v) => <span key={v.category} className={'pw-chip ' + v.status}>{cap(v.category)}{v.status === 'joined' ? <Check size={12} /> : v.status === 'invited' ? ' · invited' : ''}</span>)}</div>
        <button className="pw-link" onClick={() => setTab('team')}>The whole team<ArrowUpRight size={13} /></button>
      </section>
    </div>
  </>;

  const guests = <section className="pw-card pw-wide">
    <div className="pw-toolbar">
      <label className="pw-search"><Search size={15} /><input placeholder="Search guests" value={query} onChange={(x) => setQuery(x.target.value)} /></label>
      <div className="pw-filters">{[['all', 'All'], ['yes', 'Attending'], ['pending', 'Awaiting'], ['no', 'Declined']].map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>)}</div>
    </div>
    {g.length ? <div className="pw-table">
      <div className="pw-row pw-head"><span>Guest</span><span>Reply</span><span>Party</span><span>Meal</span><span>Allergies</span><span>Table</span></div>
      {shown.map((x, i) => <div className="pw-row" key={i}><span>{x.name}</span><span className={'pw-reply ' + x.reply}>{reply[x.reply] || x.reply}</span><span>{x.party}</span><span>{x.meal || '—'}</span><span>{x.allergy ? <b className="pw-allergy">{x.allergy}</b> : '—'}</span><span>{x.table || '—'}</span></div>)}
    </div> : <p className="pw-muted">The host has not added guests yet. They appear here automatically.</p>}
    <p className="pw-muted"><Lock size={13} /> Guests’ personal links and private notes stay with the host. You see replies, menu choices, allergies and tables.</p>
  </section>;

  const schedule = <section className="pw-card pw-wide">
    <h2><Clock size={17} />The day</h2>
    {e.timeline.length ? <ol className="pw-timeline">{e.timeline.map((t, i) => <li key={i}><time>{t.time}</time><div><strong>{t.title}</strong>{t.note && <small>{t.note}</small>}</div>{t.owner && <span className="pw-owner">{t.owner}</span>}</li>)}</ol> : <p className="pw-muted">The host has not added a programme to the invitation yet.</p>}
    <p className="pw-muted">This is the programme from the invitation, exactly as guests see it.</p>
  </section>;

  const taskList = <section className="pw-card pw-wide">
    <h2><ListChecks size={17} />Tasks shared with {role === 'host' ? 'your planner' : 'the host'}</h2>
    {tasks.map((t) => <div className={'pw-check ' + (t.done ? 'done' : '')} key={t.id}><label><input type="checkbox" checked={!!t.done} disabled={busy} onChange={() => toggle(t)} /><span><strong>{t.title}</strong><small>{when(t.due)} · {t.who}</small></span></label><button className="pw-icon" aria-label={'Delete ' + t.title} onClick={() => removeTask(t)}><Trash2 size={14} /></button></div>)}
    {!tasks.length && <p className="pw-muted">No tasks yet. Add the first one below.</p>}
    <form className="pw-add" onSubmit={addTask}>
      <input placeholder="A new task" maxLength={200} value={newTask.title} onChange={(x) => setNewTask({ ...newTask, title: x.target.value })} aria-label="Task" />
      <input type="date" value={newTask.due} onChange={(x) => setNewTask({ ...newTask, due: x.target.value })} aria-label="Due date" />
      <select value={newTask.who} onChange={(x) => setNewTask({ ...newTask, who: x.target.value })} aria-label="Who"><option>Planner</option><option>Host</option></select>
      <button className="pw-btn" disabled={busy || !newTask.title.trim()}><Plus size={14} />Add</button>
    </form>
  </section>;

  const team = <section className="pw-card pw-wide">
    <h2><Store size={17} />The vendor team</h2>
    <div className="pw-vendors">{data.vendors.map((v) => <div className={'pw-vendor ' + v.status} key={v.category}>
      <span className="pw-kicker">{v.category.toUpperCase()}</span>
      <strong>{v.name || (v.status === 'none' ? 'Not chosen yet' : cap(v.category))}</strong>
      <small>{v.status === 'joined' ? 'Working in their workspace' : v.status === 'invited' ? 'Invitation sent' : 'The host can invite them from their dashboard'}</small>
    </div>)}</div>
  </section>;

  const updatesTab = <section className="pw-card pw-wide">
    <h2><Megaphone size={17} />Updates for guests</h2>
    <p className="pw-muted">Post a change once: it appears on the invitation for every guest, and the team sees it here.</p>
    <div className="pw-compose"><textarea maxLength={600} value={draft} onChange={(x) => setDraft(x.target.value)} placeholder="e.g. The ceremony moves indoors because of rain." /><button className="pw-btn" disabled={busy || !draft.trim()} onClick={post}><Send size={14} />Post update</button></div>
    {updates.map((u) => <blockquote key={u.id}><small>{when(u.when)}{u.by ? ' · ' + (u.by === 'host' ? 'Host' : 'Planner') : ''}</small>{u.text}<button className="pw-icon" aria-label="Delete update" onClick={() => removeUpdate(u)}><Trash2 size={13} /></button></blockquote>)}
  </section>;

  const initials = String(e.names || '').split(/\s*&\s*/).map((n) => n.trim()[0]).filter(Boolean).join(' & ');
  return <main className="pw" style={sceneVariables(theme)}>
    <aside className="pw-rail">
      <a className="pw-brand" href="/">MAISON<span>THE PLANNER’S ATELIER</span></a>
      {initials && <div className="pw-monogram" aria-hidden="true">{initials}</div>}
      <nav>{tabs.map(([k, l, Icon]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon size={17} /><span>{l}</span></button>)}</nav>
      {multiple && <button className="pw-link pw-all" onClick={onAll}><ArrowLeft size={13} />All events</button>}
    </aside>
    <div className="pw-main">
      <header className="pw-top"><span className="pw-kicker">{tabs.find((t) => t[0] === tab)[1].toUpperCase()}{isDemo ? ' · DEMO, NOTHING IS SAVED' : ''}</span><i aria-hidden="true">✦</i></header>
      {note && <p className="pw-warn" role="alert"><AlertTriangle size={14} />{note}</p>}
      {tab === 'overview' && overview}{tab === 'guests' && guests}{tab === 'schedule' && schedule}{tab === 'tasks' && taskList}{tab === 'team' && team}{tab === 'hall' && <HallPlan id={id} isDemo={isDemo} demoTables={demoTables} onSaved={() => api('workspace', { query: { id } }).then((d) => setData(normalize(d))).catch(() => {})} />}{tab === 'updates' && updatesTab}
    </div>
  </main>;
}
