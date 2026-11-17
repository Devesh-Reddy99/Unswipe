import "server-only";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Match } from "@/db/schema";
import { PLAN_WINDOW_HOURS } from "./constants";

export const otherId = (m: Pick<Match, "userA" | "userB">, me: string) => (m.userA === me ? m.userB : m.userA);

export async function addSystemNote(matchId: string, body: string) {
  await db.insert(schema.messages).values({ matchId, senderId: null, body });
}

/** Create a match (ids sorted so the pair is unique) and open the 72-hour plan window. */
export async function createMatch(a: string, b: string) {
  const [userA, userB] = [a, b].sort();
  const expiresAt = new Date(Date.now() + PLAN_WINDOW_HOURS * 36e5);
  const rows = await db.insert(schema.matches).values({ userA, userB, expiresAt }).onConflictDoNothing().returning();
  if (rows[0]) {
    await addSystemNote(
      rows[0].id,
      `You matched! You have ${PLAN_WINDOW_HOURS} hours to agree on a first date. Say hi, then use "Plan a date" below.`,
    );
  }
  return rows[0];
}

/** Matches expire lazily: we check the clock whenever a match is read. */
export async function refreshExpiry(m: Match): Promise<Match> {
  if (m.status === "active" && m.expiresAt < new Date()) {
    const [u] = await db.update(schema.matches).set({ status: "expired" }).where(eq(schema.matches.id, m.id)).returning();
    await addSystemNote(m.id, "This match expired because no date was agreed in time. No hard feelings, new intros arrive daily.");
    return u;
  }
  return m;
}

export async function getMatchForUser(matchId: string, userId: string) {
  const [m] = await db
    .select()
    .from(schema.matches)
    .where(and(eq(schema.matches.id, matchId), or(eq(schema.matches.userA, userId), eq(schema.matches.userB, userId))));
  return m ? refreshExpiry(m) : null;
}

export async function listMatches(userId: string) {
  const rows = await db
    .select()
    .from(schema.matches)
    .where(or(eq(schema.matches.userA, userId), eq(schema.matches.userB, userId)))
    .orderBy(desc(schema.matches.createdAt));
  const fresh = await Promise.all(rows.map(refreshExpiry));
  const ids = fresh.map((m) => otherId(m, userId));
  const profiles = ids.length
    ? await db.select().from(schema.profiles).where(inArray(schema.profiles.userId, ids))
    : [];
  const plans = fresh.length
    ? await db
        .select()
        .from(schema.datePlans)
        .where(inArray(schema.datePlans.matchId, fresh.map((m) => m.id)))
        .orderBy(desc(schema.datePlans.createdAt))
    : [];
  const lastMsgs = fresh.length
    ? await db
        .select()
        .from(schema.messages)
        .where(inArray(schema.messages.matchId, fresh.map((m) => m.id)))
        .orderBy(desc(schema.messages.createdAt))
    : [];
  return fresh.map((m) => ({
    match: m,
    other: profiles.find((p) => p.userId === otherId(m, userId))!,
    plan: plans.find((p) => p.matchId === m.id) ?? null,
    last: lastMsgs.find((x) => x.matchId === m.id) ?? null,
  }));
}
