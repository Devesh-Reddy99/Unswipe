"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { addSystemNote, createMatch, getMatchForUser, otherId } from "@/lib/matches";
import { personaFeedback, personaLikesBack } from "@/lib/personas";
import { maskContact } from "@/lib/safety";
import { compatibility } from "@/lib/compat";
import { EXTENSION_HOURS, REPORT_REASONS } from "@/lib/constants";
import { istDay } from "@/lib/time";
import type { FormState } from "./public";

/* ---------- Daily intros ---------- */

export async function respondToIntro(introId: string, action: "interested" | "passed") {
  const user = await requireUser();
  const [intro] = await db
    .select()
    .from(schema.intros)
    .where(and(eq(schema.intros.id, introId), eq(schema.intros.viewerId, user.id)));
  if (!intro || intro.action !== "pending") return { matched: false };

  await db.update(schema.intros).set({ action, actedAt: new Date() }).where(eq(schema.intros.id, intro.id));
  if (action === "passed") {
    revalidatePath("/app/today");
    return { matched: false };
  }

  // Is it mutual? Either they already said yes in their own intros...
  const [reverse] = await db
    .select()
    .from(schema.intros)
    .where(and(eq(schema.intros.viewerId, intro.candidateId), eq(schema.intros.candidateId, user.id)));
  let mutual = reverse?.action === "interested";

  // ...or (demo only) the candidate is a persona that would like you back.
  if (!mutual && !reverse) {
    const [cand] = await db.select().from(schema.users).where(eq(schema.users.id, intro.candidateId));
    if (cand?.isPersona && personaLikesBack(intro.score)) {
      const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, cand.id));
      const [mine] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
      const c = compatibility(p, mine);
      await db
        .insert(schema.intros)
        .values({ viewerId: cand.id, candidateId: user.id, day: istDay(), score: c.score, reasons: c.reasons, action: "interested", actedAt: new Date() })
        .onConflictDoNothing();
      mutual = true;
    }
  }

  let matchId: string | undefined;
  if (mutual) matchId = (await createMatch(user.id, intro.candidateId))?.id;
  revalidatePath("/app/today");
  revalidatePath("/app/matches");
  return { matched: mutual, matchId };
}

/* ---------- Chat ---------- */

export async function sendMessage(matchId: string, body: string) {
  const user = await requireUser();
  const match = await getMatchForUser(matchId, user.id);
  if (!match || match.status === "expired" || match.status === "closed") return { error: "This conversation is closed." };
  const text = body.trim().slice(0, 1000);
  if (!text) return { error: "Write something first." };
  // Contact details stay hidden until a date is confirmed (anti-scam).
  const unlocked = match.status === "planned" || match.secondDateUnlocked;
  const { text: safe, masked } = unlocked ? { text, masked: false } : maskContact(text);
  await db.insert(schema.messages).values({ matchId, senderId: user.id, body: safe, masked });
  return { ok: true, masked };
}

/* ---------- Date planning ---------- */

const planSchema = z.object({
  venueId: z.string().min(1, "Pick a place"),
  slots: z.array(z.string().datetime()).min(1, "Offer at least one time").max(3, "Offer up to three times"),
  note: z.string().trim().max(200).optional(),
});

