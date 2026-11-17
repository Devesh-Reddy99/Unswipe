import { QUESTIONS, INTENTS, AVAILABILITY, DATE_STYLES } from "./constants";
import type { Answer } from "@/db/schema";

/*
 * Compatibility score (0-100) + human-readable reasons.
 * Pure function with no database access, so it is easy to test and explain.
 *
 *   50%  values questions (weighted by how much each person cares)
 *   20%  relationship intent
 *   15%  preferred date style
 *   10%  availability overlap (can you actually meet?)
 *    5%  shared language
 */

export type CompatInput = {
  answers: Record<string, Answer>;
  intent: keyof typeof INTENTS;
  dateStyles: string[];
  availability: string[];
  languages: string[];
};

const INTENT_FIT: Record<string, number> = {
  "long_term|long_term": 1,
  "marriage|marriage": 1,
  "open|open": 1,
  "long_term|marriage": 0.7,
  "long_term|open": 0.5,
  "marriage|open": 0.2,
};

function intentFit(a: string, b: string) {
  return INTENT_FIT[`${a}|${b}`] ?? INTENT_FIT[`${b}|${a}`] ?? 0;
}

function overlap(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const shared = a.filter((x) => b.includes(x)).length;
  return shared / new Set([...a, ...b]).size; // Jaccard similarity
}

export function compatibility(me: CompatInput, them: CompatInput): { score: number; reasons: string[] } {
  // 1. Values
  let weighted = 0;
  let totalWeight = 0;
  const sharedStrong: { text: string; weight: number }[] = [];
  for (const q of QUESTIONS) {
    const a = me.answers[q.id];
    const b = them.answers[q.id];
    if (!a || !b) continue;
    const weight = (a.w + b.w) / 2 + 0.5; // even "doesn't matter" counts a little
    let sim: number;
    if (q.kind === "pick") sim = a.a === b.a ? 1 : 0;
    else sim = 1 - Math.abs(a.a - b.a) / (q.options.length - 1);
    weighted += sim * weight;
    totalWeight += weight;
    if (a.a === b.a) sharedStrong.push({ text: q.short[a.a], weight });
  }
  const values = totalWeight ? weighted / totalWeight : 0.5;

  // 2-5. Intent, date style, availability, language
  const intent = intentFit(me.intent, them.intent);
  const style = overlap(me.dateStyles, them.dateStyles);
  const avail = overlap(me.availability, them.availability);
  const lang = me.languages.some((l) => them.languages.includes(l)) ? 1 : 0.3;

  const score = Math.round(100 * (0.5 * values + 0.2 * intent + 0.15 * style + 0.1 * avail + 0.05 * lang));

  // Reasons: the most important things you agree on, written plainly.
  const reasons: string[] = [];
  sharedStrong
    .sort((x, y) => y.weight - x.weight)
    .slice(0, 2)
    .forEach((s) => reasons.push(`You're both ${s.text}`));
  if (me.intent === them.intent) reasons.push(`Same goal: ${INTENTS[me.intent].toLowerCase()}`);
  const sharedStyle = me.dateStyles.find((s) => them.dateStyles.includes(s));
  if (sharedStyle) reasons.push(`Both up for ${DATE_STYLES[sharedStyle as keyof typeof DATE_STYLES].toLowerCase()}`);
  const sharedAvail = me.availability.find((s) => them.availability.includes(s));
  if (sharedAvail) reasons.push(`Both free on ${AVAILABILITY[sharedAvail as keyof typeof AVAILABILITY].toLowerCase()}`);
  const sharedLang = me.languages.find((l) => l !== "English" && them.languages.includes(l));
  if (sharedLang) reasons.push(`You both speak ${sharedLang}`);

  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 4) };
}

/*
 * Fair-exposure ranking.
 * Popular profiles are shown less once they already have lots of attention, so
 * nobody gets flooded and everyone else gets seen.
 */
export function rankScore(opts: {
  compat: number;
  alreadyLikedMe: boolean;
  pendingInbound: number; // people waiting on this person's reply
  shownToday: number;
}) {
  let s = opts.compat;
  if (opts.alreadyLikedMe) s += 10; // surface likely mutual interest, without a paywall
  s -= 4 * Math.max(0, opts.pendingInbound - 5);
  s -= 2 * opts.shownToday;
  return s;
}
