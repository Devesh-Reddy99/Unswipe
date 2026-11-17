import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/time";
import { BookButton } from "@/components/BookButton";

export const dynamic = "force-dynamic";

export default async function Events() {
  const user = await requireUser();
  const [me] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  const events = await db
    .select({ e: schema.events, v: schema.venues })
    .from(schema.events)
    .innerJoin(schema.venues, eq(schema.venues.id, schema.events.venueId))
    .where(and(eq(schema.events.city, me.city), gt(schema.events.startsAt, new Date())))
    .orderBy(asc(schema.events.startsAt));
  const counts = await db
    .select({ eventId: schema.tickets.eventId, gender: schema.profiles.gender, n: sql<number>`count(*)::int` })
    .from(schema.tickets)
    .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.tickets.userId))
    .groupBy(schema.tickets.eventId, schema.profiles.gender);
  const mine = await db.select().from(schema.tickets).where(eq(schema.tickets.userId, user.id));

  return (
    <main className="px-5">
      <h1 className="text-3xl font-extrabold">Socials</h1>
      <p className="mt-1 text-dusk">
        Small, balanced get-togethers in {me.city}: equal seats for women and men, a host, and something to do. A low-pressure
        way to meet people before a one-on-one.
      </p>
      <ul className="mt-6 grid gap-4">
        {events.map(({ e, v }) => {
          const c = (g: string) => counts.find((x) => x.eventId === e.id && x.gender === g)?.n ?? 0;
          const mySide = me.gender === "nonbinary" ? null : me.gender;
          const left = mySide ? e.seatsPerSide - c(mySide) : e.seatsPerSide * 2 - c("man") - c("woman") - c("nonbinary");
          const booked = mine.some((t) => t.eventId === e.id);
          return (
            <li key={e.id} className="panel p-5">
              <p className="text-sm font-bold text-rose">{fmtDateTime(e.startsAt)}</p>
              <h2 className="display mt-1 text-xl font-bold">{e.title}</h2>
              <p className="text-dusk">
                {v.name}, {v.area}
              </p>
              <p className="mt-2">{e.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm text-dusk">
                  ₹{e.priceInr}. {Math.max(0, left)} {Math.max(0, left) === 1 ? "seat" : "seats"}{mySide === "woman" ? " for women" : mySide === "man" ? " for men" : ""} left.
                </span>
                <BookButton eventId={e.id} booked={booked} full={left <= 0} price={e.priceInr} />
              </div>
            </li>
          );
        })}
        {events.length === 0 && <p className="panel p-5 text-dusk">No socials scheduled in {me.city} right now. New ones are added every week.</p>}
      </ul>
    </main>
  );
}
