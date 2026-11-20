import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { getMatchForUser, otherId } from "@/lib/matches";

/** Calendar file for a confirmed date, so it doesn't get forgotten (fewer no-shows). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in first", { status: 401 });
  const [plan] = await db.select().from(schema.datePlans).where(eq(schema.datePlans.id, id));
  if (!plan?.chosenSlot) return new Response("Not found", { status: 404 });
  const match = await getMatchForUser(plan.matchId, user.id);
  if (!match) return new Response("Not found", { status: 404 });
  const [venue] = await db.select().from(schema.venues).where(eq(schema.venues.id, plan.venueId));
  const [other] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, otherId(match, user.id)));
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(plan.chosenSlot.getTime() + 90 * 60e3);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Unswipe//Dates//EN",
    "BEGIN:VEVENT",
    `UID:${plan.id}@unswipe`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(plan.chosenSlot)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Date with ${other.name}`,
    `LOCATION:${venue.name}\\, ${venue.area}\\, ${venue.city}`,
    "DESCRIPTION:Planned on Unswipe. Can't make it? Cancel in the app so they know.",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your date is in 2 hours",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="unswipe-date.ics"` },
  });
}
