import "server-only";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Profile, User } from "@/db/schema";
import { compatibility, rankScore } from "./compat";
import { EXPOSURE_CAP, EXPOSURE_CAP_LOW_RELIABILITY, INTROS_PER_DAY } from "./constants";
import { ageFrom, istDay } from "./time";

/*
 * Builds (once per day) the viewer's batch of up to 5 intros.
 * The batch is saved, so refreshing the page shows the same people all day.
 *
 * Hard filters -> compatibility score -> fair-exposure ranking -> top 5.
 * At demo scale we load one city's profiles into memory. In production this would be a
 * nightly job writing batches for everyone at once.
 */
export async function getTodayIntros(viewer: User, me: Profile) {
  const day = istDay();
  const existing = await db.select().from(schema.intros).where(and(eq(schema.intros.viewerId, viewer.id), eq(schema.intros.day, day)));
  if (existing.length > 0 || viewer.status !== "active") return existing;

  const myAge = ageFrom(me.birthDate);

  // Everyone in my city who finished onboarding and is visible
  const pool = await db
    .select({ user: schema.users, profile: schema.profiles })
    .from(schema.profiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
    .where(
      and(
        eq(schema.profiles.city, me.city),
        eq(schema.users.status, "active"),
        eq(schema.users.onboardingStep, "done"),
        eq(schema.users.role, "user"),
      ),
    );

  // People I must never see again: already introduced, blocked either way, already matched
  const seen = await db.select({ id: schema.intros.candidateId }).from(schema.intros).where(eq(schema.intros.viewerId, viewer.id));
  const blocked = await db
    .select()
    .from(schema.blocks)
    .where(or(eq(schema.blocks.blockerId, viewer.id), eq(schema.blocks.blockedId, viewer.id)));
  const matched = await db
    .select()
    .from(schema.matches)
    .where(or(eq(schema.matches.userA, viewer.id), eq(schema.matches.userB, viewer.id)));
  const exclude = new Set<string>([
    viewer.id,
    ...seen.map((s) => s.id),
    ...blocked.flatMap((b) => [b.blockerId, b.blockedId]),
    ...matched.flatMap((m) => [m.userA, m.userB]),
  ]);

  const sameCompany = (a?: string | null, b?: string | null) =>
    !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

  const eligible = pool.filter(({ user, profile }) => {
    if (exclude.has(user.id)) return false;
    if (!me.interestedIn.includes(profile.gender) || !profile.interestedIn.includes(me.gender)) return false;
    const age = ageFrom(profile.birthDate);
    if (age < me.ageMin || age > me.ageMax || myAge < profile.ageMin || myAge > profile.ageMax) return false;
    // "Hide me from my company": if either person turned it on, colleagues never see each other
    if ((me.hideFromCompany || profile.hideFromCompany) && sameCompany(me.company, profile.company)) return false;
    return true;
  });
  if (eligible.length === 0) return [];

  const ids = eligible.map((e) => e.user.id);

  // How many batches has each candidate already appeared in today?
  const shown = await db
    .select({ id: schema.intros.candidateId, n: sql<number>`count(*)::int` })
    .from(schema.intros)
    .where(and(inArray(schema.intros.candidateId, ids), eq(schema.intros.day, day)))
    .groupBy(schema.intros.candidateId);
  const shownMap = new Map(shown.map((s) => [s.id, s.n]));

  // How many people are waiting on each candidate's reply? (attention they already have)
  const pending = await db
    .select({ id: schema.intros.candidateId, n: sql<number>`count(*)::int` })
    .from(schema.intros)
    .where(and(inArray(schema.intros.candidateId, ids), eq(schema.intros.action, "interested")))
    .groupBy(schema.intros.candidateId);
  const pendingMap = new Map(pending.map((s) => [s.id, s.n]));

  // Who already said they're interested in me? (They get a nudge up, but we never reveal it.)
  const likedMe = await db
    .select({ id: schema.intros.viewerId })
    .from(schema.intros)
    .where(and(eq(schema.intros.candidateId, viewer.id), eq(schema.intros.action, "interested")));
  const likedMeSet = new Set(likedMe.map((l) => l.id));

  const ranked = eligible
    .filter(({ user }) => {
      const cap = user.noShows >= 2 ? EXPOSURE_CAP_LOW_RELIABILITY : EXPOSURE_CAP;
      return (shownMap.get(user.id) ?? 0) < cap;
    })
    .map(({ user, profile }) => {
      const c = compatibility(me, profile);
      return {
        candidateId: user.id,
        compat: c,
        rank: rankScore({
          compat: c.score,
          alreadyLikedMe: likedMeSet.has(user.id),
          pendingInbound: pendingMap.get(user.id) ?? 0,
          shownToday: shownMap.get(user.id) ?? 0,
        }),
      };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, INTROS_PER_DAY);

  if (ranked.length === 0) return [];
  return db
    .insert(schema.intros)
    .values(
      ranked.map((r) => ({
        viewerId: viewer.id,
        candidateId: r.candidateId,
        day,
        score: r.compat.score,
        reasons: r.compat.reasons,
      })),
    )
    .onConflictDoNothing()
    .returning();
}
