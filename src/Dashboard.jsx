import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Compass,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Lock,
  Mail,
  MapPin,
  Plus,
  Settings2,
  Trash2,
  Users,
  CalendarHeart,
  Clock,
  Gift,
  Image as ImageIcon,
} from "lucide-react";
import { EventTabs } from "./EventTabs";
import { useCastleBackdrop } from "./useCastleBackdrop";
import { dateLabel } from "./catalog";
import { api, download } from "./client";
import { Modal } from "./ui";
import { PACKAGES, packageOf, hasJourney } from "./packages";
import { sceneFor } from "./cinemaThemes";
import { templates } from "./catalog";
import { occasionFor, worldFor, journeyProgress } from "./worlds";
import { JourneyMap } from "./RoyalHub";
import { buildTasks, groupTasks, milestones, expertFor, townOf } from "./journey";
import { DetailsPanel, LocationPanel, TimelinePanel, GiftsPanel, initials } from "./EventPanels";
import "./app.css";
import Stationery from './Stationery';
import PhotoAlbum from './PhotoAlbum';
import SeatingPlan from './SeatingPlan';

const DAY = 86400000;
function countdown(date) {
  const d = Math.round(
    (new Date(date + "T12:00:00") - new Date(new Date().toDateString() + " 12:00")) / DAY,
  );
  if (d > 1) return d + " days to go";
  if (d === 1) return "Tomorrow";
  if (d === 0) return "Today";
  return "Took place " + -d + (d === -1 ? " day ago" : " days ago");
}
const inviteLink = (i) => location.origin + "/?invite=" + i.slug;
const guestLink = (i, g) => inviteLink(i) + "&guest=" + g.token;
async function copyText(text, notify, ok) {
  try {
    await navigator.clipboard.writeText(text);
    notify(ok);
  } catch {
    notify("Clipboard unavailable. Open the link and copy its address.");
  }
}
function Cover({ content }) {
  const s = sceneFor(content);
  return (
    <div className="ws-cover">
      <img src={"/" + s.cover + "-sm.webp"} alt="" loading="lazy" />
      <span>{content.names}</span>
    </div>
  );
}
function stats(guests) {
  const replied = guests.filter((g) => g.response !== "pending");
  return {
    total: guests.length,
    replied: replied.length,
    attending: guests
      .filter((g) => g.response === "yes")
      .reduce((n, g) => n + (g.party_size || 1), 0),
    declined: guests.filter((g) => g.response === "no").length,
    waiting: guests.length - replied.length,
  };
}
function exportCsv(guests) {
  const safe = (v) =>
    '"' + String(v ?? "").replaceAll('"', '""').replace(/^[=+@-]/, "'") + '"';
  download(
    "maison-guests.csv",
    "﻿Name,Response,Party size,Note\r\n" +
      guests
        .map((g) => [g.name, g.response, g.party_size, g.note].map(safe).join(","))
        .join("\r\n"),
    "text/csv",
  );
}
const answer = (g) =>
  g.response === "yes"
    ? ["Going", "yes"]
    : g.response === "no"
      ? ["Can’t go", "no"]
      : ["No answer yet", "pending"];

