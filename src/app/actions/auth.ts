"use server";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkPassword, createSession, destroySession, hashPassword } from "@/lib/auth";
import type { FormState } from "./public";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;
  const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (exists) return { error: "An account with this email already exists. Sign in instead." };
  const [user] = await db
    .insert(schema.users)
    .values({ email, passwordHash: await hashPassword(password) })
    .returning();
  await createSession(user.id);
  redirect("/onboarding/verify");
}

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

function lockedMessage(until: Date) {
  const mins = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60_000));
  return `Too many wrong passwords. For your safety this account is locked for ${mins} minute${mins === 1 ? "" : "s"}.`;
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  // Brute-force protection for real accounts. Demo accounts are left out on purpose: their passwords
  // are public in the README, so a lock would only let one person block every evaluator.
  const lockable = !!user && !user.isDemo && !user.isPersona;
  if (lockable && user.lockedUntil && user.lockedUntil > new Date()) return { error: lockedMessage(user.lockedUntil) };
  // Same message for "no account" and "wrong password", so emails can't be probed
  if (!user || !(await checkPassword(password, user.passwordHash))) {
    if (lockable) {
      const [row] = await db
        .update(schema.users)
        .set({ failedLogins: sql`${schema.users.failedLogins} + 1` })
        .where(eq(schema.users.id, user.id))
        .returning({ failed: schema.users.failedLogins });
      if (row.failed >= MAX_FAILED_LOGINS) {
        const until = new Date(Date.now() + LOCK_MINUTES * 60_000);
        await db.update(schema.users).set({ failedLogins: 0, lockedUntil: until }).where(eq(schema.users.id, user.id));
        return { error: lockedMessage(until) };
      }
    }
    return { error: "Email or password is incorrect." };
  }
  if (lockable && (user.failedLogins > 0 || user.lockedUntil)) {
    await db.update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, user.id));
  }
  if (user.isPersona) return { error: "This is a demo persona and can't be signed in to." };
  // Members and the Unswipe team sign in on separate pages
  const portal = form.get("portal") === "admin" ? "admin" : "member";
  if (portal === "admin" && user.role !== "admin") return { error: "This sign-in is only for the Unswipe team. Members sign in at /login." };
  if (portal === "member" && user.role === "admin") return { error: "Team accounts sign in at /admin/login." };
  await createSession(user.id);
  if (user.role === "admin") redirect("/admin");
  redirect(user.onboardingStep === "done" ? "/app/today" : `/onboarding/${user.onboardingStep}`);
}

export async function logout() {
  await destroySession();
}