export async function proposePlan(matchId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const match = await getMatchForUser(matchId, user.id);
  if (!match || match.status !== "active") return { error: "You can only plan a date on an open match." };
  const parsed = planSchema.safeParse({ venueId: form.get("venueId"), slots: form.getAll("slots"), note: form.get("note") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.slots.some((s) => new Date(s) < new Date())) return { error: "Pick times in the future." };
  const [venue] = await db.select().from(schema.venues).where(eq(schema.venues.id, parsed.data.venueId));
  if (!venue) return { error: "That place isn't available." };

  // A new proposal replaces any open one
  await db
    .update(schema.datePlans)
    .set({ status: "cancelled" })
    .where(and(eq(schema.datePlans.matchId, matchId), eq(schema.datePlans.status, "proposed")));
  await db.insert(schema.datePlans).values({
    matchId,
    proposerId: user.id,
    venueId: venue.id,
    slots: parsed.data.slots.sort(),
    note: parsed.data.note,
    shareToken: randomBytes(12).toString("base64url"),
  });
  const [me] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  await addSystemNote(matchId, `${me.name} suggested a date at ${venue.name}, ${venue.area}.`);
  revalidatePath(`/app/matches/${matchId}`);
  return { ok: true };
}

export async function acceptSlot(planId: string, slot: string) {
  const user = await requireUser();
  const [plan] = await db.select().from(schema.datePlans).where(eq(schema.datePlans.id, planId));
  if (!plan || plan.status !== "proposed" || plan.proposerId === user.id) return;
  const match = await getMatchForUser(plan.matchId, user.id);
  if (!match || match.status !== "active" || !plan.slots.includes(slot)) return;
  await db.update(schema.datePlans).set({ status: "confirmed", chosenSlot: new Date(slot), respondedAt: new Date() }).where(eq(schema.datePlans.id, plan.id));
  await db.update(schema.matches).set({ status: "planned" }).where(eq(schema.matches.id, match.id));
  await addSystemNote(match.id, "Date confirmed! You can now share numbers in chat if you want to. Tip: send the plan to a friend.");
  revalidatePath(`/app/matches/${match.id}`);
}

export async function declinePlan(planId: string) {
  const user = await requireUser();
  const [plan] = await db.select().from(schema.datePlans).where(eq(schema.datePlans.id, planId));
  if (!plan || plan.status !== "proposed" || plan.proposerId === user.id) return;
  const match = await getMatchForUser(plan.matchId, user.id);
  if (!match) return;
  await db.update(schema.datePlans).set({ status: "declined", respondedAt: new Date() }).where(eq(schema.datePlans.id, plan.id));
  await addSystemNote(match.id, "Those times didn't work. Suggest a different place or time below.");
  revalidatePath(`/app/matches/${match.id}`);
}

export async function cancelDate(planId: string) {
  const user = await requireUser();
  const [plan] = await db.select().from(schema.datePlans).where(eq(schema.datePlans.id, planId));
  if (!plan || plan.status !== "confirmed") return;
  const match = await getMatchForUser(plan.matchId, user.id);
  if (!match) return;
  await db.update(schema.datePlans).set({ status: "cancelled" }).where(eq(schema.datePlans.id, plan.id));
  // Cancelling reopens a short window to re-plan instead of ending the match.
  await db
    .update(schema.matches)
    .set({ status: "active", expiresAt: new Date(Date.now() + EXTENSION_HOURS * 36e5) })
    .where(eq(schema.matches.id, match.id));
  const [me] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  await addSystemNote(match.id, `${me.name} cancelled the date. You have ${EXTENSION_HOURS} hours to pick a new time.`);
  revalidatePath(`/app/matches/${match.id}`);
}

export async function requestExtension(matchId: string) {
  const user = await requireUser();
  const match = await getMatchForUser(matchId, user.id);
  if (!match || match.status !== "active" || match.extended || match.extendRequests.includes(user.id)) return;
  const reqs = [...match.extendRequests, user.id];
  if (reqs.length >= 2) {
    await db
      .update(schema.matches)
      .set({ extendRequests: reqs, extended: true, expiresAt: new Date(match.expiresAt.getTime() + EXTENSION_HOURS * 36e5) })
      .where(eq(schema.matches.id, matchId));
    await addSystemNote(matchId, `You both asked for more time, so the window was extended by ${EXTENSION_HOURS} hours.`);
  } else {
    await db.update(schema.matches).set({ extendRequests: reqs }).where(eq(schema.matches.id, matchId));
    await addSystemNote(matchId, `One of you asked for ${EXTENSION_HOURS} more hours. It's added when you both ask.`);
  }
  revalidatePath(`/app/matches/${matchId}`);
}

/** DEMO ONLY: move a confirmed date into the past so evaluators can try the check-in. */
export async function demoSkipToAfterDate(planId: string) {
  const user = await requireUser();
  const [plan] = await db.select().from(schema.datePlans).where(eq(schema.datePlans.id, planId));
  if (!plan || plan.status !== "confirmed") return;
  const match = await getMatchForUser(plan.matchId, user.id);
  if (!match) return;
  await db.update(schema.datePlans).set({ chosenSlot: new Date(Date.now() - 3 * 36e5) }).where(eq(schema.datePlans.id, planId));
  revalidatePath(`/app/matches/${match.id}`);
}

/* ---------- After the date ---------- */

const feedbackSchema = z.object({
  met: z.enum(["yes", "they_no_show", "cancelled"]),
  again: z.enum(["yes", "no"]).optional(),
  feltSafe: z.enum(["yes", "no"]).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function submitFeedback(planId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = feedbackSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Tell us whether you met." };
  const [plan] = await db.select().from(schema.datePlans).where(eq(schema.datePlans.id, planId));
  if (!plan || plan.status !== "confirmed") return { error: "No date to review." };
  const match = await getMatchForUser(plan.matchId, user.id);
  if (!match) return { error: "No date to review." };
  const other = otherId(match, user.id);
  const f = parsed.data;
  const met = f.met === "yes";

  await db
    .insert(schema.feedback)
    .values({
      planId,
      userId: user.id,
      met: f.met,
      again: met && f.again === "yes",
      feltSafe: f.feltSafe !== "no",
      note: f.note,
    })
    .onConflictDoNothing();

  // Consequences (kept private: the other person never sees your answers)
  if (f.met === "they_no_show") {
    const [o] = await db.select().from(schema.users).where(eq(schema.users.id, other));
    await db.update(schema.users).set({ noShows: (o?.noShows ?? 0) + 1 }).where(eq(schema.users.id, other));
  }
  if (f.feltSafe === "no") {
    await db.insert(schema.reports).values({
      reporterId: user.id,
      reportedId: other,
      reason: "Felt unsafe on the date",
      details: f.note ?? "Reported through the post-date check-in.",
      priority: "urgent",
    });
  }

  // Demo personas answer too, so the "second date" outcome can be seen
  const [o] = await db.select().from(schema.users).where(eq(schema.users.id, other));
  if (o?.isPersona && met) {
    const [intro] = await db
      .select()
      .from(schema.intros)
      .where(and(eq(schema.intros.viewerId, user.id), eq(schema.intros.candidateId, other)));
    await personaFeedback(planId, other, intro?.score ?? 70);
  }

  // Both want to meet again -> unlock second date planning
  const all = await db.select().from(schema.feedback).where(eq(schema.feedback.planId, planId));
  if (all.length === 2 && all.every((x) => x.again)) {
    await db.update(schema.matches).set({ secondDateUnlocked: true, status: "active", expiresAt: new Date(Date.now() + 7 * 864e5) }).where(eq(schema.matches.id, match.id));
    await addSystemNote(match.id, "You both want to meet again 🎉 Plan your second date whenever you like.");
  }
  revalidatePath(`/app/matches/${match.id}`);
  return { ok: true };
}

/* ---------- Safety ---------- */

export async function unmatch(matchId: string) {
  const user = await requireUser();
  const match = await getMatchForUser(matchId, user.id);
  if (!match) return;
  await db.update(schema.matches).set({ status: "closed" }).where(eq(schema.matches.id, matchId));
  await addSystemNote(matchId, "This match was closed.");
  redirect("/app/matches");
}

export async function blockAndReport(matchId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const match = await getMatchForUser(matchId, user.id);
  if (!match) return { error: "Match not found." };
  const reason = String(form.get("reason") ?? "");
  if (!REPORT_REASONS.includes(reason)) return { error: "Choose a reason." };
  const other = otherId(match, user.id);
  const urgent = /money|unsafe|harass/i.test(reason);
  await db.insert(schema.reports).values({
    reporterId: user.id,
    reportedId: other,
    reason,
    details: String(form.get("details") ?? "").slice(0, 1000) || null,
    priority: urgent ? "urgent" : "normal",
  });
  await db.insert(schema.blocks).values({ blockerId: user.id, blockedId: other }).onConflictDoNothing();
  await db.update(schema.matches).set({ status: "closed" }).where(eq(schema.matches.id, matchId));
  redirect("/app/matches?reported=1");
}