export default function Dashboard({
  user,
  invites,
  focus,
  onAuth,
  onStart,
  onEdit,
  onShare,
  onPreview,
  onRefresh,
  onJourney,
  onExperts,
  notify,
  onSettings,
}) {
  const [selectedId, setSelectedId] = useState(focus?.id || null);
  const [deleteId, setDeleteId] = useState(null);
  useEffect(() => {
    if (focus) setSelectedId(focus.id || null);
  }, [focus]);
  const selected = invites.find((i) => i.id === selectedId);
  // Opening an invitation always starts at the top, with the journey map.
  useEffect(() => {
    if (selectedId) window.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedId]);

  if (!user)
    return (
      <main className="ws">
        <div className="ws-welcome">
          <div>
            <span className="lx-eyebrow">My invitations</span>
            <h1>
              A home for your
              <em>celebrations.</em>
            </h1>
            <p>
              Sign in to save your invitation, publish it and see every reply
              in one place.
            </p>
            <div className="ws-row">
              <button className="lx-btn lx-btn-solid" onClick={onAuth}>
                Sign in or create an account
              </button>
              <button className="lx-link" onClick={onStart}>
                Try the studio first <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </main>
    );

  if (selected) {
    const props = {
      invite: selected,
      onBack: () => setSelectedId(null),
      onEdit,
      onShare,
      onPreview,
      onRefresh,
      notify,
    };
    return hasJourney(selected.content) ? (
      <JourneySpace {...props} initialTab={focus?.tab} onExperts={onExperts} />
    ) : (
      <InvitationSpace {...props} />
    );
  }

  return (
    <main className="ws">
      <div className="ws-head">
        <div>
          <span className="lx-eyebrow">My invitations</span>
          <h1>Your celebrations</h1>
        </div>
        <div className="ws-row">
          <button className="ws-icon" aria-label="Account and data settings" onClick={onSettings}>
            <Settings2 size={18} strokeWidth={1.5} />
          </button>
          <button className="lx-btn lx-btn-solid ws-btn" onClick={onStart}>
            <Plus size={16} /> New invitation
          </button>
        </div>
      </div>
      {invites.length ? (
        <div className="ws-list">
          {invites.map((i) => {
            const pkg = packageOf(i.content);
            const open = () => (i.published ? setSelectedId(i.id) : onEdit(i));
            return (
              <article className="ws-card" key={i.id}>
                <button className="ws-card-art" onClick={open} aria-label={"Open " + i.content.names}>
                  <Cover content={i.content} />
                </button>
                <div className="ws-card-body">
                  <div className="ws-chips">
                    <span className={"ws-chip " + (i.published ? "live" : "")}>
                      {i.published ? "Live" : "Draft"}
                    </span>
                    <PackageButton invite={i} onRefresh={onRefresh} notify={notify} />
                  </div>
                  <h2>{i.content.names}</h2>
                  <p>
                    {dateLabel(i.content.date, i.content.language)} · {countdown(i.content.date)}
                  </p>
                  <p className="ws-next">
                    {!i.published
                      ? "Next step: finish and publish your invitation"
                      : hasJourney(i.content)
                        ? "Next step: add guests and follow their replies"
                        : "Next step: share your link and watch replies arrive"}
                  </p>
                  <div className="ws-row">
                    <button className="lx-btn lx-btn-solid ws-btn" onClick={open}>
                      {i.published ? "Open" : "Continue editing"} <ArrowRight size={15} />
                    </button>
                    <button
                      className="ws-icon"
                      aria-label={"Delete " + i.content.names}
                      onClick={() => setDeleteId(i.id)}
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="ws-empty">
          <Mail size={32} strokeWidth={1.2} />
          <h2>A blank page. A beautiful possibility.</h2>
          <p>Your invitations appear here once you save one.</p>
          <button className="lx-btn lx-btn-solid" onClick={onStart}>
            Create your first invitation <ArrowRight size={15} />
          </button>
        </div>
      )}
      {deleteId && (
        <Modal className="info-modal" onClose={() => setDeleteId(null)}>
          <h2>Delete this invitation?</h2>
          <p>This removes the invitation and all replies. Shared links stop working.</p>
          <button
            className="btn primary"
            onClick={async () => {
              try {
                await api("invitations", { method: "DELETE", data: { id: deleteId } });
                setDeleteId(null);
                await onRefresh();
                notify("Invitation and replies deleted.");
              } catch (e) {
                notify(e.message);
              }
            }}
          >
            Delete invitation
          </button>
        </Modal>
      )}
    </main>
  );
}

function useGuests(invite, notify) {
  const [guests, setGuests] = useState([]);
  useEffect(() => {
    let live = true;
    const load = () =>
      api("guests", { query: { id: invite.id } })
        .then((g) => live && setGuests(g))
        .catch((e) => live && notify(e.message));
    load();
    const timer = setInterval(() => !document.hidden && load(), 15000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [invite.id]);
  return [guests, setGuests];
}

function SpaceHeader({ invite, onBack, onEdit, onShare, onPreview, onRefresh, notify, occasion }) {
  const c = invite.content;
  return (
    <>
      <button className="lx-link ws-back" onClick={onBack}>
        <ArrowLeft size={15} /> My invitations
      </button>
      <div className="ws-hero">
        <div className="ws-hero-art">
          <Cover content={c} />
        </div>
        <div className="ws-hero-copy">
          <div className="ws-chips">
            <span className={"ws-chip " + (invite.published ? "live" : "")}>
              {invite.published ? "Live" : "Draft"}
            </span>
            {occasion && <span className="ws-chip">{occasion}</span>}
            <PackageButton invite={invite} onRefresh={onRefresh} notify={notify} />
          </div>
          <h1>{c.names}</h1>
          <p>
            {dateLabel(c.date, c.language)} · {c.venue}
          </p>
          <strong className="ws-count">{countdown(c.date)}</strong>
          <div className="ws-row">
            <button
              className="lx-btn lx-btn-solid ws-btn"
              disabled={!invite.published}
              onClick={() => onShare(invite)}
            >
              Share link <ArrowUpRight size={15} />
            </button>
            <button className="lx-btn lx-btn-line ws-btn" onClick={() => onEdit(invite)}>
              <Edit3 size={14} /> Edit
            </button>
            <button className="lx-link" onClick={() => onPreview(c)}>
              <Eye size={15} /> Preview as guest
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatTiles({ s, labels }) {
  return (
    <div className="ws-stats">
      {labels.map(([k, label]) => (
        <div key={k}>
          <strong>{s[k]}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

async function setPackage(invite, id, onRefresh, notify) {
  try {
    await api("invitations", {
      method: "POST",
      data: { id: invite.id, content: { ...invite.content, package: id }, published: invite.published },
    });
    await onRefresh();
    notify("Package changed to " + PACKAGES.find((p) => p.id === id).name + ".");
  } catch (e) {
    notify(e.message);
  }
}
function PackageButton({ invite, onRefresh, notify }) {
  const [open, setOpen] = useState(false);
  const current = packageOf(invite.content);
  return (
    <>
      <button className="ws-chip ws-chip-btn" onClick={() => setOpen(true)} aria-label="Change package">
        Package: {current.name} · Change
      </button>
      {open && (
        <Modal className="info-modal ws-pkg-modal" onClose={() => setOpen(false)}>
          <h2>Package for {invite.content.names}</h2>
          <p>Free during the preview. No payment is taken.</p>
          <div className="st-packages">
            {PACKAGES.map((p) => (
              <button
                key={p.id}
                disabled={p.soon}
                className={"st-package" + (current.id === p.id ? " selected" : "") + (p.soon ? " soon" : "")}
                onClick={async () => {
                  await setPackage(invite, p.id, onRefresh, notify);
                  setOpen(false);
                }}
              >
                <span className="st-package-top">
                  <strong>{p.name}</strong>
                  <em>{p.soon ? "Coming soon" : current.id === p.id ? "Current" : "€" + p.price}</em>
                </span>
                <span className="st-package-line">{p.tagline}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

// Package 1 · Invitation: no dashboard, just the invitation and its replies.
function InvitationSpace({ invite, onRefresh, notify, ...rest }) {
  const [guests] = useGuests(invite, notify);
  const replies = guests.filter((g) => g.response !== "pending");
  const s = stats(replies);
  return (
    <main className="ws">
      <SpaceHeader invite={invite} onRefresh={onRefresh} notify={notify} {...rest} />
      <section className="ws-panel">
        <div className="ws-guests-head">
          <div>
            <h3>Replies</h3>
            <p className="ws-muted">
              Everyone who answered through your link. Updates every 15 seconds.
            </p>
          </div>
          <button className="lx-link" onClick={() => exportCsv(replies)} disabled={!replies.length}>
            <Download size={14} /> Export CSV
          </button>
        </div>
        <StatTiles
          s={s}
          labels={[
            ["replied", "Replies"],
            ["attending", "People coming"],
            ["declined", "Can’t come"],
          ]}
        />
        {replies.length ? (
          <ul className="ws-guests">
            {replies.map((g) => {
              const [label, cls] = answer(g);
              return (
                <li key={g.id}>
                  <span className="ws-guest-name">
                    <strong>{g.name}</strong>
                    {g.note && <small>“{g.note}”</small>}
                  </span>
                  <span className={"ws-status " + cls}>{label}</span>
                  <span className="ws-party">
                    {g.response === "yes" ? g.party_size + (g.party_size > 1 ? " people" : " person") : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="ws-empty small">
            <Mail size={28} strokeWidth={1.2} />
            <p>No replies yet. Share your link to get the first one.</p>
          </div>
        )}
      </section>
      <UpgradeCard invite={invite} onRefresh={onRefresh} notify={notify} />
    </main>
  );
}

function UpgradeCard({ invite, onRefresh, notify }) {
  const j = PACKAGES.find((p) => p.id === "journey");
  const upgrade = () => setPackage(invite, "journey", onRefresh, notify);
  return (
    <section className="ws-locked">
      <Lock size={18} strokeWidth={1.4} />
      <div>
        <h3>Want to know who hasn’t answered yet?</h3>
        <ul>
          {j.features.slice(1).map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div className="ws-locked-cta">
        <button className="lx-btn lx-btn-solid ws-btn" onClick={upgrade}>
          Switch to {j.name}
        </button>
        <small>Free during the preview. No payment is taken.</small>
      </div>
    </section>
  );
}

// Package 2 · Invitation & Journey: one dashboard per invitation, like a Community journey:
// big cover photo, journey map, then Tasks · Wall · Photos · Guests.
async function resize(file, width, quality, max) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, width / img.width);
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  img.close();
  let q = quality;
  let out = c.toDataURL("image/jpeg", q);
  while (out.length > max && q > 0.3) {
    q -= 0.1;
    out = c.toDataURL("image/jpeg", q);
  }
  return out;
}
const when = (iso) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function JourneySpace({ invite, initialTab, onExperts, notify, onRefresh, onBack, onEdit, onShare, onPreview }) {
  const castleBackdrop = useCastleBackdrop();
  const fixTab = (t) => (t === "guests" ? "rsvps" : t);
  const [tab, setTab] = useState(initialTab && initialTab !== "overview" ? fixTab(initialTab) : "tasks");
  const [guests, setGuests] = useGuests(invite, notify);
  const [plan, setPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [wall, setWall] = useState(null);
  const [wallOff, setWallOff] = useState(false);
  const [experts, setExperts] = useState(0);
  const c = invite.content;
  useEffect(() => {
    if (initialTab && initialTab !== "overview") setTab(fixTab(initialTab));
  }, [initialTab]);
  useEffect(() => {
    let live = true;
    api("invitation-journey", { query: { id: invite.id } })
      .then((r) => live && setPlan(r.plan))
      .catch((e) => {
        if (live) setPlan({ done: {}, custom: [] });
        notify(e.message);
      });
    api("wall", { query: { id: invite.id } })
      .then((r) => live && setWall(r))
      .catch((e) => {
        if (!live) return;
        setWall([]);
        if (/not activated/i.test(e.message)) setWallOff(true);
        else notify(e.message);
      });
    api("shortlist")
      .then((r) => live && setExperts(r.length))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [invite.id]);
  const occasion = occasionFor(invite, templates);
  const tasks = plan
    ? buildTasks({ occasion, content: c, published: invite.published, guests, plan })
    : [];
  const s = stats(guests);
  const open = tasks.filter((t) => !t.done);
  const progress = journeyProgress({
    invitation: invite,
    guests: guests.map((g) => ({ ...g, invitation_id: invite.id })),
    savedExperts: experts,
    plan: { theme: c.worldTheme },
  });
  async function savePlan(next) {
    const before = plan;
    setPlan(next);
    setSaving(true);
    try {
      const r = await api("invitation-journey", { method: "POST", data: { id: invite.id, plan: next } });
      setPlan(r.plan);
    } catch (e) {
      setPlan(before);
      notify(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function saveContent(patch, message) {
    try {
      await api("invitations", { method: "POST", data: { id: invite.id, content: { ...invite.content, ...patch }, published: invite.published } });
      await onRefresh();
      notify(message || "Saved.");
      return true;
    } catch (e) {
      notify(e.message);
      return false;
    }
  }
  const toggle = (t) => savePlan({ ...plan, done: { ...(plan.done || {}), [t.id]: !t.done } });
  const mapAction = (i) =>
    [() => onEdit(invite), () => onShare(invite), () => onExperts(invite), () => setTab("rsvps"), () => setTab("tasks")][i]();
  const photos = (wall || []).filter((x) => x.kind === "photo");
  const tabs = [
    ["wall", "Wall"],
    ["tasks", "Tasks" + (tasks.length ? " · " + (tasks.length - open.length) + "/" + tasks.length : "")],
    ["rsvps", "RSVPs" + (s.total ? " · " + s.replied + "/" + s.total : "")],
    ["gifts", "Gift registry" + (c.gifts?.length ? " · " + c.gifts.length : "")],
    ["details", "Event details"],
    ["photos", "Photo gallery" + (photos.length ? " · " + photos.length : "")],
    ["stationery", "Matching stationery"],
    ['seating', 'Seating plan'],
  ];
  const town = townOf(c);
  const daysLeft = Math.round((new Date(c.date + "T12:00:00") - new Date(new Date().toDateString() + " 12:00")) / DAY);
  const panelProps = { content: c, onSaveContent: saveContent };
  const mapInfo = (
<div className="ev-map-info">
  <span className="ev-map-occasion">{occasion}</span>
  <h1>{c.names}</h1>
  <p>
    <CalendarHeart size={14} /> {dateLabel(c.date, c.language)} · {c.time}
  </p>
  {(c.venue || c.address) && (
    <p>
      <MapPin size={14} /> {[c.venue, town].filter(Boolean).join(", ")}
    </p>
  )}
  <strong className="ev-map-days">
    {daysLeft > 1 ? daysLeft + " days left" : daysLeft === 1 ? "Tomorrow" : daysLeft === 0 ? "Today is the day" : "A beautiful memory"}
  </strong>
</div>
  );
  return (
    <main className="ws ws-journey ev" data-world={c.worldTheme || "midnight"}>
      <button className="lx-link ws-back" onClick={onBack}>
        <ArrowLeft size={15} /> My invitations
      </button>
      <section className="ev-hero">
        <JourneyMap world={worldFor(occasion)} progress={progress} onAction={mapAction} theme={c.worldTheme || "midnight"}>
          {mapInfo}
        </JourneyMap>
        <div className="ev-actions">
          <button className="ev-icon-btn" disabled={!invite.published} onClick={() => onShare(invite)} title={invite.published ? "Share link" : "Publish first to share"}>
            <ArrowUpRight size={17} /> <span>Share link</span>
          </button>
          <button className="ev-icon-btn" onClick={() => onEdit(invite)}>
            <Edit3 size={16} /> <span>Edit design</span>
          </button>
          <button className="ev-icon-btn" onClick={() => onPreview(c)}>
            <Eye size={16} /> <span>Preview</span>
          </button>
          <span className="ev-actions-meta">
            <span className={"ws-chip " + (invite.published ? "live" : "")}>{invite.published ? "Live" : "Draft"}</span>
            <PackageButton invite={invite} onRefresh={onRefresh} notify={notify} />
          </span>
        </div>
      </section>

      <section className="ev-card" ref={castleBackdrop}>
        <div className="ev-head">
          <div>
            <h2>Manage your magical day</h2>
            <p>Everything in one place.</p>
          </div>
        </div>
        <div className="ev-stats">
          {[
            ["total", "Invited"],
            ["attending", "Going"],
            ["declined", "Can’t go"],
            ["waiting", "No answer"],
          ].map(([k, label]) => (
            <div key={k} className={"ev-stat ev-stat-" + k}>
              <strong>{s[k]}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <EventTabs tabs={tabs} value={tab} onChange={setTab} />
        <div className="ev-main">
          {tab === "wall" && <WallPanel invite={invite} wall={wall} setWall={setWall} off={wallOff} guests={guests} notify={notify} />}
          {tab === "tasks" &&
            (plan ? (
              <JourneyPanel
                tasks={tasks}
                plan={plan}
                saving={saving}
                onToggle={toggle}
                onSave={savePlan}
                occasion={occasion}
                town={town}
                onFind={(category) => onExperts(invite, { category, city: town })}
              />
            ) : (
              <p className="ws-muted">Loading your journey…</p>
            ))}
          {tab === "rsvps" && (
<GuestsPanel invite={invite} guests={guests} setGuests={setGuests} notify={notify} />
          )}
          {tab === "gifts" && <GiftsPanel key={invite.updated_at} {...panelProps} />}
          {tab === "details" && (
            <div className="ev-details-stack">
              <DetailsPanel key={"d" + invite.updated_at} {...panelProps} />
              <LocationPanel key={"l" + invite.updated_at} {...panelProps} />
              <TimelinePanel key={"t" + invite.updated_at} {...panelProps} />
            </div>
          )}
          {tab === "photos" && <PhotosPanel invite={invite} photos={photos} setWall={setWall} off={wallOff} notify={notify} onSaveContent={saveContent}/>}
          {tab === 'stationery' && <Stationery content={c} guests={guests} onSaveContent={saveContent}/>}
          {tab === 'seating' && <SeatingPlan invite={invite} guests={guests} notify={notify}/>}
        </div>
        <button className="ev-experts-link" onClick={() => onExperts(invite, { city: town })}>
          <Compass size={15} /> Find venues & experts{town ? " in " + town : ""} <ArrowRight size={14} />
        </button>
      </section>
    </main>
  );
}

function WallOff() {
  return (
    <div className="ws-notice" role="status">
      Wall and photos need a one-time database setup: open Supabase → SQL Editor,
      paste the file <code>database/wall.sql</code> from your Maison folder and run it.
    </div>
  );
}

function WallPanel({ invite, wall, setWall, off, guests, notify }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  if (off) return <section className="ws-panel"><WallOff /></section>;
  async function post(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const data = { invitation_id: invite.id, kind: "post", body: text };
      if (file) {
        data.thumb = await resize(file, 480, 0.72, 110000);
        data.image = await resize(file, 1400, 0.78, 880000);
      }
      const row = await api("wall", { method: "POST", data });
      setWall((w) => [row, ...(w || [])]);
      setText("");
      setFile(null);
      e.target.reset();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }
  // Posts mixed with what happened: replies from guests.
  const activity = guests
    .filter((g) => g.response !== "pending" && g.responded_at)
    .map((g) => ({
      id: "a-" + g.id,
      activity: true,
      created_at: g.responded_at,
      body: g.response === "yes"
        ? `${g.name} is coming${g.party_size > 1 ? " with " + (g.party_size - 1) + " more" : ""}`
        : `${g.name} can’t come`,
      note: g.note,
    }));
  const feed = [...(wall || []).filter((x) => x.kind === "post"), ...activity].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at)),
  );
  return (
    <section className="ws-panel">
      <form className="ws-compose" onSubmit={post}>
        <textarea
          rows={3}
          maxLength={2000}
          placeholder="Write a note, an idea or an update…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="ws-row">
          <label className="lx-link ws-file">
            <Plus size={14} /> {file ? file.name : "Add a photo"}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} />
          </label>
          <button className="lx-btn lx-btn-solid ws-btn" disabled={busy || (!text.trim() && !file)}>
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
      {wall === null ? (
        <p className="ws-muted">Loading…</p>
      ) : feed.length ? (
        <ul className="ws-feed">
          {feed.map((x) => (
            <li key={x.id} className={x.activity ? "activity" : ""}>
              <div className="ws-feed-meta">
                <span>{x.activity ? "Guest reply" : "You"}</span>
                <time>{when(x.created_at)}</time>
              </div>
              <p>{x.body}</p>
              {x.note && <p className="ws-muted">“{x.note}”</p>}
              {x.thumb && <img src={x.thumb} alt="" loading="lazy" />}
              {!x.activity && (
                <button
                  className="ws-icon ws-feed-del"
                  aria-label="Delete post"
                  onClick={async () => {
                    try {
                      await api("wall", { method: "DELETE", data: { id: x.id } });
                      setWall((w) => w.filter((y) => y.id !== x.id));
                    } catch (err) {
                      notify(err.message);
                    }
                  }}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="ws-empty small">
          <Mail size={28} strokeWidth={1.2} />
          <p>Your wall is empty. Guest replies will appear here too.</p>
        </div>
      )}
    </section>
  );
}

function PhotosPanel({ invite, photos, setWall, off, notify, onSaveContent }) {
  const [busy, setBusy] = useState(0);
  const [view, setView] = useState(null);
  const [mode,setMode]=useState('album');
  if (off) return <section className="ws-panel"><WallOff /></section>;
  async function upload(files) {
    for (const f of Array.from(files).slice(0, 12)) {
      setBusy((n) => n + 1);
      try {
        const data = {
          invitation_id: invite.id,
          kind: "photo",
          thumb: await resize(f, 480, 0.72, 110000),
          image: await resize(f, 1400, 0.78, 880000),
        };
        const row = await api("wall", { method: "POST", data });
        setWall((w) => [row, ...(w || [])]);
      } catch (err) {
        notify(err.message);
      } finally {
        setBusy((n) => n - 1);
      }
    }
  }
  async function openPhoto(p) {
    setView({ ...p, image: null });
    try {
      const r = await api("wall", { query: { photo: p.id } });
      setView({ ...p, image: r.image });
    } catch (err) {
      notify(err.message);
    }
  }
  return (
    <section className="ws-panel">
      <div className="ws-guests-head">
        <div>
          <h3>Photos</h3>
          <p className="ws-muted">Mood pictures, venue shots, memories — all in one gallery.</p>
        </div>
        <label className="lx-btn lx-btn-solid ws-btn ws-file">
          <Plus size={15} /> {busy ? "Uploading…" : "Add photos"}
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      <div className="photo-view-toggle" aria-label="Photo display"><button aria-pressed={mode==='album'} onClick={()=>setMode('album')}>Magical album</button><button aria-pressed={mode==='gallery'} onClick={()=>setMode('gallery')}>Photo gallery</button></div>
      {mode==='album' ? <PhotoAlbum photos={photos} title={invite.content.names} design={invite.content.albumStyle||'ivory'} onDesign={value=>onSaveContent({albumStyle:value},'Album design saved.')} loadPhoto={p=>api('wall',{query:{photo:p.id}}).then(d=>d.image)}/> : photos.length ? (
        <div className="ws-photos">
          {photos.map((p) => (
            <figure key={p.id}>
              <button onClick={() => openPhoto(p)} aria-label="Open photo">
                <img src={p.thumb} alt="" loading="lazy" />
              </button>
            </figure>
          ))}
        </div>
      ) : (
        <div className="ws-empty small">
          <Eye size={28} strokeWidth={1.2} />
          <p>No photos yet.</p>
        </div>
      )}
      {view && (
        <Modal className="info-modal ws-lightbox" onClose={() => setView(null)}>
          {view.image ? <img src={view.image} alt="" /> : <p className="ws-muted">Loading…</p>}
          <div className="ws-row">
            <button
              className="ws-icon"
              aria-label="Delete photo"
              onClick={async () => {
                try {
                  await api("wall", { method: "DELETE", data: { id: view.id } });
                  setWall((w) => w.filter((y) => y.id !== view.id));
                  setView(null);
                } catch (err) {
                  notify(err.message);
                }
              }}
            >
              <Trash2 size={15} strokeWidth={1.5} />
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

const FIND_LABEL = {
  Venues: "venues", Planners: "planners", Catering: "caterers", Flowers: "florists", Photography: "photographers",
  "Bridal shops": "bridal shops", "Music & entertainment": "music & DJs", Cakes: "cake makers", Beauty: "hair & make-up",
  Decoration: "decoration", "Family activities": "activities",
};
function JourneyPanel({ tasks, plan, saving, disabled = false, onToggle, onSave, occasion, town, onFind }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const g = groupTasks(tasks);
  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const groups = [
    ["overdue", "Overdue"],
    ["soon", "Next 30 days"],
    ["later", "Later"],
    ["done", "Done"],
  ];
  function add(e) {
    e.preventDefault();
    if (!title.trim() || !due) return;
    const id = "c-" + Math.random().toString(36).slice(2, 10);
    onSave({ ...plan, custom: [...(plan.custom || []), { id, title: title.trim(), due }] });
    setTitle("");
    setDue("");
  }
  return (
    <section className="ws-panel">
      <div className="ws-journey-head">
        <h3>Your {occasion.toLowerCase()} journey</h3>
        <p className="ws-muted">
          Every task is dated back from your day. Maison ticks its own steps
          (publishing, guests, replies) automatically; tick the rest yourself.
        </p>
      </div>
      <div className="ws-progress">
        <div>
          <strong>{pct}%</strong>
          <span>
            {done} of {tasks.length} tasks done{saving ? " · saving…" : ""}
          </span>
        </div>
        <div className="ws-bar" aria-hidden="true">
          <span style={{ width: pct + "%" }} />
        </div>
      </div>
      {groups.map(([key, label]) =>
        g[key].length ? (
          <div className={"ws-group " + key} key={key}>
            <h3>
              {label} <span>{g[key].length}</span>
            </h3>
            <ul className="ws-tasks">
              {g[key].map((t) => (
                <li key={t.id} className={t.done ? "done" : ""}>
                  <label>
                    <input
                      type="checkbox"
                      checked={t.done}
                      disabled={t.auto || disabled}
                      onChange={() => onToggle(t)}
                    />
                    <span>
                      <strong>{t.title}</strong>
                      {t.text && <small>{t.text}</small>}
                      {t.auto && <small className="ws-auto">Ticks itself in Maison</small>}
                    </span>
                  </label>
                  <time dateTime={t.due}>{dateLabel(t.due, "en")}</time>
                  {onFind && !t.done && expertFor(t) && (
                    <button className="ws-find" onClick={() => onFind(expertFor(t))}>
                      <Compass size={13} /> Find {FIND_LABEL[expertFor(t)] || expertFor(t).toLowerCase()}{town ? " in " + town : ""}
                    </button>
                  )}
                  {t.own && !disabled && (
                    <button
                      className="ws-icon"
                      aria-label={"Remove " + t.title}
                      onClick={() =>
                        onSave({
                          ...plan,
                          custom: plan.custom.filter((x) => x.id !== t.id),
                        })
                      }
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      {!disabled && (
        <form className="ws-add" onSubmit={add}>
          <input
            aria-label="New task"
            placeholder="Add your own task…"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            aria-label="Due date"
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <button className="lx-btn lx-btn-solid ws-btn" disabled={!title.trim() || !due}>
            <Plus size={15} /> Add
          </button>
        </form>
      )}
    </section>
  );
}

function GuestsPanel({ invite, guests, setGuests, notify }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [remove, setRemove] = useState(null);
  const [sharing, setSharing] = useState(null);
  async function setAccess(g, enabled) {
    setSharing(g.id);
    try {
      const updated = await api('guest-dashboard-access', { method:'POST', data:{id:g.id,enabled} });
      setGuests(rows=>rows.map(row=>row.id===g.id?updated:row));
      notify(enabled ? 'Read-only dashboard access enabled for '+g.name+'.' : 'Dashboard access revoked for '+g.name+'.');
    } catch(e) { notify(e.message); } finally { setSharing(null); }
  }
  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const g = await api("guests", {
        method: "POST",
        data: { invitation_id: invite.id, name },
      });
      setGuests((v) => [g, ...v]);
      setName("");
      await copyText(guestLink(invite, g), notify, "Guest added. Their personal link is copied.");
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ws-panel">
      <div className="ws-guests-head">
        <div>
          <h3>Guests & replies</h3>
          <p className="ws-muted">
            Add a guest or family. Their personal link is copied straight away,
            ready to paste into WhatsApp, email or a text.
          </p>
        </div>
        <button className="lx-link" onClick={() => exportCsv(guests)} disabled={!guests.length}>
          <Download size={14} /> Export CSV
        </button>
      </div>
      <form className="ws-add" onSubmit={add}>
        <input
          aria-label="Guest name"
          placeholder="e.g. Sophie & James"
          value={name}
          maxLength={120}
          required
          onChange={(e) => setName(e.target.value)}
        />
        <button className="lx-btn lx-btn-solid ws-btn" disabled={busy}>
          <Plus size={15} /> Add & copy link
        </button>
      </form>
      <div className="maison-access-help"><strong><Lock size={14}/> You choose who joins your celebration space.</strong>Enable sharing for individual guests below. They can view the programme, RSVP totals, their own table, planning progress and memories, and contribute photos and wishes. They cannot change your plans or see private guest replies. Their personal link grants access, so ask them to keep it private. Uncheck to revoke access.</div>
      {guests.length ? (
        <ul className="ws-guests">
          {guests.map((g) => {
            const [label, cls] = answer(g);
            return (
              <li key={g.id}>
                <span className="ev-avatar" aria-hidden="true">{initials(g.name)}</span>
                <span className="ws-guest-name">
                  <strong>{g.name}</strong>
                  {g.note && <small>“{g.note}”</small>}
                </span>
                <span className={"ws-status " + cls}>{label}</span>
                <span className="ws-party">
                  {g.response === "yes" ? g.party_size + (g.party_size > 1 ? " people" : " person") : ""}
                </span>
                <span className="ws-actions">
                  <label className="maison-access"><input type="checkbox" checked={!!g.dashboard_access} disabled={sharing===g.id} onChange={e=>setAccess(g,e.target.checked)} aria-label={'Share dashboard with '+g.name}/>Share dashboard</label>
                  {g.dashboard_access && <button className="ws-icon" aria-label={'Copy shared dashboard for '+g.name} onClick={()=>copyText(location.origin+'/?shared='+invite.slug+'&guest='+g.token,notify,'Private dashboard link copied.')}><Lock size={15}/></button>}
                  <button
                    className="ws-icon"
                    aria-label={"Copy link for " + g.name}
                    onClick={() => copyText(guestLink(invite, g), notify, "Personal link copied.")}
                  >
                    <Copy size={15} strokeWidth={1.5} />
                  </button>
                  <a
                    className="ws-icon"
                    aria-label={"Open invitation for " + g.name}
                    href={guestLink(invite, g)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={15} strokeWidth={1.5} />
                  </a>
                  <button className="ws-icon" aria-label={"Delete " + g.name} onClick={() => setRemove(g)}>
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="ws-empty small">
          <Users size={28} strokeWidth={1.2} />
          <p>Every good party starts with a guest.</p>
        </div>
      )}
      {remove && (
        <Modal className="info-modal" onClose={() => setRemove(null)}>
          <h2>Delete this guest?</h2>
          <p>
            This removes {remove.name} and their reply. Their personal link
            stops working.
          </p>
          <button
            className="btn primary"
            onClick={async () => {
              try {
                await api("guests", { method: "DELETE", data: { id: remove.id } });
                setGuests((v) => v.filter((x) => x.id !== remove.id));
                setRemove(null);
                notify("Guest deleted.");
              } catch (err) {
                notify(err.message);
              }
            }}
          >
            Delete guest
          </button>
        </Modal>
      )}
    </section>
  );
}
