// Lettering for the names on the invitation. The default font is already loaded
// with the site; the others load from Google Fonts only when an invitation uses them.
export const FONTS = [
  { id: "classic", name: "Classic", family: "'Cormorant Garamond', Georgia, serif", google: null },
  { id: "playfair", name: "Elegant", family: "'Playfair Display', Georgia, serif", google: "Playfair+Display:ital,wght@0,400;0,500;1,400" },
  { id: "cinzel", name: "Regal", family: "'Cinzel', Georgia, serif", google: "Cinzel:wght@400;500" },
  { id: "vibes", name: "Script", family: "'Great Vibes', cursive", google: "Great+Vibes" },
  { id: "parisienne", name: "Parisienne", family: "'Parisienne', cursive", google: "Parisienne" },
  { id: "marcellus", name: "Modern", family: "'Marcellus', Georgia, serif", google: "Marcellus" },
];
export const fontFor = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
export function ensureFont(id) {
  const f = fontFor(id);
  if (!f.google || typeof document === "undefined") return f;
  const key = "maison-font-" + f.id;
  if (!document.getElementById(key)) {
    const link = document.createElement("link");
    link.id = key;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
    document.head.appendChild(link);
  }
  return f;
}
export function ensureAllFonts() {
  FONTS.forEach((f) => ensureFont(f.id));
}
