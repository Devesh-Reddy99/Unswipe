"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
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

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  // Same message for "no account" and "wrong password", so emails can't be probed
  if (!user || !(await checkPassword(password, user.passwordHash))) return { error: "Email or password is incorrect." };
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
  redirect("/");
}
