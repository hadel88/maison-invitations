export const BEACH_STEPS = ['doors', 'heart', 'ring', 'arch', 'rsvp'];
export function nextBeachStep(step, interaction) {
  return Number.isInteger(step) && step >= 0 && step < BEACH_STEPS.length && BEACH_STEPS[step] === interaction ? step + 1 : step;
}
export const BEACH_COPY = [
  { eyebrow: 'BEACH SUNSET ROMANCE', title: 'Maya & Arjun', text: 'Some love stories open a whole new world. Step into ours.', action: 'Open the golden doors' },
  { eyebrow: 'EVERY FOREVER HAS A BEGINNING', title: 'One beautiful coincidence.', text: 'A little camera. A thousand memories. Take a picture and step into our story.', action: 'Capture a memory' },
  { eyebrow: 'HOW THEY MET', title: 'A borrowed umbrella. A little destiny.', text: 'A seaside bookshop, a sudden shower, and a coffee that became a conversation neither wanted to end.', action: 'Open the ring box' },
  { eyebrow: 'THE PROPOSAL', title: 'One sunset. One question. One forever.', text: 'On the shore where they watched their first sunset, Arjun asked one small question. Maya said yes.', action: 'Reveal the invitation' },
  { eyebrow: 'TOGETHER WITH THEIR FAMILIES', title: 'Maya & Arjun', text: 'Joyfully invite you to celebrate their wedding by the sea.', action: 'RSVP' },
];
