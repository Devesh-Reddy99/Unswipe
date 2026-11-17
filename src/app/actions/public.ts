"use server";
import { z } from "zod";
import { db, schema } from "@/db";

export type FormState = { ok?: boolean; error?: string; message?: string } | undefined;

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  city: z.string().min(1, "Pick a city"),
  gender: z.enum(["man", "woman", "nonbinary"], { message: "Pick one" }),
});

/** Cities open one at a time; the waitlist lets us admit people in gender-balanced cohorts. */
export async function joinWaitlist(_: FormState, form: FormData): Promise<FormState> {
  const parsed = waitlistSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.insert(schema.waitlist).values(parsed.data).onConflictDoNothing();
  return { ok: true, message: `You're on the list for ${parsed.data.city}. We'll email you when we open there.` };
}

const grievanceSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  subject: z.string().trim().min(3, "Add a short subject").max(120),
  body: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(4000),
});

/** IT Rules 2021: acknowledge within 24 hours, resolve within 15 days. */
export async function submitGrievance(_: FormState, form: FormData): Promise<FormState> {
  const parsed = grievanceSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [g] = await db.insert(schema.grievances).values(parsed.data).returning();
  return {
    ok: true,
    message: `Received. Your reference is ${g.id.slice(0, 8).toUpperCase()}. We acknowledge within 24 hours and resolve within 15 days.`,
  };
}
