import { eventWorlds } from "./worlds.js";

// The planning journey of one invitation (package 2).
// Checklists are adapted from the "big moments" in the Community app.

// [id, title, description, days before the day (negative = after)]
// Adapted from the "big moments" journeys in the Community app.
const T = {
  Wedding: [
    ["w-budget", "Set the date and budget", "Agree on a rough date, guest number and total budget. Everything else depends on these three.", 365],
    ["w-venue", "Book the venue", "Popular venues are booked a year ahead. Ask about capacity, catering rules, music curfew and parking.", 300],
    ["w-photo", "Photographer and video", "Good photographers are booked early. Look at full wedding galleries, not only the best shots.", 200],
    ["w-docs", "Gather documents for the registry office", "Requirements differ by country and registry office. Ask early which certificates and translations you need.", 200],
    ["w-attire", "Dress and suit", "Order early: dresses often need several months plus fittings.", 180],
    ["w-catering", "Catering and cake", "Taste menus, check dietary options and the cake delivery time.", 150],
    ["w-music", "Music or DJ", "Agree on the song list, first dance and when the music must stop.", 150],
    ["w-rings", "Rings", "Allow a few weeks for sizing and engraving.", 90],
    ["w-decor", "Decoration and flowers", "Decide colours, table decoration and who sets up on the day.", 60],
    ["w-hair", "Hair and make-up trial", "Do a trial with the artist and book the morning of the wedding.", 30],
    ["w-seating", "Seating plan", "Finalise once all guests have replied.", 14],
    ["w-confirm", "Confirm every supplier", "Call venue, caterer, DJ, photographer and florist with final times and numbers.", 7],
  ],
  Engagement: [
    ["e-guests", "Pick date, place and guest list", "Keep it as small or as big as feels right.", 60],
    ["e-venue", "Reserve the venue or restaurant", "Ask about a private room and a set menu.", 45],
    ["e-outfit", "Choose your outfits", "Coordinate colours if you want matching photos.", 21],
    ["e-photo", "Book a photographer or a friend with a camera", "A short portrait session before guests arrive works well.", 21],
    ["e-decor", "Flowers, cake and decoration", "Order the cake a week ahead.", 10],
    ["e-speech", "Prepare a few words", "A short thank-you to family and friends.", 3],
  ],
  Birthday: [
    ["b-guests", "Pick date, place and guests", "Check school holidays if it is a children’s party.", 30],
    ["b-food", "Plan food and drinks", "Ask about allergies when people reply.", 14],
    ["b-cake", "Order or bake the cake", "Bakeries need a few days’ notice for custom cakes.", 7],
    ["b-fun", "Games, music and decoration", "For children, plan one activity per half hour.", 5],
    ["b-setup", "Set up on the day", "Ask two helpers to come an hour early.", 0],
  ],
  "Baby shower": [
    ["s-guests", "Pick date, place and guests", "Usually a few weeks before the due date.", 45],
    ["s-wishlist", "Share a wish list", "Add a wish list link so gifts are not doubled.", 30],
    ["s-food", "Plan food and cake", "Keep it simple: finger food and one lovely cake.", 14],
    ["s-games", "Games and decoration", "Two or three easy games are enough.", 10],
    ["s-setup", "Set up on the day", "Ask two helpers to come an hour early.", 0],
  ],
  Graduation: [
    ["g-guests", "Decide date, place and guests", "Check the ceremony date before you fix the party.", 45],
    ["g-venue", "Reserve the venue", "Garden, restaurant or home: book or prepare early.", 30],
    ["g-food", "Food and drinks", "A buffet makes mingling easy.", 14],
    ["g-photos", "Collect photos from school days", "A small slideshow or photo wall is a lovely touch.", 10],
    ["g-speech", "Prepare a toast", "Two minutes is plenty.", 3],
  ],
  "Dinner party": [
    ["d-menu", "Plan the menu", "Ask guests about dietary needs when they reply.", 14],
    ["d-table", "Table setting and seating", "Candles, flowers and place cards.", 7],
    ["d-shop", "Shop for ingredients and wine", "Buy what keeps a few days ahead, fresh things the day before.", 2],
    ["d-prep", "Prepare what you can ahead", "Desserts and sauces often taste better the next day.", 1],
  ],
};

