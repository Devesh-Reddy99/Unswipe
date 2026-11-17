"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { db, schema } from "@/db";
import { destroySession, requireUser } from "@/lib/auth";
import type { FormState } from "./public";

/* ---------- Socials ---------- */

export async function bookTicket(eventId: string) {
  const user = await requireUser();
  const [ev] = await db.select().from(schema.events).where(eq(schema.events.id, eventId));
  const [me] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  if (!ev || ev.startsAt < new Date() || ev.city !== me.city) return { error: "This social isn't available." };
  // Equal seats for men and women keep every room balanced; non-binary guests take whichever side has room
  const counts = await db
    .select({ gender: schema.profiles.gender, n: sql<number>`count(*)::int` })
    .from(schema.tickets)
    .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.tickets.userId))
    .where(eq(schema.tickets.eventId, eventId))
    .groupBy(schema.profiles.gender);
  const n = (g: string) => counts.find((c) => c.gender === g)?.n ?? 0;
  const nb = n("nonbinary");
  const full =
    me.gender === "nonbinary"
      ? n("man") + n("woman") + nb >= ev.seatsPerSide * 2
      : n(me.gender) >= ev.seatsPerSide;
  if (full) return { error: "Seats for your side are full. We keep rooms balanced, so join the next one." };
  await db.insert(schema.tickets).values({ eventId, userId: user.id, amountInr: ev.priceInr }).onConflictDoNothing();
  revalidatePath("/app/events");
  return { ok: true };
}

export async function cancelTicket(eventId: string) {
  const user = await requireUser();
  await db.delete(schema.tickets).where(and(eq(schema.tickets.eventId, eventId), eq(schema.tickets.userId, user.id)));
  revalidatePath("/app/events");
}

/* ---------- Settings ---------- */

export async function setSnooze(on: boolean) {
  const user = await requireUser();
  if (user.status === "suspended") return;
  await db.update(schema.users).set({ status: on ? "snoozed" : "active" }).where(eq(schema.users.id, user.id));
  revalidatePath("/app", "layout");
}

export async function setHideFromCompany(on: boolean) {
  const user = await requireUser();
  await db.update(schema.profiles).set({ hideFromCompany: on }).where(eq(schema.profiles.userId, user.id));
  revalidatePath("/app/me");
}

export async function setPlus(on: boolean) {
  const user = await requireUser();
  await db.update(schema.users).set({ plus: on }).where(eq(schema.users.id, user.id));
  revalidatePath("/app/me");
}

/* Work email badge. Production: email a 6-digit code. Demo: the code is shown on screen. */
const workSchema = z.object({ workEmail: z.string().trim().toLowerCase().email("Enter your work email") });
const FREE_MAIL = /@(gmail|yahoo|outlook|hotmail|icloud|proton|rediffmail)\./i;

export async function sendWorkCode(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = workSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (FREE_MAIL.test(parsed.data.workEmail)) return { error: "Use your company email, not a personal one." };
  const code = String(randomInt(100000, 999999));
  await db
    .update(schema.users)
    .set({ workEmail: parsed.data.workEmail, workEmailCode: code, workEmailVerified: false })
    .where(eq(schema.users.id, user.id));
  return { ok: true, message: code };
}

export async function confirmWorkCode(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const code = String(form.get("code") ?? "").trim();
  if (!user.workEmailCode || code !== user.workEmailCode) return { error: "That code doesn't match. Check and try again." };
  await db.update(schema.users).set({ workEmailVerified: true, workEmailCode: null }).where(eq(schema.users.id, user.id));
  revalidatePath("/app/me");
  return { ok: true, message: "Work email verified." };
}

/* DPDP: withdrawing consent must be as easy as giving it. Deleting removes everything (cascade). */
export async function deleteAccount(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (form.get("confirm") !== "DELETE") return { error: 'Type DELETE in capitals to confirm.' };
  if (user.isDemo) return { error: "Shared demo accounts can't be deleted. Create your own account to try this." };
  await destroySession();
  await db.delete(schema.users).where(eq(schema.users.id, user.id));
  redirect("/?deleted=1");
}
