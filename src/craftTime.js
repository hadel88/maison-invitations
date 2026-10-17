export function eventInstant(date, time = '12:00', timezone = 'Europe/Paris') {
  const [year, month, day] = String(date).split('-').map(Number);
  const [hour, minute] = String(time).split(':').map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  if (!Number.isFinite(wall)) return NaN;
  try {
    const format = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    let instant = wall;
    for (let i = 0; i < 2; i++) {
      const parts = Object.fromEntries(format.formatToParts(instant).map(p => [p.type, p.value]));
      const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
      instant += wall - shown;
    }
    return instant;
  } catch { return wall; }
}

export function countdownParts(target, now) {
  const total = Number.isFinite(target) ? Math.max(0, Math.floor((target - now) / 60000)) : 0;
  return [Math.floor(total / 1440), Math.floor(total / 60) % 24, total % 60];
}
