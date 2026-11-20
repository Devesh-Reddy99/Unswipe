import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

const COOKIE = "unswipe_session";
const SESSION_DAYS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function checkPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  jar.delete(COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: schema.users, expiresAt: schema.sessions.expiresAt })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.id, hashToken(token)))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt < new Date()) return null;
  return row.user;
}

/** For pages inside the app: must be signed in and finished onboarding. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.onboardingStep !== "done") redirect(`/onboarding/${user.onboardingStep}`);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/app/today");
  return user;
}
