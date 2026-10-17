import React, { useState, useEffect, useRef } from "react";
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
import { RoyalHero, RoyalJourney, ExpertsPage } from "./RoyalHub";
import { occasionFor, worldThemes } from "./worlds";
import AuthDialog from "./AuthDialog";
import { CinemaStage, CinemaCollection } from "./Cinema";
import { cinemaThemes, sceneFor, cinemaEvent } from "./cinemaThemes";

function Botanical({ kind = "olive", className = "" }) {
  return (
    <svg
      className={"botanical " + className}
      viewBox="0 0 240 260"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.4">
        <path d="M115 250C124 193 138 159 127 110C122 88 109 53 94 22M129 161C156 145 177 116 190 64M125 127C96 115 72 88 53 51M125 202C90 183 62 163 41 134" />
        {[
          [103, 51, -35],
          [113, 78, -30],
          [124, 109, -20],
          [129, 147, 15],
          [122, 188, 20],
          [166, 114, 35],
          [182, 82, 30],
          [83, 87, -55],
          [62, 64, -60],
          [82, 166, -55],
          [57, 148, -65],
          [147, 152, 50],
          [106, 180, -55],
        ].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse
              rx="8"
              ry="20"
              fill="currentColor"
              fillOpacity=".5"
              stroke="none"
            />
            <path d="M0 15V-13" strokeOpacity=".6" />
          </g>
        ))}
      </g>
      {kind === "citrus" ? (
        <g fill="#e8b34e">
          <ellipse
            cx="82"
            cy="125"
            rx="19"
            ry="25"
            transform="rotate(-25 82 125)"
          />
          <ellipse
            cx="159"
            cy="176"
            rx="19"
            ry="25"
            transform="rotate(20 159 176)"
          />
        </g>
      ) : null}
      {["rose", "garden"].includes(kind) ? (
        <g fill={kind === "rose" ? "#b86d77" : "#c18e9a"}>
          {[
            [100, 100],
            [157, 164],
            [65, 154],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <ellipse
                  key={a}
                  rx="10"
                  ry="17"
                  transform={`rotate(${a}) translate(0 -10)`}
                />
              ))}
              <circle r="8" fill="#d3b270" />
            </g>
          ))}
        </g>
      ) : null}
    </svg>
  );
}
function Bow() {
  return (
    <svg className="bow" viewBox="0 0 300 240" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2">
        <path d="M151 90C97 33 34 18 40 67C45 108 95 118 147 95C96 66 58 56 44 66M150 90C203 33 266 18 260 67C255 108 205 118 153 95C204 66 242 56 256 66M141 91C122 131 104 168 88 214L125 197L142 221C142 172 149 130 151 101M160 91C181 131 199 168 215 214L177 197L160 221C160 172 154 130 151 101" />
        <ellipse
          cx="151"
          cy="91"
          rx="12"
          ry="16"
          fill="currentColor"
          fillOpacity=".2"
        />
      </g>
    </svg>
  );
}
function Stars() {
  return (
    <div className="stars" aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <i
          key={i}
          style={{
            left: ((i * 37) % 100) + "%",
            top: ((i * 61) % 100) + "%",
            animationDelay: i * 0.2 + "s",
          }}
        >
          ✧
        </i>
      ))}
    </div>
  );
}
function InviteArt({ event, template, small = false }) {
  const t =
    template || templates.find((x) => x.id === event?.template) || templates[0];
  const e = event || defaultEvent(t);
  const botanical = [
    "olive",
    "citrus",
    "sage",
    "rose",
    "garden",
    "table",
    "linen",
  ].includes(t.theme);
  return (
    <div className={`invite-art theme-${t.theme} ${small ? "small" : ""}`}>
      {["navy", "disco", "gold", "confetti"].includes(t.theme) && <Stars />}
      {botanical && (
        <>
          <Botanical kind={t.theme} className="branch-left" />
          <Botanical kind={t.theme} className="branch-right" />
        </>
      )}
      {["ribbon", "cherry", "pearl"].includes(t.theme) && <Bow />}
      {t.theme === "blue" && <div className="sun-arch">☀</div>}
      {t.theme === "burgundy" && <div className="deco-frame" />}
      <div className="invite-art-content">
        <span className="tiny">
          {t.occasion === "Wedding"
            ? "TOGETHER WITH THEIR FAMILIES"
            : t.occasion === "Birthday"
              ? "YOU’RE INVITED TO CELEBRATE"
              : t.occasion === "Baby shower"
                ? "THE SWEETEST NEW CHAPTER"
                : "LET’S MAKE A MEMORY"}
        </span>
        <span className="art-ornament">
          {t.theme === "disco"
            ? "✺"
            : t.theme === "gold"
              ? "✶"
              : t.theme === "confetti"
                ? "✷"
                : "❦"}
        </span>
        <h3>{e.names}</h3>
        <p>{e.subtitle}</p>
        <div className="art-line" />
        <span className="art-date">{dateLabel(e.date, e.language)}</span>
        <span className="art-venue">{e.venue}</span>
      </div>
      {e.photo && (
        <img className="invite-photo" src={e.photo} alt="Your celebration" />
      )}
      <span className="art-bottom">a moment to remember</span>
    </div>
  );
}
function Envelope({ event, onOpen, hero = false }) {
  const [opening, setOpening] = useState(false);
  function open() {
    if (opening) return;
    setOpening(true);
    setTimeout(onOpen, 650);
  }
  return (
    <button
      className={`envelope ${opening ? "opening" : ""} ${hero ? "hero-envelope" : ""}`}
      onClick={open}
      aria-label="Open invitation"
    >
      <div className="envelope-liner" />
      <div className="envelope-letter">
        <InviteArt event={event} small />
      </div>
      <div className="envelope-front" />
      <div className="envelope-flap" />
      <span className="wax-seal">m</span>
    </button>
  );
}
function Modal({ children, onClose, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function key(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll(
          "button:not([disabled]),input,select,textarea,a[href]",
        );
        if (!nodes?.length) return;
        const a = nodes[0],
          z = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Maison dialog"
        tabIndex="-1"
        ref={ref}
        className={"modal " + className}
      >
        <button className="icon-btn close" onClick={onClose} aria-label="Close">
          <X size={21} />
        </button>
        {children}
      </section>
    </div>
  );
}
function App() {
  const [lang, setLang] = useState(
    () => localStorage.getItem("maison-language") || "en",
  );
  const c = copy[lang] || copy.en;
  const [filter, setFilter] = useState("All designs");
  const [worldOccasion,setWorldOccasion]=useState(()=>localStorage.getItem("maison-occasion")||"Wedding");
  const [worldTheme,setWorldTheme]=useState(()=>localStorage.getItem("maison-world-theme")||"midnight");
  const [guestEvent,setGuestEvent]=useState(null);
  useEffect(()=>{document.documentElement.dataset.world=worldTheme;localStorage.setItem("maison-world-theme",worldTheme)},[worldTheme]);
  useEffect(()=>{localStorage.setItem("maison-occasion",worldOccasion)},[worldOccasion]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("curated");
  const [favs, setFavs] = useState(() =>
    JSON.parse(localStorage.getItem("maison-favourites") || "[]"),
  );
  const [favOnly, setFavOnly] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState(() => { const v = new URLSearchParams(location.search).get("view"); return ["cinema", "gallery", "journey", "experts", "dashboard"].includes(v) ? v : "cinema"; });
  const [editor, setEditor] = useState(null);
  const [experience, setExperience] = useState(null);
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
  function go(id) {
    setView("gallery");
    setMenu(false);
    setTimeout(
      () =>
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }),
      30,
    );
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
  function start(t) {
    let draft;
    try { draft = JSON.parse(localStorage.getItem("maison-preview-draft:" + t.id)); } catch {}
    setEditor(draft || { content: { ...defaultEvent(t), language: lang, worldTheme } });
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
      if (published) throw new Error("Publishing will be enabled after design approval. You can save a draft on this device and experience the animation now.");
      const draft = { content: record.content, published: false };
      localStorage.setItem("maison-preview-draft:" + record.content.template, JSON.stringify(draft));
      setEditor(draft);
      setToast("Design draft saved on this device. No account needed.");
      return draft;
    }
    const r = await api("invitations", {
      method: "POST",
      data: { ...record, published },
    });
    setEditor(r);
    await loadInvites();
    setToast(
      published
        ? "Your invitation is live. Time to make someone’s day."
        : "Invitation saved to your account.",
    );
    if (shareAfterPublish) setShare(r);
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
  const demoScene = cinemaThemes.find(t => t.id === q.get("cinema"));
  if (demoScene) return <GuestExperience event={cinemaEvent(demoScene, defaultEvent(templates.find(t=>t.occasion===demoScene.occasion)||templates[0]))} preview />;
  if (publicSlug)
    return (
      <GuestPage slug={publicSlug} token={q.get("guest")} initialLang={lang} />
    );
  return (
    <>
      <div className="lx-announcement">
        <span>Design and share for free</span>
        <i aria-hidden="true">◆</i>
        <span>Premium editions coming soon</span>
      </div>
      <header className={"lx-header" + (scrolled ? " is-scrolled" : "")}>
        <nav className={menu ? "mobile-open" : ""} aria-label="Main">
          <button
            className={view === "cinema" ? "active" : ""}
            onClick={() => {setView("cinema");setMenu(false);window.scrollTo({top:0,behavior:"smooth"})}}
          >
            Invitation worlds
          </button>
          <button className={view==="journey"?"active":""} onClick={()=>{setView("journey");setMenu(false);window.scrollTo({top:0,behavior:"smooth"})}}>Your world</button>
          <button className={view==="experts"?"active":""} onClick={()=>{setView("experts");setMenu(false);window.scrollTo({top:0,behavior:"smooth"})}}>Venues & Experts</button>
          <button className="lx-nav-mobile-only" onClick={() => go("faq")}>
            FAQ
          </button>
          <button
            className="lx-nav-mobile-only"
            onClick={() => {
              setView("dashboard");
              setMenu(false);
            }}
          >
            {c.dashboard}
          </button>
          <button
            className="lx-nav-mobile-only"
            onClick={() => {
              setMenu(false);
              start(templates[0]);
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
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="fr">FR</option>
          </select>
          <button
            className="lx-my"
            onClick={() => {
              setView("dashboard");
              setMenu(false);
            }}
          >
            {c.dashboard}
          </button>
          <button
            className="lx-btn lx-btn-solid lx-header-create"
            onClick={() => start(templates[0])}
          >
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
      {view === 'cinema' ? <CinemaCollection onPreview={setExperience} onCreate={event=>setEditor({content:event})} notify={setToast}/> : view === 'experts' ? <ExpertsPage user={user} occasion={worldOccasion} onOccasion={setWorldOccasion} onAuth={()=>setAuth(true)} onUseVenue={place=>{const invitation=invites.find(i=>occasionFor(i,templates)===worldOccasion);setEditor(invitation?{...invitation,content:{...invitation.content,venue:place.name,address:(place.address||place.city||'').replace(place.name+', ','')}}:{content:{...defaultEvent(templates.find(t=>t.occasion===worldOccasion)||templates[0]),worldTheme,venue:place.name,address:(place.address||place.city||'').replace(place.name+', ','')}})}} notify={setToast} Modal={Modal} lang={lang}/> : view === 'journey' ? <RoyalJourney user={user} invites={invites} occasion={worldOccasion} onOccasion={setWorldOccasion} theme={worldTheme} onTheme={setWorldTheme} onCreate={invitation=>invitation?setEditor(invitation):start(templates.find(t=>t.occasion===worldOccasion)||templates[0])} onExperts={()=>{setView('experts');window.scrollTo({top:0,behavior:'smooth'})}} onGuests={invitation=>{setGuestEvent(invitation);setView('dashboard');window.scrollTo({top:0,behavior:'smooth'})}} onPreview={setExperience} onAuth={()=>setAuth(true)} notify={setToast}/> : view === "gallery" ? (
        <main className="lx-main">
          <RoyalHero occasion={worldOccasion} onOccasion={value=>{setWorldOccasion(value);setFilter(value)}} theme={worldTheme} onTheme={setWorldTheme} lang={lang} onCreate={()=>start(templates.find(t=>t.occasion===worldOccasion)||templates[0])} onWorld={()=>{setView('journey');window.scrollTo({top:0,behavior:'smooth'})}} onExperts={()=>{setView('experts');window.scrollTo({top:0,behavior:'smooth'})}} onExperience={()=>setExperience({...defaultEvent(templates.find(t=>t.occasion===worldOccasion)||templates[0]),worldTheme})}/>
          <section id="collection" className="lx-section lx-collection">
            <div className="lx-head reveal">
              <span className="lx-eyebrow">{c.collection}</span>
              <h2>{c.title}</h2>
              <p>{c.description}</p>
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
                      aria-label={"Personalise " + t.name + ", €" + t.price}
                    >
                      €{t.price}
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
              <Check size={14} strokeWidth={1.5} /> Every design includes
              animation, personalisation and RSVP. Try any of them for free.
            </p>
          </section>

          <section className="lx-story">
            <div className="lx-story-art">
              <div className="lx-story-envelope">
                <Envelope
                  event={defaultEvent(templates[4])}
                  onOpen={() => setExperience(defaultEvent(templates[4]))}
                />
              </div>
            </div>
            <div className="lx-story-copy reveal">
              <span className="lx-eyebrow">More than a link</span>
              <h2>
                The feeling of opening
                <em>something just for you.</em>
              </h2>
              <p>
                A sealed envelope. A familiar name. A melody as it opens. Turn
                a simple “you’re invited” into the first moment of the
                celebration.
              </p>
              <button
                className="lx-link"
                onClick={() => setExperience(defaultEvent(templates[4]))}
              >
                Go on, open it <ArrowRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          </section>

          <section id="how" className="lx-section lx-how">
            <div className="lx-head reveal">
              <span className="lx-eyebrow">Less planning, more celebrating</span>
              <h2>A beautiful invitation in three quiet steps.</h2>
            </div>
            <ol className="lx-steps">
              {[
                [
                  "I",
                  "Find your kind of beautiful",
                  "Choose a design that feels like you, from intimate dinners to the big “I do”.",
                ],
                [
                  "II",
                  "Tell your story",
                  "Add your names, a photo and every lovely detail. Watch it come to life as you type.",
                ],
                [
                  "III",
                  "Send a little joy",
                  "Share a personal link, collect replies, and get back to looking forward to it.",
                ],
              ].map(([n, title, p]) => (
                <li key={n} className="reveal">
                  <span className="lx-numeral">{n}</span>
                  <h3>{title}</h3>
                  <p>{p}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="pricing" className="lx-section lx-pricing">
            <div className="lx-head reveal">
              <span className="lx-eyebrow">A small investment in a big moment</span>
              <h2>One occasion. One simple price.</h2>
              <p>
                Create and share a watermarked invitation for free. One-time
                payment, no subscription. Premium checkout is coming soon.
              </p>
            </div>
            <div className="lx-plans">
              {[
                [
                  "Essential",
                  19,
                  "For small, special moments",
                  [
                    "Animated invitation",
                    "Personalised guest links",
                    "RSVP dashboard",
                    "English, German & French",
                  ],
                ],
                [
                  "Signature",
                  29,
                  "For the once-in-a-lifetime",
                  [
                    "Everything in Essential",
                    "Premium wedding collections",
                    "Photo & music personalisation",
                    "Calendar & venue links",
                  ],
                ],
                [
                  "Celebration",
                  49,
                  "For a little extra possibility",
                  [
                    "Everything in Signature",
                    "Multiple event invitations",
                    "Export your guest list",
                    "Priority support at launch",
                  ],
                ],
              ].map(([name, price, desc, features], i) => (
                <article className={"reveal" + (i === 1 ? " featured" : "")} key={name}>
                  {i === 1 && <span className="lx-plan-tag">The lovely middle ground</span>}
                  <h3>{name}</h3>
                  <p>{desc}</p>
                  <div className="lx-plan-price">
                    <span>€</span>
                    {price}
                    <small>per occasion</small>
                  </div>
                  <ul>
                    {features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <button
                    className={"lx-btn " + (i === 1 ? "lx-btn-gold" : "lx-btn-line")}
                    onClick={() => start(templates[i === 1 ? 0 : 1])}
                  >
                    Try a design for free
                  </button>
                </article>
              ))}
            </div>
            <p className="lx-fine">
              Indicative launch prices. Final taxes and terms are shown before
              payment. No live checkout is enabled yet.
            </p>
          </section>

          <section id="faq" className="lx-section lx-faq">
            <div className="lx-head reveal">
              <span className="lx-eyebrow">Good to know</span>
              <h2>Questions, kindly answered.</h2>
            </div>
            <div className="lx-faq-list">
              {[
                [
                  "Can I try Maison for free?",
                  "Yes. You can personalise any design, then create and share a watermarked invitation without paying. Premium editions with checkout are coming soon, and no payment is taken today.",
                ],
                [
                  "Do my guests need an account?",
                  "No. Guests open your link, break the seal and reply. Only you, as the host, sign in to manage invitations and replies.",
                ],
                [
                  "How do replies reach me?",
                  "Every response lands in your RSVP dashboard. You can create personal links for individual guests and export the guest list as a CSV file.",
                ],
                [
                  "Which languages can guests see?",
                  "Invitations can be shown in English, German or French, with dates written the way each language expects.",
                ],
                [
                  "What happens to our guests’ data?",
                  "Maison uses no analytics or advertising cookies. Guest lists and private notes are never shown on the public invitation, and you can export or delete your data at any time.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <Plus size={18} strokeWidth={1.3} aria-hidden="true" />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="lx-closing">
            <span className="lx-ornament" aria-hidden="true">❦</span>
            <span className="lx-eyebrow">Your people. Your moment.</span>
            <h2>
              Give them something
              <em>to look forward to.</em>
            </h2>
            <button className="lx-btn lx-btn-solid" onClick={() => start(templates[0])}>
              {c.start}
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
            <span className="lx-fine">Beautiful to receive. Easy to create.</span>
          </section>
        </main>
      ) : (
        <Dashboard
          initialInvitation={guestEvent}
          user={user}
          invites={invites}
          onAuth={() => setAuth(true)}
          onStart={() => start(templates[0])}
          onEdit={setEditor}
          onShare={setShare}
          onRefresh={loadInvites}
          notify={setToast}
          onSettings={() => setInfo("settings")}
        />
      )}
      <footer className="lx-footer">
        <div className="lx-footer-top">
          <a className="lx-brand" href="/">
            <span className="lx-brand-word">Maison</span>
            <span className="lx-brand-tag">{c.made}</span>
          </a>
          <p>A thoughtful way to bring people together.</p>
        </div>
        <div className="lx-footer-links">
          <button onClick={() => go("collection")}>{c.templates}</button>
          <button onClick={() => go("pricing")}>{c.pricing}</button>
          <button onClick={() => setInfo("help")}>Help & FAQs</button>
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
      {experience && (
        <Modal className="experience-modal" onClose={() => setExperience(null)}>
          <GuestExperience
            event={experience}
            preview
            onEdit={() => {
              setExperience(null);
              setEditor({ content: experience });
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
            setToast(
              "Welcome to Maison. Your next beautiful moment starts here.",
            );
          }}
        />
      )}
      {share && (
        <ShareDialog
          record={share}
          onClose={() => setShare(null)}
          notify={setToast}
        />
      )}
      {info && (
        <InfoDialog
          type={info}
          onClose={() => setInfo(null)}
          user={user}
          notify={setToast}
          onDataDeleted={() => {
            localStorage.removeItem('maison-draft');
            setInvites([]);
            setInfo(null);
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}

function Editor({ record, user, onClose, onSave, onPreview, notify }) {
  const [event, setEvent] = useState(record.content);
  const [tab, setTab] = useState("Details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);
  const update = (k, v) => setEvent((e) => ({ ...e, [k]: v }));
  const t = templates.find((t) => t.id === event.template) || templates[0];
  useEffect(() => {
    setEvent(record.content);
  }, [record.id]);
  useEffect(() => {
    try {
      localStorage.setItem("maison-draft", JSON.stringify(event));
    } catch {}
  }, [event]);
  async function save(publish) {
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
  return (
    <Modal className="editor-modal" onClose={onClose}>
      <div className="editor-top">
        <button
          className="text-link"
          onClick={onClose}
          aria-label="Return to design collection"
        >
          <ArrowLeft size={16} />
          <span>Design collection</span>
        </button>
        <span className="editor-title">
          Your invitation studio <span>Made by you, with feeling.</span>
        </span>
        <div>
          <button
            className="btn secondary"
            disabled={saving}
            onClick={() => save(false)}
          >
            {saving ? (
              <Loader2 className="spin" size={14} />
            ) : (
              <Check size={14} />
            )}
            {record.published ? "Save changes" : "Save draft"}
          </button>
          <button
            className="btn primary"
            disabled={saving}
            onClick={() => save(true)}
          >
            Publish & share
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
      <div className="editor-layout">
        <aside className={mobilePreview ? "hide-mobile" : ""}>
          <div className="editor-intro">
            <span className="eyebrow">MAKE IT YOURS</span>
            <h2>
              A little more <em>you.</em>
            </h2>
            <p>Every edit appears in your preview.</p>
          </div>
          <div className="editor-tabs">
            {["Details", "Design", "Extras"].map((x) => (
              <button
                className={tab === x ? "selected" : ""}
                onClick={() => setTab(x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="editor-fields">
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {tab === "Details" ? (
              <>
                <Field
                  label="Names / celebration title"
                  value={event.names}
                  onChange={(v) => update("names", v)}
                  maxLength={160}
                />
                <Field
                  label="A little introduction"
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
                  Event timezone
                  <select
                    value={event.timezone}
                    onChange={(e) => update("timezone", e.target.value)}
                  >
                    {[
                      "Europe/Berlin",
                      "Europe/Paris",
                      "Europe/London",
                      "Europe/Rome",
                      "Europe/Amsterdam",
                      "Europe/Madrid",
                      "Europe/Lisbon",
                      "Europe/Zurich",
                      "Europe/Vienna",
                      "Europe/Stockholm",
                      "Europe/Athens",
                      "Europe/Helsinki",
                      "Europe/Warsaw",
                      "Europe/Prague",
                      "Europe/Dublin",
                    ].map((z) => (
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
            ) : tab === "Design" ? (
              <>
                <p className="muted">Choose the full-screen world your guests will enter.</p>
                <div className="cinema-scene-picker">{cinemaThemes.map(scene=><button key={scene.id} className={sceneFor(event).id===scene.id?"selected":""} onClick={()=>setEvent(e=>({...e,scene:scene.id,occasion:scene.occasion}))} aria-label={"Choose scene "+scene.name}><img src={"/"+scene.image+".webp"} alt="" loading="lazy"/><span>{scene.name}</span></button>)}</div>
                <p className="muted">Stationery style</p>
                <div className="mini-designs">
                  {templates.map((x) => (
                    <button
                      key={x.id}
                      aria-label={"Choose " + x.name}
                      className={event.template === x.id ? "selected" : ""}
                      onClick={() => update("template", x.id)}
                    >
                      <InviteArt template={x} small />
                      <span>{x.name}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="field">
                  Celebration world
                  <select value={event.worldTheme||'midnight'} onChange={e=>update('worldTheme',e.target.value)}>{worldThemes.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>
                </label>
                <label className="field">
                  Invitation language
                  <select
                    value={event.language}
                    onChange={(e) => update("language", e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fr">Français</option>
                  </select>
                </label>
                <Field
                  label="RSVP by"
                  type="date"
                  value={event.rsvpDeadline}
                  onChange={(v) => update("rsvpDeadline", v)}
                />
                <Field
                  label="Dress code"
                  value={event.dressCode}
                  onChange={(v) => update("dressCode", v)}
                  maxLength={120}
                />
                <label className="field">
                  Your photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => photo(e.target.files[0])}
                  />
                  <small>
                    JPG, PNG or WebP. Automatically resized for sharing.
                  </small>
                </label>
                {event.photo && (
                  <button
                    className="text-link"
                    onClick={() => update("photo", "")}
                  >
                    Remove photo
                    <X size={14} />
                  </button>
                )}
                <label className="field">
                  Opening soundtrack
                  <select
                    value={event.music}
                    onChange={(e) => update("music", e.target.value)}
                  >
                    <option value="soft">
                      Soft piano · original generative melody
                    </option>
                    <option value="celestial">
                      Celestial chimes · original melody
                    </option>
                    <option value="none">A quiet moment · no music</option>
                  </select>
                  <small>Plays only after your guest opens the envelope.</small>
                </label>
                <div className="small-note">
                  <ShieldCheck size={19} />
                  <span>
                    Guests don’t need an account. Their replies are visible only
                    to you.
                  </span>
                </div>
              </>
            )}
            {!user && (
              <div className="small-note">
                Design preview · No sign-in needed. Drafts stay on this device; publishing comes after design approval.
              </div>
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
              Experience animation
            </button>
          </div>
          <div className="preview-paper">
            <div className="cinema-editor-cover"><img src={"/"+sceneFor(event).image+".webp"} alt="Your invitation scene"/><div><h3>{event.names}</h3><p>{event.subtitle}</p><small>{dateLabel(event.date,event.language)}</small></div><button onClick={()=>onPreview(event)}>Play full-screen experience ↗</button></div>
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
            {t.name} <span>·</span> Your beautiful beginning
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
function Field({ label, onChange, ...props }) {
  return (
    <label className="field">
      {label}
      <input {...props} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

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
function GuestExperience({
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
  const [muted, toggleSound] = useSound(event.music, opened);
  const [name, setName] = useState(guest?.name || "");
  const [response, setResponse] = useState(
    guest?.response === "no" ? "no" : "yes",
  );
  const [party, setParty] = useState(guest?.party_size || 1);
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
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
          note,
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
    <div className={"guest-experience cinema-guest " + (opened ? "is-open" : "")}>
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
      <CinemaStage event={event} guest={guest} opened={opened} onOpen={()=>setOpened(true)} onReplay={()=>setOpened(false)} lang={lang} preview={preview}/>
      {opened && (
        <div className="cinema-detail-sheet" aria-label="Invitation details and RSVP">
        <div className="opened-invite">
          <p className="guest-message">{event.message}</p>
          <section className="event-details">
            <span className="eyebrow">{c.details}</span>
            <h2>A day to remember.</h2>
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
            {event.dressCode && (
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
            </div>
          </section>
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
                <label className="field">
                  {lang === "de"
                    ? "Nachricht an den Gastgeber (optional)"
                    : lang === "fr"
                      ? "Un mot pour votre hôte (facultatif)"
                      : "A note for your host (optional)"}
                  <textarea
                    rows={3}
                    maxLength={1000}
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
            With love, and a little <a href="/">maison</a>
            <small>
              Only essential cookies. Replies are private to your host.
            </small>
          </div>
        </div></div>
      )}
    </div>
  );
}
function GuestPage({ slug, token, initialLang }) {
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

function Dashboard({
  initialInvitation,
  user,
  invites,
  onAuth,
  onStart,
  onEdit,
  onShare,
  onRefresh,
  notify,
  onSettings,
}) {
  const [selected, setSelected] = useState(initialInvitation||null);
  const [guests, setGuests] = useState([]);
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [removeGuest, setRemoveGuest] = useState(null);
  useEffect(() => {
    if (!selected) return;
    refreshGuests();
    const timer = setInterval(() => {
      if (!document.hidden) refreshGuests();
    }, 15000);
    return () => clearInterval(timer);
  }, [selected]);
  async function refreshGuests() {
    try {
      setGuests(await api("guests", { query: { id: selected.id } }));
    } catch (e) {
      notify(e.message);
    }
  }
  async function addGuest(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const g = await api("guests", {
        method: "POST",
        data: { invitation_id: selected.id, name: guestName },
      });
      setGuests((v) => [g, ...v]);
      setGuestName("");
      notify("Personal invitation link created.");
    } catch (e) {
      notify(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function copyLink(g) {
    const url =
      location.origin + "/?invite=" + selected.slug + "&guest=" + g.token;
    try {
      await navigator.clipboard.writeText(url);
      notify("Personal guest link copied.");
    } catch {
      notify(
        "Clipboard unavailable. Open the guest link and copy its address.",
      );
    }
  }
  const accepted = guests.filter((g) => g.response === "yes");
  return (
    <main className="dashboard section-wrap">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">YOUR MAISON</span>
          <h1>
            {selected
              ? "The people make the party."
              : "Your beautiful moments."}
          </h1>
          <p>
            {selected
              ? selected.content.names
              : "Create, share and keep every little detail together."}
          </p>
        </div>
        <div>
          <button
            className="icon-btn"
            aria-label="Account data settings"
            onClick={onSettings}
          >
            <Settings2 size={20} />
          </button>
          <button className="btn primary" onClick={onStart}>
            <Plus size={16} />
            New invitation
          </button>
        </div>
      </div>
      {!user ? (
        <div className="dashboard-welcome">
          <div className="welcome-art">
            <InviteArt event={defaultEvent()} small />
          </div>
          <div>
            <span className="eyebrow">A HOME FOR YOUR CELEBRATIONS</span>
            <h2>
              Your next chapter
              <br />
              <em>starts here.</em>
            </h2>
            <p>
              Save your designs, send personal invitations and watch your guest
              list come together.
            </p>
            <button className="btn primary" onClick={onAuth}>
              Sign in or create an account
              <ArrowRight size={16} />
            </button>
            <button className="text-link" onClick={onStart}>
              Try the invitation studio
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      ) : selected ? (
        <>
          <button className="text-link" onClick={() => setSelected(null)}>
            <ArrowLeft size={16} />
            All invitations
          </button>
          <div className="stats">
            {[
              ["Invited", guests.length],
              ["Attending", accepted.reduce((n, g) => n + g.party_size, 0)],
              ["Declined", guests.filter((g) => g.response === "no").length],
              [
                "Awaiting reply",
                guests.filter((g) => g.response === "pending").length,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="guest-manager">
            <div className="guest-manager-head">
              <h2>Your guest list</h2>
              <button
                className="btn secondary"
                onClick={() => {
                  const safe = (v) =>
                    '"' +
                    String(v ?? "")
                      .replaceAll('"', '""')
                      .replace(/^[=+@-]/, "'") +
                    '"';
                  download(
                    "maison-guests.csv",
                    "\uFEFFName,Response,Party size,Note\r\n" +
                      guests
                        .map((g) =>
                          [g.name, g.response, g.party_size, g.note]
                            .map(safe)
                            .join(","),
                        )
                        .join("\r\n"),
                    "text/csv",
                  );
                }}
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
            <form className="add-guest" onSubmit={addGuest}>
              <input
                aria-label="Guest name"
                placeholder="e.g. Sophie & James"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                maxLength={120}
              />
              <button className="btn primary" disabled={loading}>
                <Plus size={15} />
                Add guest
              </button>
            </form>
            <p className="muted">
              Create a unique link for each guest. Send it using your preferred
              messaging app. Replies refresh every 15 seconds.
            </p>
            <div className="guest-table">
              <div className="guest-table-row table-header">
                <span>Guest</span>
                <span>Reply</span>
                <span>Party</span>
                <span>Invitation</span>
              </div>
              {guests.map((g) => (
                <div className="guest-table-row" key={g.id}>
                  <span>
                    <strong>{g.name}</strong>
                    {g.note && <small>{g.note}</small>}
                  </span>
                  <span className={"status " + g.response}>
                    {g.response === "yes"
                      ? "Attending"
                      : g.response === "no"
                        ? "Declined"
                        : "Awaiting"}
                  </span>
                  <span>{g.party_size}</span>
                  <span>
                    <button
                      className="icon-btn"
                      aria-label={"Copy link for " + g.name}
                      onClick={() => copyLink(g)}
                    >
                      <Copy size={15} />
                    </button>
                    <a
                      className="icon-btn"
                      aria-label={"Open invitation for " + g.name}
                      href={"/?invite=" + selected.slug + "&guest=" + g.token}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink size={15} />
                    </a>
                    <button className="icon-btn" aria-label={'Delete response for '+g.name} onClick={()=>setRemoveGuest(g)}><Trash2 size={14}/></button>
                  </span>
                </div>
              ))}
            </div>
            {guests.length === 0 && (
              <div className="empty">
                <Users />
                <h3>Every good party starts with a guest.</h3>
                <p>Add someone special to create their personal invitation.</p>
              </div>
            )}
          </div>
        </>
      ) : invites.length ? (
        <div className="dashboard-grid">
          {invites.map((i) => (
            <article className="event-card" key={i.id}>
              <div className="event-card-art">
                <InviteArt event={i.content} small />
              </div>
              <div className="event-card-info">
                <span className={"status " + (i.published ? "yes" : "pending")}>
                  {i.published ? "Live invitation" : "Draft"}
                </span>
                <h2>{i.content.names}</h2>
                <p>
                  {dateLabel(i.content.date, i.content.language)} ·{" "}
                  {i.content.venue}
                </p>
                <div className="event-card-actions">
                  <button className="btn secondary" onClick={() => onEdit(i)}>
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => setSelected(i)}
                  >
                    <Users size={14} />
                    Guests
                  </button>
                  <button
                    className="btn primary"
                    disabled={!i.published}
                    onClick={() => onShare(i)}
                  >
                    Share
                    <ArrowUpRight size={14} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={"Delete " + i.content.names}
                    onClick={() => setDeleteId(i.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <Mail size={35} />
          <h2>A blank page. A beautiful possibility.</h2>
          <p>Your saved invitations will appear here.</p>
          <button className="btn primary" onClick={onStart}>
            Create your first invitation
            <ArrowRight size={15} />
          </button>
        </div>
      )}
      {removeGuest && <Modal className="info-modal" onClose={()=>setRemoveGuest(null)}><h2>Delete this guest’s data?</h2><p>This permanently removes {removeGuest.name} and their RSVP. Their personal guest link will stop working.</p><button className="btn primary" onClick={async()=>{try{await api('guests',{method:'DELETE',data:{id:removeGuest.id}});setGuests(current=>current.filter(g=>g.id!==removeGuest.id));setRemoveGuest(null);notify('Guest response deleted.')}catch(e){notify(e.message)}}}>Delete guest data</button></Modal>}
      {deleteId && (
        <Modal className="info-modal" onClose={() => setDeleteId(null)}>
          <h2>Delete this invitation?</h2>
          <p>
            This removes the invitation and its guest responses. Shared links
            will stop working.
          </p>
          <button
            className="btn primary"
            onClick={async () => {
              try {
                await api("invitations", {
                  method: "DELETE",
                  data: { id: deleteId },
                });
                setDeleteId(null);
                await onRefresh();
                notify("Invitation and guest data deleted.");
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
function ShareDialog({ record, onClose, notify }) {
  const url = location.origin + "/?invite=" + record.slug;
  const [copied, setCopied] = useState(false);
  return (
    <Modal className="share-modal" onClose={onClose}>
      <span className="share-icon">
        <Mail size={27} />
      </span>
      <span className="eyebrow">A LITTLE JOY, READY TO SEND</span>
      <h2>
        You’re officially
        <br />
        <em>inviting.</em>
      </h2>
      <p>{record.content.names}</p>
      <label className="field">
        Your invitation link
        <input readOnly value={url} onFocus={(e) => e.target.select()} />
      </label>
      <button
        className="btn primary"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            notify("Select the link above to copy it.");
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
        {copied ? "Copied with love" : "Copy invitation link"}
      </button>
      <a className="btn secondary" href={url} target="_blank" rel="noreferrer">
        Open guest experience
        <ArrowUpRight size={16} />
      </a>
      <p className="small-note">
        Anyone with this link can view the invitation and reply. For named guest
        links, open Guests in your dashboard. Avoid posting private event links
        publicly.
      </p>
    </Modal>
  );
}
function InfoDialog({ type, onClose, user, notify, onDataDeleted }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Modal className="info-modal" onClose={onClose}>
      {type === "settings" ? (
        <>
          <span className="eyebrow">YOUR ACCOUNT. YOUR CONTROL.</span>
          <h2>Your data, thoughtfully handled.</h2>
          <p>
            {user?.email || "Sign in to manage your saved invitation data."}
          </p>
          <p>
            Export or delete your Maison invitations and their guest responses.
            Deleting Maison data does not delete your shared Supabase account or
            data belonging to other apps.
          </p>
          <button
            className="btn secondary"
            disabled={!user || busy}
            onClick={async () => {
              setBusy(true);
              try {
                download(
                  "maison-data.json",
                  JSON.stringify(await api("export"), null, 2),
                  "application/json",
                );
              } catch (e) {
                notify(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Download size={16} />
            Export my data
          </button>
          <button
            className="text-link danger"
            disabled={!user}
            onClick={() => setConfirm(true)}
          >
            Delete my Maison data
            <Trash2 size={15} />
          </button>
          {confirm && (
            <div className="error">
              <p>
                Delete all your Maison invitations, guest responses, plans and shortlists? This cannot be
                undone.
              </p>
              <button
                className="btn primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api("delete-data", { method: "DELETE", data: {} });
                    onDataDeleted();
                    notify("All your Maison invitation data was deleted.");
                  } catch (e) {
                    notify(e.message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Confirm deletion
              </button>
            </div>
          )}
        </>
      ) : type === "privacy" ? (
        <>
          <span className="eyebrow">PRIVACY, BY DESIGN</span>
          <h2>
            For your eyes.
            <br />
            And your invited guests.
          </h2>
          <p>
            This is a working preview of Maison. Event, planning, shortlist and RSVP data is stored
            in the Community Supabase project in Frankfurt, Germany. Hosting is
            provided by Vercel; delivery and subprocessors may process data
            internationally.
          </p>
          <p>
            Hosts collect guest names, replies, party sizes and optional notes
            solely to organise their events. Guest lists require host
            authentication. Published invitations are accessible to anyone
            holding their unique link.
          </p>
          <p>
            We use essential HttpOnly session cookies, local language and
            favourite preferences, and a device-local editor draft. No
            advertising or analytics cookies are used. Google Fonts loads the
            page fonts; opening a map sends you to Google Maps.
          </p>
          <p>
            Hosts can export or delete invitation data in Account settings.
            Guest responses are removed when their invitation is deleted.
            Automatic retention deletion is not yet enabled. Contact your host
            to correct or delete a response.
          </p>
          <p>
            Before commercial launch: add the operator’s legal identity, privacy
            contact, processor agreements, transfer safeguards, retention
            schedule and region-specific legal review.
          </p>
        </>
      ) : type === "terms" ? (
        <>
          <span className="eyebrow">PREVIEW TERMS</span>
          <h2>A thoughtful beginning.</h2>
          <p>
            Maison is an early working preview. Free invitations carry Maison
            branding. Displayed EUR premium prices are indicative; no live
            payment is enabled.
          </p>
          <p>
            You are responsible for your event details and permission to use
            uploaded photos. Share invitations only with intended guests and
            collect only the information needed for your event. Do not include
            sensitive personal information in notes.
          </p>
          <p>
            Availability and features may change during preview. Before paid
            launch, the operator must publish its legal identity, applicable VAT
            information, cancellation and withdrawal terms, and customer support
            contact.
          </p>
        </>
      ) : (
        <>
          <span className="eyebrow">A LITTLE HELP</span>
          <h2>
            Good questions.
            <br />
            Simple answers.
          </h2>
          {[
            [
              "Can I try before paying?",
              "Yes. Open any design, personalise it and experience the animation. Sign in to save and publish a free, Maison-branded invitation.",
            ],
            [
              "Do guests need an account?",
              "No. They open their link, tap the seal and reply. Personal guest links greet them by name.",
            ],
            [
              "How does music work?",
              "Maison creates an original soft piano or chime melody in your browser. It starts after opening the envelope, and can be muted.",
            ],
            [
              "Can I change a live invitation?",
              "Yes. Open your saved invitation, edit the details and publish again. The shared link stays the same.",
            ],
            [
              "Why didn’t my confirmation email arrive?",
              "This preview uses the connected project’s Supabase Auth. Its current email limits and provider configuration apply. Production needs a dedicated SMTP provider.",
            ],
            [
              "Can I buy a premium plan?",
              "Checkout is not enabled until Stripe keys and webhook fulfillment are configured and tested. No payments are simulated.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </>
      )}
    </Modal>
  );
}
createRoot(document.getElementById("root")).render(<App />);
