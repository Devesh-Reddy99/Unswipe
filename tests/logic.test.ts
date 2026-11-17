import { test } from "node:test";
import assert from "node:assert/strict";
import { compatibility, rankScore } from "../src/lib/compat";
import { maskContact } from "../src/lib/safety";
import { istAt, istDay, ageFrom } from "../src/lib/time";

const base = {
  answers: { sunday: { a: 0, w: 2 }, money: { a: 1, w: 1 }, kids: { a: 0, w: 2 } },
  intent: "long_term" as const,
  dateStyles: ["coffee", "walk"],
  availability: ["sat"],
  languages: ["English", "Telugu"],
};

test("identical people score high with reasons", () => {
  const r = compatibility(base, base);
  assert.ok(r.score >= 95, `score ${r.score}`);
  assert.ok(r.reasons.some((x) => x.includes("outdoor")));
  assert.ok(r.reasons.length <= 4 && r.reasons.some((x) => x.startsWith("Same goal")));
});

test("opposite people score low", () => {
  const other = {
    answers: { sunday: { a: 3, w: 2 }, money: { a: 2, w: 2 }, kids: { a: 2, w: 2 } },
    intent: "open" as const,
    dateStyles: ["activity"],
    availability: ["weekday_eve"],
    languages: ["Hindi"],
  };
  const r = compatibility(base, other);
  assert.ok(r.score < 40, `score ${r.score}`);
});

test("score is symmetric", () => {
  const other = { ...base, intent: "marriage" as const, answers: { sunday: { a: 1, w: 0 }, money: { a: 2, w: 1 } } };
  assert.equal(compatibility(base, other).score, compatibility(other, base).score);
});

test("fair exposure pushes down people with many pending likes", () => {
  const calm = rankScore({ compat: 80, alreadyLikedMe: false, pendingInbound: 0, shownToday: 0 });
  const flooded = rankScore({ compat: 80, alreadyLikedMe: false, pendingInbound: 12, shownToday: 4 });
  assert.ok(flooded < calm - 20);
});

test("contact details are masked", () => {
  for (const s of ["call me 98765 43210", "+91-9876543210", "mail me a@b.com", "insta @someone_123", "https://wa.me/123"]) {
    const r = maskContact(s);
    assert.ok(r.masked, s);
    assert.ok(!/\d{5}/.test(r.text), r.text);
  }
  assert.equal(maskContact("see you at 7:30 near the metro").masked, false);
});

test("IST helpers", () => {
  const now = new Date("2026-11-17T20:00:00Z"); // 01:30 IST on 18 Nov
  assert.equal(istDay(now), "2026-11-18");
  assert.equal(istAt(0, 19, 30, now).toISOString(), "2026-11-18T14:00:00.000Z");
  assert.equal(ageFrom("2000-11-18", now), 25);
});

import { suggestSlots } from "../src/lib/slots";
test("slot suggestions respect shared availability and notice", () => {
  const now = new Date("2026-11-17T13:30:00Z"); // Tue 19:00 IST
  const s = suggestSlots(["sat", "weekday_eve"], ["sat"], now);
  assert.ok(s.length >= 2);
  for (const x of s) assert.equal(new Date(x.iso).getUTCDay() === 6 || new Date(x.iso).getUTCDay() === 5, true); // Sat IST (UTC may be Sat)
  assert.ok(new Date(s[0].iso).getTime() - now.getTime() >= 3 * 36e5);
});
