import { createHmac, timingSafeEqual } from "node:crypto";
export const config = { api: { bodyParser: false } };
export function verifySignature(raw, header, secret, now = Date.now()) {
  if (!secret || !header) return false;
  const parts = header.split(",").map((x) => x.split("="));
  const t = parts.find((x) => x[0] === "t")?.[1];
  if (!t || Math.abs(now / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${t}.${raw}`)
    .digest("hex");
  return parts
    .filter((x) => x[0] === "v1")
    .some(
      ([, sig]) =>
        /^[a-f0-9]{64}$/.test(sig) &&
        timingSafeEqual(Buffer.from(sig), Buffer.from(expected)),
    );
}
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (
    !process.env.STRIPE_WEBHOOK_SECRET ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return res
      .status(503)
      .json({ error: "Payment fulfillment is not configured" });
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 1048576) return res.status(413).end();
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString();
  if (
    !verifySignature(
      raw,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  )
    return res.status(400).json({ error: "Invalid signature" });
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return res.status(400).end();
  }
  if (
    [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ].includes(event.type)
  ) {
    const s = event.data.object;
    const amounts = { essential: 1900, signature: 2900, celebration: 4900 };
    if (
      s.payment_status !== "paid" ||
      s.currency !== "eur" ||
      s.amount_total !== amounts[s.metadata?.plan]
    )
      return res.status(400).json({ error: "Payment mismatch" });
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const base = process.env.SUPABASE_URL;
    const owner = await fetch(
      `${base}/rest/v1/maison_invitations?id=eq.${encodeURIComponent(s.metadata.invitation_id)}&owner_id=eq.${encodeURIComponent(s.metadata.owner_id)}&select=id`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    const rows = await owner.json();
    if (!owner.ok || !rows.length) return res.status(400).end();
    const r = await fetch(
      `${base}/rest/v1/maison_orders?on_conflict=stripe_session_id`,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates",
        },
        body: JSON.stringify({
          stripe_session_id: s.id,
          owner_id: s.metadata.owner_id,
          invitation_id: s.metadata.invitation_id,
          amount: s.amount_total,
          currency: s.currency,
        }),
      },
    );
    if (!r.ok)
      return res
        .status(500)
        .json({ error: "Fulfillment failed; retry required" });
  }
  return res.json({ received: true });
}
