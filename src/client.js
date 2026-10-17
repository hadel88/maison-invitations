export async function api(action, { method = "GET", data, query = {} } = {}) {
  const q = new URLSearchParams({ action, ...query });
  let r;
  try {
    r = await fetch("/api/app?" + q, {
      method,
      credentials: "same-origin",
      ...(data
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        : {}),
    });
  } catch {
    // Browsers report a dropped connection as "Load failed" / "Failed to fetch"
    throw Object.assign(new Error("The connection was interrupted. Please try again."), { network: true });
  }
  const d = await r
    .json()
    .catch(() => ({ error: "Service unavailable. Please retry." }));
  if (!r.ok) throw new Error(d.error || "Something went wrong");
  return d;
}
export function download(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function calendar(e) {
  const esc = (v) =>
    String(v || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const start =
    e.date.replaceAll("-", "") + "T" + e.time.replace(":", "") + "00";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Maison//Invitation//EN",
    "BEGIN:VEVENT",
    "UID:" + crypto.randomUUID() + "@maison",
    "DTSTAMP:" +
      new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, ""),
    `DTSTART;TZID=${e.timezone}:${start}`,
    `SUMMARY:${esc(e.names)}`,
    `LOCATION:${esc(e.venue + ", " + e.address)}`,
    `DESCRIPTION:${esc(e.message)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
