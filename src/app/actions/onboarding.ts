"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { AREAS, CITIES, CONSENT_VERSION, DATE_STYLES, AVAILABILITY, LANGUAGES, PROMPT_QUESTIONS, QUESTIONS } from "@/lib/constants";
import { ageFrom } from "@/lib/time";
import type { FormState } from "./public";

async function me() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/* Step 1: eLitmus verification.
 * Production: "Sign in with eLitmus" (OAuth). eLitmus returns only { verified: true, gradYear }.
 * Demo: any 7-digit candidate id is accepted. */
const verifySchema = z.object({
  elitmusId: z.string().trim().regex(/^\d{7}$/, "Your eLitmus candidate ID has 7 digits"),
  gradYear: z.coerce.number().int().min(2019).max(2025),
});

export async function verifyElitmus(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  const parsed = verifySchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const hash = createHash("sha256").update("elitmus:" + parsed.data.elitmusId).digest("hex");
  const [taken] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.elitmusHash, hash), ne(schema.users.id, user.id)));
  if (taken) return { error: "This eLitmus account is already linked to another Offline profile. One person, one profile." };
  await db
    .update(schema.users)
    .set({ elitmusHash: hash, elitmusVerified: true, gradYear: parsed.data.gradYear, onboardingStep: "consent" })
    .where(eq(schema.users.id, user.id));
  redirect("/onboarding/consent");
}

/* Step 2: DPDP consent. Standalone notice, each item ticked separately, stored with a version. */
export async function giveConsent(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  for (const k of ["adult", "processing", "terms"]) {
    if (form.get(k) !== "on") return { error: "Please tick all three boxes to continue. Each one is needed to run the service." };
  }
  await db
    .update(schema.users)
    .set({ consentVersion: CONSENT_VERSION, consentAt: new Date(), onboardingStep: "profile" })
    .where(eq(schema.users.id, user.id));
  redirect("/onboarding/profile");
}

/* Step 3: profile (also used for editing later). */
const allAreas = Object.values(AREAS).flat();
const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Add your first name").max(30),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Add your date of birth"),
    gender: z.enum(["man", "woman", "nonbinary"]),
    interestedIn: z.array(z.enum(["man", "woman", "nonbinary"])).min(1, "Choose who you'd like to meet"),
    city: z.enum(CITIES),
    area: z.string().refine((a) => allAreas.includes(a), "Pick your area"),
    company: z.string().trim().max(60).optional(),
    jobTitle: z.string().trim().max(60).optional(),
    intent: z.enum(["long_term", "marriage", "open"]),
    about: z.string().trim().max(300).default(""),
    prompt1q: z.string().refine((q) => PROMPT_QUESTIONS.includes(q)),
    prompt1a: z.string().trim().min(3, "Answer your first prompt").max(160),
    prompt2q: z.string().refine((q) => PROMPT_QUESTIONS.includes(q)),
    prompt2a: z.string().trim().min(3, "Answer your second prompt").max(160),
    dateStyles: z.array(z.enum(Object.keys(DATE_STYLES) as [string, ...string[]])).min(1, "Pick at least one kind of date"),
    availability: z.array(z.enum(Object.keys(AVAILABILITY) as [string, ...string[]])).min(1, "Pick when you're usually free"),
    languages: z.array(z.string().refine((l) => LANGUAGES.includes(l))).min(1, "Pick at least one language"),
    ageMin: z.coerce.number().int().min(18).max(60),
    ageMax: z.coerce.number().int().min(18).max(60),
    photo: z.string().max(400_000).optional(),
    removePhoto: z.string().optional(),
  })
  .refine((p) => p.area && AREAS[p.city]?.includes(p.area), { message: "That area isn't in the city you picked", path: ["area"] })
  .refine((p) => p.ageMin <= p.ageMax, { message: "Age range: the minimum must be below the maximum", path: ["ageMin"] })
  .refine((p) => p.prompt1q !== p.prompt2q, { message: "Choose two different prompts", path: ["prompt2q"] });

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  const raw = {
    ...Object.fromEntries(form),
    interestedIn: form.getAll("interestedIn"),
    dateStyles: form.getAll("dateStyles"),
    availability: form.getAll("availability"),
    languages: form.getAll("languages"),
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;
  if (ageFrom(p.birthDate) < 18) return { error: "Offline is only for adults (18+)." };
  if (ageFrom(p.birthDate) > 60) return { error: "Please check your date of birth." };
  if (p.photo && !p.photo.startsWith("data:image/jpeg;base64,")) return { error: "Photo must be a JPEG image." };

  const values = {
    name: p.name,
    birthDate: p.birthDate,
    gender: p.gender,
    interestedIn: p.interestedIn,
    city: p.city,
    area: p.area,
    company: p.company || null,
    jobTitle: p.jobTitle || null,
    intent: p.intent,
    about: p.about,
    prompts: [
      { q: p.prompt1q, a: p.prompt1a },
      { q: p.prompt2q, a: p.prompt2a },
    ],
    dateStyles: p.dateStyles,
    availability: p.availability,
    languages: p.languages,
    ageMin: p.ageMin,
    ageMax: p.ageMax,
    gradYear: user.gradYear ?? 2022,
    updatedAt: new Date(),
    ...(p.photo ? { photo: p.photo } : {}),
    ...(p.removePhoto === "1" ? { photo: null } : {}),
  };
  await db
    .insert(schema.profiles)
    .values({ userId: user.id, avatarSeed: Math.floor(Math.random() * 1000), ...values })
    .onConflictDoUpdate({ target: schema.profiles.userId, set: values });

  if (user.onboardingStep === "profile") {
    await db.update(schema.users).set({ onboardingStep: "values" }).where(eq(schema.users.id, user.id));
    redirect("/onboarding/values");
  }
  revalidatePath("/app/me");
  return { ok: true, message: "Profile saved." };
}

/* Step 4: values questions. Each answer + how much it matters (0-2). */
export async function saveValues(_: FormState, form: FormData): Promise<FormState> {
  const user = await me();
  const answers: Record<string, { a: number; w: number }> = {};
  for (const q of QUESTIONS) {
    const a = Number(form.get(`q_${q.id}`));
    const w = Number(form.get(`w_${q.id}`) ?? 1);
    if (!Number.isInteger(a) || a < 0 || a >= q.options.length || form.get(`q_${q.id}`) === null) {
      return { error: `Please answer: "${q.text}"` };
    }
    answers[q.id] = { a, w: [0, 1, 2].includes(w) ? w : 1 };
  }
  await db.update(schema.profiles).set({ answers, updatedAt: new Date() }).where(eq(schema.profiles.userId, user.id));
  if (user.onboardingStep === "values") {
    await db.update(schema.users).set({ onboardingStep: "done" }).where(eq(schema.users.id, user.id));
    redirect("/app/today?welcome=1");
  }
  revalidatePath("/app/me");
  return { ok: true, message: "Answers saved. Tomorrow's intros will use them." };
}