// When invitations should go out, in days before the day.
const SEND_BY = { Wedding: 120, Engagement: 30, Birthday: 21, "Baby shower": 30, Graduation: 30, "Dinner party": 14, Anniversary: 45, "Corporate event": 45, Christening: 30, "Seasonal celebration": 21 };
// Occasions without their own checklist use the six steps of their world,
// minus the invitation steps that Maison already tracks itself.
function fallback(occasion) {
  const w = eventWorlds.find((x) => x.occasion === occasion) || eventWorlds[0];
  const days = [90, 60, null, null, 14, 0];
  return w.tasks
    .map((title, i) => [occasion.slice(0, 3).toLowerCase() + "-" + i, title, "", days[i]])
    .filter((t) => t[3] !== null);
}
const DAY = 86400000;
const toDate = (d) => new Date(d + "T12:00:00");
export const daysUntil = (date, now = new Date()) =>
  Math.round((toDate(date) - new Date(now.toDateString() + " 12:00")) / DAY);
const iso = (d) => d.toISOString().slice(0, 10);
const minus = (date, days) => iso(new Date(toDate(date).getTime() - days * DAY));

// Builds the task list for an invitation. Maison steps (publish, guests,
// reminders) tick themselves from real data; the rest are ticked by the host.
export function buildTasks({ occasion, content, published, guests = [], plan = {} }) {
  const done = plan.done || {};
  const date = content.date;
  const replied = guests.filter((g) => g.response !== "pending").length;
  const send = SEND_BY[occasion] || 21;
  const auto = [
    ["m-design", "Choose and personalise your design", "Names, date, venue and a few warm words.", send + 7, true],
    ["m-publish", "Publish your invitation", "Publishing creates the link your guests open.", send, !!published],
    ["m-guests", "Add your guests and send their links", "Create a personal link for each guest or family.", send, guests.length > 0],
    ["m-nudge", "Follow up with guests who haven’t replied", "Copy their personal link and send a friendly reminder.",
      Math.max(0, daysUntil(date, toDate(content.rsvpDeadline)) + 5),
      guests.length > 0 && replied === guests.length],
  ].map(([id, title, text, days, isDone]) => ({ id, title, text, due: minus(date, days), done: isDone, auto: true }));
  const fromTemplate = (T[occasion] || fallback(occasion)).map(([id, title, text, days]) => ({
    id, title, text, due: minus(date, days), done: !!done[id],
  }));
  const own = (plan.custom || []).map((t) => ({ ...t, own: true, done: !!done[t.id] }));
  return [...auto, ...fromTemplate, ...own].sort((a, b) => a.due.localeCompare(b.due));
}

export function groupTasks(tasks, now = new Date()) {
  const today = iso(new Date(now.toDateString() + " 12:00"));
  const in30 = iso(new Date(new Date(today + "T12:00:00").getTime() + 30 * DAY));
  const g = { overdue: [], soon: [], later: [], done: [] };
  for (const t of tasks) {
    if (t.done) g.done.push(t);
    else if (t.due < today) g.overdue.push(t);
    else if (t.due <= in30) g.soon.push(t);
    else g.later.push(t);
  }
  return g;
}

export function guestFunnel(guests) {
  const opened = guests.filter((g) => g.opened_at || g.response !== "pending").length;
  const replied = guests.filter((g) => g.response !== "pending").length;
  const yes = guests.filter((g) => g.response === "yes");
  return {
    invited: guests.length,
    opened,
    replied,
    attending: yes.reduce((n, g) => n + (g.party_size || 1), 0),
    declined: guests.filter((g) => g.response === "no").length,
    waiting: guests.length - replied,
    tracksOpens: guests.some((g) => "opened_at" in g),
  };
}

export function milestones({ published, guests, tasks }) {
  const f = guestFunnel(guests);
  const open = tasks.filter((t) => !t.done).length;
  return [
    ["Designed", true],
    ["Published", !!published],
    ["Guests invited", f.invited > 0],
    ["Replies in", f.invited > 0 && f.waiting === 0],
    ["All set", tasks.length > 0 && open === 0],
  ];
}
