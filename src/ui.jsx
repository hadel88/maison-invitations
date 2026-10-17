import React, { useState, useEffect, useRef } from "react";
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
import { templates, defaultEvent, dateLabel } from "./catalog";

export function Botanical({ kind = "olive", className = "" }) {
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
export function Bow() {
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
export function Stars() {
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
export function InviteArt({ event, template, small = false }) {
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
export function Envelope({ event, onOpen, hero = false }) {
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
export function Modal({ children, onClose, className = "" }) {
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
export function Field({ label, onChange, ...props }) {
  return (
    <label className="field">
      {label}
      <input {...props} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
