import React from "react";
import { ArrowRight, Plus } from "lucide-react";
import { PACKAGES } from "./packages";

// Everything below the three signature designs, in the order people decide:
// how it works → which package → questions → start.
export default function HomeSections({ onStart }) {
  return (
    <div className="lx-main home-sections">
      <section id="how" className="lx-section lx-how">
        <div className="lx-head">
          <span className="lx-eyebrow">How it works</span>
          <h2>Four steps, from first look to first reply.</h2>
        </div>
        <ol className="lx-steps lx-steps-4">
          {[
            ["I", "Choose your design", "Open the three signature invitations above and pick the one that feels like you."],
            ["II", "Make it yours", "Names, date, place and a few warm words. You see every change straight away."],
            ["III", "Pick your package", "Just the invitation, or the invitation with guest tracking and a planner."],
            ["IV", "Send & follow", "Share your link. Replies arrive in your invitation space."],
          ].map(([n, title, p]) => (
            <li key={n}>
              <span className="lx-numeral">{n}</span>
              <h3>{title}</h3>
              <p>{p}</p>
            </li>
          ))}
        </ol>
        <div className="lx-center">
          <button className="lx-btn lx-btn-solid" onClick={() => onStart()}>
            Start with step one <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      <section id="packages" className="lx-section lx-pricing">
        <div className="lx-head">
          <span className="lx-eyebrow">Packages</span>
          <h2>Choose how much Maison does for you.</h2>
          <p>
            One payment per celebration, no subscription. During the preview
            everything is free: checkout is not connected yet.
          </p>
        </div>
        <div className="lx-plans">
          {PACKAGES.map((p) => (
            <article className={p.highlight ? "featured" : ""} key={p.id}>
              {p.highlight && <span className="lx-plan-tag">With dashboard</span>}
              <h3>{p.name}</h3>
              <p>{p.tagline}</p>
              <div className="lx-plan-price">
                {p.soon ? (
                  <small className="lx-soon">Coming soon</small>
                ) : (
                  <>
                    <span>€</span>
                    {p.price}
                    <small>per celebration</small>
                  </>
                )}
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {p.soon ? (
                <button className="lx-btn lx-btn-line" disabled>
                  In preparation
                </button>
              ) : (
                <button
                  className={"lx-btn " + (p.highlight ? "lx-btn-gold" : "lx-btn-line")}
                  onClick={() => onStart(p.id)}
                >
                  Start with {p.name}
                </button>
              )}
            </article>
          ))}
        </div>
        <p className="lx-fine">
          Planned launch prices. Taxes and terms will be shown before any
          payment.
        </p>
      </section>

      <section id="faq" className="lx-section lx-faq">
        <div className="lx-head">
          <span className="lx-eyebrow">Good to know</span>
          <h2>Questions, kindly answered.</h2>
        </div>
        <div className="lx-faq-list">
          {[
            [
              "What is the difference between the packages?",
              "Invitation gives you the invitation, one link to share and a list of everyone who replied. Invitation & Journey adds a dashboard: a personal link for each guest, so you can see who is coming, who can’t come and who hasn’t answered yet, plus its own journey: a checklist dated back from your day, with milestones and your own tasks.",
            ],
            [
              "Can I try Maison for free?",
              "Yes. During the preview you can design, publish and share without paying. Checkout is not connected yet, so no payment is taken.",
            ],
            [
              "Do my guests need an account?",
              "No. Guests open your link, open the invitation and reply. Only you, as the host, sign in.",
            ],
            [
              "When will printed invitations be available?",
              "Paper & Post is in preparation and can’t be ordered yet.",
            ],
            [
              "Which languages can guests see?",
              "English, German or French, with dates written the way each language expects.",
            ],
            [
              "What happens to our guests’ data?",
              "Maison uses no analytics or advertising cookies. Guest lists and notes are never shown on the public invitation, and you can export or delete your data at any time.",
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
        <button className="lx-btn lx-btn-solid" onClick={() => onStart()}>
          Create your invitation <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </section>
    </div>
  );
}
