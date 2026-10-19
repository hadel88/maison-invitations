import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
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
import { templates, occasions, defaultEvent, copy, dateLabel } from "./catalog";
import { api, download, calendar } from "./client";
import "./style.css";
import "./luxe.css";
import "./royal.css";
import "./app.css";
import { occasionFor } from "./worlds";
import { CinemaCollection } from "./Cinema";
import { RoyalHero, ExpertsPage } from "./RoyalHub";
import { HomeOccasions } from './HomeOccasions';
import { cinemaThemes, cinemaEvent } from "./cinemaThemes";
import { InviteArt, Modal, Field } from "./ui";
import HomeSections from "./Home";
import { hasJourney } from "./packages";
import "./maison.css";

// Screens that are not needed for the first view load on demand.
const AuthDialog = lazy(() => import("./AuthDialog"));
const Editor = lazy(() => import("./Editor"));
const Dashboard = lazy(() => import("./Dashboard"));
const SharedDashboard = lazy(() => import("./SharedCelebration"));
const AlbumPreview = lazy(() => import('./AlbumPreview'));
const ExpertSpace = lazy(() => import("./ExpertSpace"));
const ShareDialog = lazy(() => import("./Dialogs").then((m) => ({ default: m.ShareDialog })));
const InfoDialog = lazy(() => import("./Dialogs").then((m) => ({ default: m.InfoDialog })));
const GuestPage = lazy(() => import("./Guest"));
const GuestExperience = lazy(() => import("./Guest").then((m) => ({ default: m.GuestExperience })));
const BeachDemo = lazy(() => import("./BeachDemo"));
const BeachDemoPreview = lazy(() => import("./BeachDemo").then(m => ({ default: m.BeachDemoPreview })));
function Loading() {
  return <div className="lx-loading" role="status" aria-label="Loading"><span /></div>;
}
const firstEvent = () => cinemaEvent(cinemaThemes.find(t => t.id === 'rose-garden'), defaultEvent(templates[0]));

