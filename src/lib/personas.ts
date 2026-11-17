import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Match } from "@/db/schema";
import { addSystemNote, otherId } from "./matches";
import { AVAILABILITY } from "./constants";

/*
 * DEMO ONLY. Seeded "persona" profiles respond automatically so a single evaluator
 * can experience the whole loop (match -> chat -> plan -> date -> feedback) alone.
 * Personas are clearly labelled in the UI. Real users never auto-respond.
 */

const REPLY_DELAY_MS = 3000;

const REPLIES = [
  "Hey {me}! Nice to match 😊 Your answers made me smile. Want to plan something? I'm usually free on {avail}.",
  "Haha, fair point. Pick a spot you like in the planner and send me a couple of times?",
  "That sounds lovely. Honestly, I'm tired of chatting for weeks. Meeting is so much easier.",
  "Ha, I'll tell you that story in person 😄",
  "Perfect, see you then!",
];

/** Would this persona be interested back? Simple, predictable rule for demos. */
export function personaLikesBack(score: number) {
  return score >= 50;
}

/** Called whenever a real user opens/polls a match with a persona. */
export async function personaTick(match: Match, meId: string) {
  const personaId = otherId(match, meId);
  const [persona] = await db.select().from(schema.users).where(eq(schema.users.id, personaId));
  if (!persona?.isPersona || match.status === "expired" || match.status === "closed") return;

  const now = Date.now();
  const [me] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, meId));
  const [pp] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, personaId));

  // 1. Reply to an unanswered message after a short delay
  const msgs = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.matchId, match.id))
    .orderBy(asc(schema.messages.createdAt));
  const human = msgs.filter((m) => m.senderId);
  const last = human[human.length - 1];
  if (last && last.senderId === meId && now - last.createdAt.getTime() > REPLY_DELAY_MS) {
    const sent = human.filter((m) => m.senderId === personaId).length;
    const avail = pp?.availability[0] ? AVAILABILITY[pp.availability[0] as keyof typeof AVAILABILITY].toLowerCase() : "weekends";
    const body = REPLIES[Math.min(sent, REPLIES.length - 2)]
      .replace("{me}", me?.name ?? "there")
      .replace("{avail}", avail);
    await db.insert(schema.messages).values({ matchId: match.id, senderId: personaId, body });
  }

  // 2. Accept a date the user proposed (first offered slot)
  const [plan] = await db
    .select()
    .from(schema.datePlans)
    .where(eq(schema.datePlans.matchId, match.id))
    .orderBy(desc(schema.datePlans.createdAt))
    .limit(1);
  if (plan && plan.status === "proposed" && plan.proposerId === meId && now - plan.createdAt.getTime() > REPLY_DELAY_MS) {
    await db
      .update(schema.datePlans)
      .set({ status: "confirmed", chosenSlot: new Date(plan.slots[0]), respondedAt: new Date() })
      .where(eq(schema.datePlans.id, plan.id));
    await db.update(schema.matches).set({ status: "planned" }).where(eq(schema.matches.id, match.id));
    await addSystemNote(match.id, `${pp?.name ?? "They"} accepted. Your date is confirmed! Contact details are now visible in chat.`);
    await db.insert(schema.messages).values({ matchId: match.id, senderId: personaId, body: REPLIES[4] });
  }

  // 3. Agree to an extension the user asked for
  if (match.status === "active" && match.extendRequests.includes(meId) && !match.extended) {
    await db
      .update(schema.matches)
      .set({ extendRequests: [meId, personaId], extended: true, expiresAt: new Date(match.expiresAt.getTime() + 48 * 36e5) })
      .where(eq(schema.matches.id, match.id));
    await addSystemNote(match.id, "You both asked for more time, so the window was extended by 48 hours.");
  }
}

/** After the user leaves feedback on a date with a persona, the persona leaves theirs too. */
export async function personaFeedback(planId: string, personaId: string, score: number) {
  const [existing] = await db
    .select()
    .from(schema.feedback)
    .where(and(eq(schema.feedback.planId, planId), eq(schema.feedback.userId, personaId)));
  if (existing) return;
  await db.insert(schema.feedback).values({ planId, userId: personaId, met: "yes", again: score >= 60, feltSafe: true });
}
