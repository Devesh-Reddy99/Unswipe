import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getMatchForUser } from "@/lib/matches";
import { personaTick } from "@/lib/personas";

/*
 * Chat polling endpoint. The client asks every few seconds.
 * Polling is simpler than websockets and fine at this scale; it also runs on any free host.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  let match = await getMatchForUser(id, user.id);
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await personaTick(match, user.id); // demo personas reply here
  match = (await getMatchForUser(id, user.id))!;

  const msgs = await db.select().from(schema.messages).where(eq(schema.messages.matchId, id)).orderBy(asc(schema.messages.createdAt));
  const [plan] = await db.select().from(schema.datePlans).where(eq(schema.datePlans.matchId, id)).orderBy(desc(schema.datePlans.createdAt)).limit(1);
  return NextResponse.json({
    status: match.status,
    planKey: plan ? `${plan.id}:${plan.status}:${plan.chosenSlot?.toISOString() ?? ""}` : "",
    messages: msgs.map((m) => ({ id: m.id, senderId: m.senderId, body: m.body, masked: m.masked, createdAt: m.createdAt })),
  });
}
