import { eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

/** DPDP right to access: everything we hold about the signed-in person, in one file. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in first", { status: 401 });
  const { passwordHash: _p, workEmailCode: _c, elitmusHash: _h, ...account } = user;
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  const matches = await db.select().from(schema.matches).where(or(eq(schema.matches.userA, user.id), eq(schema.matches.userB, user.id)));
  const sentMessages = await db.select().from(schema.messages).where(eq(schema.messages.senderId, user.id));
  const intros = await db.select().from(schema.intros).where(eq(schema.intros.viewerId, user.id));
  const feedback = await db.select().from(schema.feedback).where(eq(schema.feedback.userId, user.id));
  const tickets = await db.select().from(schema.tickets).where(eq(schema.tickets.userId, user.id));
  const reportsMade = await db.select().from(schema.reports).where(eq(schema.reports.reporterId, user.id));
  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      note: "Your Unswipe data. We store a hash of your eLitmus ID (not the ID itself) and never your test scores.",
      account,
      profile,
      intros,
      matches,
      sentMessages,
      feedback,
      tickets,
      reportsMade,
    },
    null,
    2,
  );
  return new Response(body, {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="unswipe-my-data.json"` },
  });
}
