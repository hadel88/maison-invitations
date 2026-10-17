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
import { api, download } from "./client";
import { Modal } from "./ui";

export function ShareDialog({ record, onClose, notify, onGuests }) {
  const url = location.origin + "/?invite=" + record.slug;
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      notify("Select the link above to copy it.");
    }
  }
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
      <ol className="share-steps">
        {onGuests && (
          <li>
            <strong>Personal links (recommended)</strong>
            <span>One link per guest or family, so you can see who has answered.</span>
            <button className="btn primary" onClick={onGuests}>
              <Users size={16} /> Add guests
            </button>
          </li>
        )}
        <li>
          <strong>{onGuests ? "Or one link for everyone" : "Your invitation link"}</strong>
          <span>Send it by WhatsApp, email or text. Guests type their name when they reply.</span>
          <label className="field">
            <input readOnly value={url} aria-label="Invitation link" onFocus={(e) => e.target.select()} />
          </label>
          <button className={"btn " + (onGuests ? "secondary" : "primary")} onClick={copyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}
          </button>
        </li>
      </ol>
      <a className="text-link" href={url} target="_blank" rel="noreferrer">
        Open the guest view <ArrowUpRight size={14} />
      </a>
      <p className="small-note">
        Anyone with a link can view the invitation and reply. Avoid posting
        private event links publicly.
      </p>
    </Modal>
  );
}
export function InfoDialog({ type, onClose, user, notify, onDataDeleted }) {
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