function App() {
  const [lang, setLang] = useState(
    () => localStorage.getItem("maison-language") || "en",
  );
  const c = copy[lang] || copy.en;
  const [filter, setFilter] = useState("All designs");
  const [worldOccasion,setWorldOccasion]=useState(()=>localStorage.getItem("maison-occasion")||"Wedding");
  const [worldTheme,setWorldTheme]=useState(()=>localStorage.getItem("maison-world-theme")||"midnight");
  const [focus, setFocus] = useState(null);
  useEffect(()=>{document.documentElement.dataset.world=worldTheme;localStorage.setItem("maison-world-theme",worldTheme)},[worldTheme]);
  useEffect(()=>{localStorage.setItem("maison-occasion",worldOccasion)},[worldOccasion]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("curated");
  const [favs, setFavs] = useState(() =>
    JSON.parse(localStorage.getItem("maison-favourites") || "[]"),
  );
  const [favOnly, setFavOnly] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState(() => { const v = new URLSearchParams(location.search).get("view"); return ["cinema", "gallery", "experts", "dashboard"].includes(v) ? v : "cinema"; });
  const [editor, setEditor] = useState(null);
  const [spaceTab, setSpaceTab] = useState("listing");
  const [experience, setExperience] = useState(null);
  const [beachPreview, setBeachPreview] = useState(false);
  const [auth, setAuth] = useState(false);
  const [info, setInfo] = useState(null);
  const [share, setShare] = useState(null);
  const [toast, setToast] = useState("");
  const [invites, setInvites] = useState([]);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [health, setHealth] = useState({ payments: false });
  const [scrolled, setScrolled] = useState(false);
  const q = new URLSearchParams(location.search);
  // Home anchors (designs, how it works, packages, FAQ) live on the home view.
  function go(id) {
    setView("cinema");
    setMenu(false);
    setTimeout(() => {
      if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
      else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 30);
  }
  function show(v) {
    setView(v);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    // Gentle reveal on scroll; content stays visible without JS or with reduced motion.
    const els = Array.from(document.querySelectorAll(".lx-main .reveal"));
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    document.documentElement.classList.add("lx-reveal-on");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [view]);
  const publicSlug = q.get("invite");
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("maison-language", lang);
  }, [lang]);
  useEffect(() => {
    api("session")
      .then((d) => setUser(d.user))
      .catch(() => {});
    api("health")
      .then(setHealth)
      .catch(() => {});
    if (q.has("experience")) setExperience(defaultEvent());
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (user) loadInvites();
  }, [user]);
  async function loadInvites() {
    try {
      setInvites(await api("invitations"));
    } catch (e) {
      setToast(e.message);
    }
  }
  // One entry into the studio: which invitation, which step, which package.
  function studio(content, step = "details", pkg) {
    setEditor({
      content: {
        language: lang,
        worldTheme,
        ...content,
        ...(pkg ? { package: pkg } : {}),
      },
      step,
    });
  }
  function start(t) {
    // Classic designs open in the first signature invitation; drafts on this device are restored.
    let draft;
    try { draft = JSON.parse(localStorage.getItem("maison-preview-draft:" + t.id)); } catch {}
    if (draft) setEditor({ ...draft, step: "details" });
    else studio(cinemaEvent(cinemaThemes[0], defaultEvent(t)), "design");
  }
  function favorite(id) {
    setFavs((old) => {
      const n = old.includes(id) ? old.filter((x) => x !== id) : [...old, id];
      localStorage.setItem("maison-favourites", JSON.stringify(n));
      return n;
    });
  }
  async function save(record, published = false, shareAfterPublish = false) {
    if (!user) {
      if (published) {
        setAuth(true);
        throw new Error("Sign in to publish. Your invitation stays open.");
      }
      const draft = { content: record.content, published: false };
      localStorage.setItem("maison-preview-draft:" + record.content.template, JSON.stringify(draft));
      setEditor({ ...draft, step: record.step });
      setToast("Draft saved on this device. Sign in to publish it.");
      return draft;
    }
    const r = await api("invitations", {
      method: "POST",
      data: { ...record, published },
    });
    await loadInvites();
    if (shareAfterPublish) {
      // Published: leave the studio, open the invitation space, offer sharing.
      setEditor(null);
      setView("dashboard");
      setFocus({ id: r.id, tab: "overview", at: Date.now() });
      setShare(r);
      setToast("Your invitation is live. Time to make someone’s day.");
    } else {
      setEditor({ ...r, step: record.step });
      setToast("Saved to your account.");
    }
    return r;
  }
  const filtered = templates
    .filter(
      (t) =>
        (filter === "All designs" || t.occasion === filter) &&
        (!favOnly || favs.includes(t.id)) &&
        `${t.name} ${t.occasion} ${t.style}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "price"
        ? a.price - b.price
        : sort === "new"
          ? Number(!!b.badge) - Number(!!a.badge)
          : 0,
    );
  const demoScene = cinemaThemes.find((t) => t.id === q.get("cinema"));
  if (demoScene)
    return (
      <Suspense fallback={<Loading />}>
        <GuestExperience
          event={cinemaEvent(demoScene, defaultEvent(templates.find((t) => t.occasion === demoScene.occasion) || templates[0]))}
          preview
        />
      </Suspense>
    );
  if (q.get('album')==='preview') return <Suspense fallback={<Loading/>}><AlbumPreview/></Suspense>;
  if (q.get('shared')) return <Suspense fallback={<Loading/>}><SharedDashboard slug={q.get('shared')} token={q.get('guest')}/></Suspense>;
  if (publicSlug)
    return (
      <Suspense fallback={<Loading />}>
        <GuestPage slug={publicSlug} token={q.get("guest")} initialLang={lang} />
      </Suspense>
    );
  // "My invitations" always lands on the list, even from inside an invitation.
  const openMine = () => {
    setFocus({ id: null, at: Date.now() });
    show("dashboard");
  };
  // From a dashboard task: open Venues & Experts with the right category and town already searched.
  const [expertsPreset, setExpertsPreset] = useState(null);
  const openExperts = (invitation, preset) => {
    if (invitation) setWorldOccasion(occasionFor(invitation, templates));
    setExpertsPreset(preset && (preset.category || preset.city) ? { ...preset, at: Date.now() } : null);
    show("experts");
  };
  const NAV = [
    ["designs", "Designs"],
    ["how", "How it works"],
    ["packages", "Packages"],
    ["faq", "FAQ"],
  ];
  return (
    <>
      <div className="lx-announcement">
        <span>Free during the preview</span>
        <i aria-hidden="true">◆</i>
        <span>Printed invitations coming soon</span>
      </div>
      <header className={"lx-header" + (scrolled ? " is-scrolled" : "")}>
        <nav className={menu ? "mobile-open" : ""} aria-label="Main">
          {NAV.map(([id, label]) => (
            <button key={id} className={view === "cinema" && id === "designs" ? "active" : ""} onClick={() => go(id)}>
              {label}
            </button>
          ))}
          <button className={view === "experts" ? "active" : ""} onClick={() => show("experts")}>
            Venues & Experts
          </button>
          <button className="lx-nav-mobile-only" onClick={openMine}>
            {c.dashboard}
          </button>
          {!user && (
            <button
              className="lx-nav-mobile-only"
              onClick={() => {
                setMenu(false);
                setAuth(true);
              }}
            >
              Sign in
            </button>
          )}
          <button
            className="lx-nav-mobile-only"
            onClick={() => {
              setMenu(false);
              studio(firstEvent(), "design");
            }}
          >
            {c.start}
          </button>
        </nav>
        <a className="lx-brand" href="/" aria-label="Maison home">
          <span className="lx-brand-word">Maison</span>
          <span className="lx-brand-tag">A world for every celebration</span>
        </a>
        <div className="lx-header-actions">
          <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="fr">FR</option>
          </select>
          <button className={"lx-my" + (view === "dashboard" ? " active" : "")} onClick={openMine}>
            {c.dashboard}
          </button>
          {!user && (
            <button className="lx-my lx-signin" onClick={() => setAuth(true)}>
              Sign in
            </button>
          )}
          <button className="lx-btn lx-btn-solid lx-header-create" onClick={() => studio(firstEvent(), "design")}>
            {c.start}
          </button>
          <button
            className="lx-menu"
            onClick={() => setMenu(!menu)}
            aria-label="Toggle navigation"
            aria-expanded={menu}
          >
            {menu ? <X size={20} strokeWidth={1.4} /> : <Menu size={20} strokeWidth={1.4} />}
          </button>
        </div>
      </header>
      <Suspense fallback={<Loading />}>
        {view === "cinema" ? (
          <>
            <RoyalHero
              heroOnly
              occasion={worldOccasion}
              onOccasion={setWorldOccasion}
              theme={worldTheme}
              onTheme={setWorldTheme}
              lang={lang}
              onCreate={() => studio(firstEvent(), "design")}
              onWorld={() => go('designs')}
              onExperts={() => show('experts')}
              onExperience={() => setExperience({ ...firstEvent(), worldTheme })}
            />
            <HomeOccasions lang={lang} onSelect={occasion=>{if(occasion!=='All designs')setWorldOccasion(occasion);setFilter(occasion);setSearch('');setFavOnly(false);show('gallery')}}/>
            <div id="designs" />
            <CinemaCollection
              onBeachDemo={() => setBeachPreview(true)}
              onPreview={setExperience}
              onCreate={(event) => studio(event, "details")}
              notify={setToast}
            />
            <HomeSections
              onStart={(pkg) => studio(firstEvent(), "design", pkg)}
            />
          </>
        ) : view === "experts" ? (
          <ExpertsPage
            user={user}
            occasion={worldOccasion}
            onOccasion={setWorldOccasion}
            onAuth={() => setAuth(true)}
            onUseVenue={(place) => {
              const invitation = invites.find((i) => occasionFor(i, templates) === worldOccasion);
              const venue = { venue: place.name, address: (place.address || place.city || "").replace(place.name + ", ", "") };
              if (invitation) setEditor({ ...invitation, content: { ...invitation.content, ...venue }, step: "details" });
              else studio({ ...firstEvent(), ...venue }, "details");
            }}
            preset={expertsPreset}
            onSpace={(tab) => {
              setSpaceTab(tab);
              show("expert-space");
              if (!user) setAuth(true);
            }}
            notify={setToast}
            Modal={Modal}
            lang={lang}
          />
        ) : view === "expert-space" ? (
          user ? (
            <Suspense fallback={<Loading />}>
              <ExpertSpace key={spaceTab} user={user} tab={spaceTab} onBack={() => show("experts")} notify={setToast} />
            </Suspense>
          ) : (
            <main className="es-page">
              <div className="es-head">
                <span className="royal-eyebrow dark">FOR VENUES & EXPERTS</span>
                <h1>Your Maison business space</h1>
                <p>Sign in or create a free account to add your business and answer quote requests.</p>
                <div className="es-actions">
                  <button className="royal-btn ink" onClick={() => setAuth(true)}>Sign in or create account</button>
                  <button className="royal-text" onClick={() => show("experts")}>Back to Venues & Experts</button>
                </div>
              </div>
            </main>
          )
        ) : view === "gallery" ? (
          <main className="lx-main">
          <section id="collection" className="lx-section lx-collection">
            <div className="lx-head reveal">
              <span className="lx-eyebrow">Classic designs</span>
              <h2>{c.title}</h2>
              <p>
                Stationery-style designs for every occasion. When you
                personalise one, your guests open it in a signature invitation.
              </p>
            </div>
            <div className="lx-filters">
              <div className="lx-tabs" role="tablist" aria-label="Occasions">
                {occasions.map((o, i) => (
                  <button
                    role="tab"
                    aria-selected={filter === o}
                    className={filter === o ? "selected" : ""}
                    onClick={() => setFilter(o)}
                    key={o}
                  >
                    {i === 0 ? c.all : o}
                  </button>
                ))}
              </div>
              <div className="lx-tools">
                <label className="lx-search">
                  <Search size={15} strokeWidth={1.5} />
                  <input
                    placeholder={c.search}
                    aria-label="Search designs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button
                  className={"lx-fav" + (favOnly ? " hearted" : "")}
                  onClick={() => setFavOnly(!favOnly)}
                  aria-label="Show saved designs"
                  aria-pressed={favOnly}
                >
                  <Heart size={15} strokeWidth={1.5} fill={favOnly ? "currentColor" : "none"} />
                  <span>Saved</span>
                </button>
                <select
                  aria-label="Sort designs"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="curated">Curated for you</option>
                  <option value="price">Price: low to high</option>
                  <option value="new">Featured first</option>
                </select>
              </div>
            </div>
            <div className="lx-grid">
              {filtered.map((t) => (
                <article className="lx-card" key={t.id}>
                  <div className={"lx-card-canvas canvas-" + t.theme}>
                    <button
                      className="lx-card-art"
                      onClick={() => setExperience(defaultEvent(t))}
                      aria-label={"Preview " + t.name}
                    >
                      <InviteArt template={t} small />
                    </button>
                    {t.badge && <span className="lx-badge">{t.badge}</span>}
                    <button
                      aria-label={"Save " + t.name}
                      aria-pressed={favs.includes(t.id)}
                      className={"lx-save" + (favs.includes(t.id) ? " hearted" : "")}
                      onClick={() => favorite(t.id)}
                    >
                      <Heart
                        size={15}
                        strokeWidth={1.5}
                        fill={favs.includes(t.id) ? "currentColor" : "none"}
                      />
                    </button>
                    <div className="lx-card-actions">
                      <button onClick={() => setExperience(defaultEvent(t))}>
                        <Eye size={14} strokeWidth={1.5} />
                        {c.preview}
                      </button>
                      <button className="solid" onClick={() => start(t)}>
                        {c.customise}
                      </button>
                    </div>
                  </div>
                  <div className="lx-card-meta">
                    <div>
                      <span className="lx-card-kind">
                        {t.occasion} · {t.style.split(" · ")[0]}
                      </span>
                      <h3>{t.name}</h3>
                    </div>
                    <button
                      className="lx-card-price"
                      onClick={() => start(t)}
                      aria-label={"Personalise " + t.name}
                    >
                      {c.customise}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="lx-empty">
                <h3>No designs here just yet.</h3>
                <p>Try another search, or save a design you love.</p>
                <button
                  className="lx-btn lx-btn-line"
                  onClick={() => {
                    setSearch("");
                    setFavOnly(false);
                    setFilter("All designs");
                  }}
                >
                  Explore all designs
                </button>
              </div>
            )}
            <p className="lx-collection-note">
              <Check size={14} strokeWidth={1.5} /> Prefer the full experience?{" "}
              <button className="lx-inline" onClick={() => go("designs")}>
                See the signature invitations
              </button>
            </p>
          </section>
          </main>
        ) : (
          <Dashboard
            focus={focus}
            user={user}
            invites={invites}
            onAuth={() => setAuth(true)}
            onStart={() => studio(firstEvent(), "design")}
            onEdit={(i) => setEditor({ ...i, step: "details" })}
            onShare={setShare}
            onPreview={setExperience}
            onRefresh={loadInvites}
            onExperts={openExperts}
            notify={setToast}
            onSettings={() => setInfo("settings")}
          />
        )}
      </Suspense>
      <footer className="lx-footer">
        <div className="lx-footer-top">
          <a className="lx-brand" href="/">
            <span className="lx-brand-word">Maison</span>
            <span className="lx-brand-tag">{c.made}</span>
          </a>
          <p>A thoughtful way to bring people together.</p>
        </div>
        <div className="lx-footer-links">
          <button onClick={() => go("designs")}>Signature designs</button>
          <button onClick={() => show("gallery")}>Classic designs</button>
          <button onClick={() => go("packages")}>Packages</button>
          <button onClick={() => show("experts")}>Venues & experts</button>
          <button onClick={() => setInfo("help")}>Help</button>
          <button onClick={() => setInfo("privacy")}>Privacy</button>
          <button onClick={() => setInfo("terms")}>Terms</button>
          {user ? (
            <button
              onClick={async () => {
                await api("logout", { method: "POST", data: {} });
                setUser(null);
                setInvites([]);
                setToast("Signed out");
              }}
            >
              Sign out
            </button>
          ) : (
            <button onClick={() => setAuth(true)}>Sign in</button>
          )}
        </div>
        <div className="lx-footer-bottom">
          <span>
            <Globe size={13} strokeWidth={1.5} /> Crafted for celebrations in Europe
          </span>
          <span>Preview edition</span>
        </div>
      </footer>
      <Suspense fallback={<Loading />}>
        {editor && (
          <Editor
            record={editor}
            user={user}
            onClose={() => setEditor(null)}
            onSave={save}
            onPreview={setExperience}
            notify={setToast}
          />
        )}
        {beachPreview && <BeachDemoPreview onClose={() => setBeachPreview(false)} />}
        {experience && (
          <Modal className="experience-modal" onClose={() => setExperience(null)}>
            <GuestExperience
              event={experience}
              preview
              onEdit={() => {
                setExperience(null);
                studio(experience, "details");
              }}
            />
          </Modal>
        )}
        {auth && (
          <AuthDialog
            Modal={Modal}
            Field={Field}
            onClose={() => setAuth(false)}
            onSuccess={(u) => {
              setUser(u);
              setAuth(false);
              setToast("Welcome to Maison. Your next beautiful moment starts here.");
            }}
          />
        )}
        {share && (
          <ShareDialog
            record={share}
            onClose={() => setShare(null)}
            notify={setToast}
            onGuests={
              hasJourney(share.content)
                ? () => {
                    setShare(null);
                    setFocus({ id: share.id, tab: "guests", at: Date.now() });
                    show("dashboard");
                  }
                : null
            }
          />
        )}
        {info && (
          <InfoDialog
            type={info}
            onClose={() => setInfo(null)}
            user={user}
            notify={setToast}
            onDataDeleted={() => {
              localStorage.removeItem("maison-draft");
              setInvites([]);
              setInfo(null);
            }}
          />
        )}
      </Suspense>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button aria-label="Dismiss notification" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );

}
createRoot(document.getElementById("root")).render(new URLSearchParams(location.search).get("demo") === "beach-sunset-romance" ? <Suspense fallback={<Loading />}><BeachDemo /></Suspense> : <App />);
