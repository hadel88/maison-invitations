import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  templates,
  occasions,
  defaultEvent,
  dateLabel,
} from "../src/catalog.js";
import { calendar } from "../src/client.js";
import { verifySignature } from "../api/stripe-webhook.js";
test("every occasion has multiple designs with unique identifiers", () => {
  assert.equal(new Set(templates.map((t) => t.id)).size, templates.length);
  for (const occasion of occasions.slice(1))
    assert.ok(
      templates.filter((t) => t.occasion === occasion).length >= 2,
      occasion,
    );
});
test("invitation dates remain the selected calendar day in all locales", () => {
  assert.equal(dateLabel("2027-06-19", "en"), "19 June 2027");
  assert.match(dateLabel("2027-06-19", "de"), /19.*Juni.*2027/);
  assert.match(dateLabel("2027-06-19", "fr"), /19.*juin.*2027/);
});
test("calendar preserves European event timezone and escapes injected lines", () => {
  const e = defaultEvent();
  e.names = "Hello\nEND:VEVENT";
  const text = calendar(e);
  assert.match(text, /DTSTART;TZID=Europe\/Berlin:20270619T160000/);
  assert.ok(text.includes("SUMMARY:Hello\\nEND:VEVENT"));
  assert.equal(text.split("\r\nEND:VEVENT").length, 2);
});
test("Stripe webhook rejects tampering, stale signatures and missing secrets", () => {
  const raw = '{"type":"checkout.session.completed"}',
    secret = "test-secret",
    t = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret)
    .update(t + "." + raw)
    .digest("hex");
  const header = `t=${t},v1=${signature}`;
  assert.ok(verifySignature(raw, header, secret));
  assert.ok(!verifySignature(raw + " ", header, secret));
  assert.ok(!verifySignature(raw, header, secret, Date.now() + 601000));
  assert.ok(!verifySignature(raw, header, ""));
  assert.ok(!verifySignature(raw, `t=${t},v1=bad`, secret));
});
