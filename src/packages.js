// The three ways to use Maison. Prices are planned launch prices;
// checkout is not connected yet, so everything is free during the preview.
export const PACKAGES = [
  {
    id: "invitation",
    name: "Invitation",
    price: 19,
    tagline: "Your invitation, beautifully sent",
    features: [
      "One of the three signature invitations, personalised",
      "One link to share by WhatsApp, email or text",
      "Guests reply online: yes or no, how many, a note",
      "Replies listed in your invitation space",
    ],
  },
  {
    id: "journey",
    name: "Invitation & Journey",
    price: 39,
    tagline: "Invite, follow every reply and plan your day",
    highlight: true,
    features: [
      "Everything in Invitation",
      "Personal link for each guest or family",
      "Guest tracking: who is coming, who declined, who hasn’t answered",
      "Its own journey: a checklist dated back from your day",
      "Venues & experts to find your people",
    ],
  },
  {
    id: "print",
    name: "Paper & Post",
    price: null,
    tagline: "Printed cards, posted to every address",
    soon: true,
    features: [
      "Everything in Invitation & Journey",
      "Your design printed on fine card",
      "Posted to each guest’s address",
      "An RSVP link on every card",
    ],
  },
];
// Invitations saved before packages existed had the full dashboard, so they
// keep it. New invitations always store their package explicitly.
export const packageOf = (content) =>
  PACKAGES.find((p) => p.id === (content?.package || "journey")) || PACKAGES[0];
export const hasJourney = (content) =>
  ["journey", "print"].includes(packageOf(content).id);
