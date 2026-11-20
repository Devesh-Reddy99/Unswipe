import Link from "next/link";
import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { resetDemo, resolveGrievance, resolveReport } from "@/app/actions/admin";
import { Logo } from "@/components/Logo";
import { SubmitButton } from "@/components/SubmitButton";
import { fmtDateTime } from "@/lib/time";
import { PLUS_PRICE_INR } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Unswipe" };

const n = (v: unknown) => Number(v ?? 0);
const inr = (v: number) => "₹" + v.toLocaleString("en-IN");
const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

export default async function Admin() {
  await requireAdmin();
  const weekAgo = new Date(Date.now() - 7 * 864e5);

  const members = await db
    .select({ gender: schema.profiles.gender, status: schema.users.status, n: sql<number>`count(*)::int` })
    .from(schema.users)
    .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(eq(schema.users.role, "user"))
    .groupBy(schema.profiles.gender, schema.users.status);
  const byGender = (g: string) => members.filter((m) => m.gender === g).reduce((s, m) => s + m.n, 0);
  const total = members.reduce((s, m) => s + m.n, 0);
  const snoozed = members.filter((m) => m.status === "snoozed").reduce((s, m) => s + m.n, 0);
  const suspended = members.filter((m) => m.status === "suspended").reduce((s, m) => s + m.n, 0);

  const [introStats] = await db
    .select({
      shown: sql<number>`count(*)::int`,
      interested: sql<number>`count(*) filter (where ${schema.intros.action} = 'interested')::int`,
    })
    .from(schema.intros);
  const [matchStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      expired: sql<number>`count(*) filter (where ${schema.matches.status} = 'expired')::int`,
      second: sql<number>`count(*) filter (where ${schema.matches.secondDateUnlocked})::int`,
    })
    .from(schema.matches);
  const confirmedPlans = await db
    .select({ plan: schema.datePlans, venue: schema.venues })
    .from(schema.datePlans)
    .innerJoin(schema.venues, eq(schema.venues.id, schema.datePlans.venueId))
    .where(eq(schema.datePlans.status, "confirmed"));
  const matchesWithDate = new Set(confirmedPlans.map((p) => p.plan.matchId)).size;
  const fb = await db.select().from(schema.feedback);
  const metPlans = new Set(fb.filter((f) => f.met === "yes").map((f) => f.planId));
  const goodThisWeek = new Set(fb.filter((f) => f.met === "yes" && f.again && f.createdAt > weekAgo).map((f) => f.planId)).size;
  const noShows = fb.filter((f) => f.met === "they_no_show").length;

  const venueRevenue = confirmedPlans.reduce((s, p) => s + p.venue.cpaInr, 0);
  const [{ ticketRevenue, tickets }] = await db
    .select({ ticketRevenue: sql<number>`coalesce(sum(${schema.tickets.amountInr}),0)::int`, tickets: sql<number>`count(*)::int` })
    .from(schema.tickets);
  const [{ plus }] = await db.select({ plus: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.plus, true));

  const venueTable = Object.values(
    confirmedPlans.reduce<Record<string, { name: string; area: string; dates: number; revenue: number }>>((acc, p) => {
      const k = p.venue.id;
      acc[k] ??= { name: p.venue.name, area: `${p.venue.area}, ${p.venue.city}`, dates: 0, revenue: 0 };
      acc[k].dates++;
      acc[k].revenue += p.venue.cpaInr;
      return acc;
    }, {}),
  ).sort((a, b) => b.dates - a.dates);

  const reports = await db.select().from(schema.reports).where(eq(schema.reports.status, "open")).orderBy(desc(schema.reports.priority), desc(schema.reports.createdAt));
  const reportedIds = [...new Set(reports.flatMap((r) => [r.reportedId, r.reporterId].filter(Boolean) as string[]))];
  const names = reportedIds.length
    ? await db.select({ id: schema.profiles.userId, name: schema.profiles.name, city: schema.profiles.city }).from(schema.profiles).where(inArray(schema.profiles.userId, reportedIds))
    : [];
  const nameOf = (id: string | null) => names.find((x) => x.id === id)?.name ?? "Deleted user";

  const grievances = await db.select().from(schema.grievances).where(eq(schema.grievances.status, "open")).orderBy(desc(schema.grievances.createdAt));
  const waitlist = await db
    .select({ city: schema.waitlist.city, gender: schema.waitlist.gender, n: sql<number>`count(*)::int` })
    .from(schema.waitlist)
    .groupBy(schema.waitlist.city, schema.waitlist.gender);
  const wlCities = [...new Set(waitlist.map((w) => w.city))];
  const [{ newThisWeek }] = await db
    .select({ newThisWeek: sql<number>`count(*)::int` })
    .from(schema.users)
    .where(and(eq(schema.users.role, "user"), gt(schema.users.createdAt, weekAgo), eq(schema.users.isPersona, false)));

  const funnel = [
    { label: "Intros shown", v: n(introStats.shown) },
    { label: "Said interested", v: n(introStats.interested) },
    { label: "Mutual matches", v: n(matchStats.total) },
    { label: "Date agreed", v: matchesWithDate },
    { label: "Met in person", v: metPlans.size },
    { label: "Both want a 2nd date", v: n(matchStats.second) },
  ];
  const max = Math.max(1, ...funnel.map((f) => f.v));

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo href="/admin" />
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-paper">Ops & moderation</span>
        </div>
        <div className="flex gap-2">
          <Link href="/why" className="btn-ghost text-sm">Product decisions</Link>
          <form action={logout}>
            <button className="btn-ghost text-sm">Sign out</button>
          </form>
        </div>
      </header>

      <p className="mt-4 text-sm text-dusk">Includes seeded demo activity. Revenue figures are what the model would bill; no real payments are taken.</p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key numbers">
        <Kpi title="Good first dates, last 7 days" value={String(goodThisWeek)} sub="North-star: met, and at least one wants to meet again" strong />
        <Kpi title="Members" value={String(total)} sub={`${pct(byGender("woman"), total)}% women. ${newThisWeek} new this week. ${snoozed} snoozed, ${suspended} suspended.`} />
        <Kpi title="Matches that became a date" value={`${pct(matchesWithDate, n(matchStats.total))}%`} sub={`${n(matchStats.expired)} matches expired without a plan`} />
        <Kpi title="Revenue to date" value={inr(venueRevenue + n(ticketRevenue))} sub={`Venues ${inr(venueRevenue)}, socials ${inr(n(ticketRevenue))} (${n(tickets)} seats). Plus MRR ${inr(n(plus) * PLUS_PRICE_INR)}.`} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="panel p-5" aria-label="Funnel">
          <h2 className="text-lg font-bold">From intro to second date</h2>
          <p className="hint">Where people drop off tells us what to fix next.</p>
          <ol className="mt-4 grid gap-2.5">
            {funnel.map((f, i) => (
              <li key={f.label} className="grid grid-cols-[9.5rem_1fr_3.5rem] items-center gap-3 text-sm">
                <span>{f.label}</span>
                <span className="h-5 rounded bg-paper">
                  <span className="block h-5 rounded bg-ink" style={{ width: `${Math.max(2, (100 * f.v) / max)}%`, opacity: 1 - i * 0.1 }} />
                </span>
                <span className="text-right font-bold tabular-nums">{f.v}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-dusk">
            Gender balance and fairness guardrail: {byGender("woman")} women, {byGender("man")} men, {byGender("nonbinary")} non-binary. No-shows reported: {noShows}.
          </p>
        </section>

        <section className="panel p-5" aria-label="Venue partners">
          <h2 className="text-lg font-bold">Venue partners</h2>
          <p className="hint">Each confirmed date is billed to the venue.</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-dusk">
                <th className="py-1 font-normal">Venue</th>
                <th className="py-1 text-right font-normal">Dates</th>
                <th className="py-1 text-right font-normal">Billed</th>
              </tr>
            </thead>
            <tbody>
              {venueTable.slice(0, 8).map((v) => (
                <tr key={v.name + v.area} className="border-t border-mist">
                  <td className="py-1.5">
                    {v.name}
                    <span className="block text-xs text-dusk">{v.area}</span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{v.dates}</td>
                  <td className="py-1.5 text-right tabular-nums">{inr(v.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="panel mt-6 p-5" aria-label="Reports">
        <h2 className="text-lg font-bold">Reports to review ({reports.length})</h2>
        <p className="hint">IT Rules 2021: acknowledge within 24 hours, resolve within 15 days. Urgent reports first.</p>
        <ul className="mt-3 divide-y divide-mist">
          {reports.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-bold">
                  {r.priority === "urgent" && <span className="mr-2 rounded bg-rose px-1.5 py-0.5 text-xs text-white">Urgent</span>}
                  {r.reason}
                </p>
                <p className="text-sm text-dusk">
                  {nameOf(r.reporterId)} reported {nameOf(r.reportedId)}, {fmtDateTime(r.createdAt)}
                </p>
                {r.details && <p className="mt-1 text-sm">“{r.details}”</p>}
              </div>
              <div className="flex gap-2">
                <form action={resolveReport.bind(null, r.id, "dismiss")}>
                  <SubmitButton className="btn-ghost px-3 py-1.5 text-sm" pendingText="…">Dismiss</SubmitButton>
                </form>
                <form action={resolveReport.bind(null, r.id, "suspend")}>
                  <SubmitButton className="btn-danger px-3 py-1.5 text-sm" pendingText="…">Suspend member</SubmitButton>
                </form>
              </div>
            </li>
          ))}
          {reports.length === 0 && <li className="py-3 text-dusk">Nothing to review.</li>}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5" aria-label="Grievances">
          <h2 className="text-lg font-bold">Grievances ({grievances.length})</h2>
          <ul className="mt-3 divide-y divide-mist">
            {grievances.map((g) => (
              <li key={g.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-bold">{g.subject}</p>
                  <p className="text-sm text-dusk">{g.email}, {fmtDateTime(g.createdAt)}. Ref {g.id.slice(0, 8).toUpperCase()}</p>
                  <p className="mt-1 text-sm">{g.body}</p>
                </div>
                <form action={resolveGrievance.bind(null, g.id)}>
                  <SubmitButton className="btn-ghost shrink-0 whitespace-nowrap px-3 py-1.5 text-sm" pendingText="…">Mark resolved</SubmitButton>
                </form>
              </li>
            ))}
            {grievances.length === 0 && <li className="py-3 text-dusk">No open grievances.</li>}
          </ul>
        </section>

        <section className="panel p-5" aria-label="Waitlist">
          <h2 className="text-lg font-bold">Waitlist for new cities</h2>
          <p className="hint">We open a city when there's a balanced group ready to admit together.</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-dusk">
                <th className="py-1 font-normal">City</th>
                <th className="py-1 text-right font-normal">Women</th>
                <th className="py-1 text-right font-normal">Men</th>
                <th className="py-1 text-right font-normal">Other</th>
              </tr>
            </thead>
            <tbody>
              {wlCities.map((c) => {
                const g = (x: string) => waitlist.find((w) => w.city === c && w.gender === x)?.n ?? 0;
                return (
                  <tr key={c} className="border-t border-mist">
                    <td className="py-1.5">{c}</td>
                    <td className="py-1.5 text-right tabular-nums">{g("woman")}</td>
                    <td className="py-1.5 text-right tabular-nums">{g("man")}</td>
                    <td className="py-1.5 text-right tabular-nums">{g("nonbinary")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-dashed border-dusk/40 p-5" aria-label="Demo data">
        <h2 className="font-bold">Demo data</h2>
        <p className="mt-1 text-sm text-dusk">
          Resets the shared demo accounts, demo personas, socials and venues to a fresh state. Accounts that evaluators created
          themselves are kept. This also runs automatically every night at 3:30 AM IST.
        </p>
        <form action={resetDemo} className="mt-3">
          <SubmitButton className="btn-ghost" pendingText="Resetting… (takes a few seconds)">Reset demo data now</SubmitButton>
        </form>
      </section>
    </div>
  );
}

function Kpi({ title, value, sub, strong }: { title: string; value: string; sub: string; strong?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${strong ? "bg-ink text-paper" : "panel"}`}>
      <p className={`text-sm ${strong ? "text-paper/70" : "text-dusk"}`}>{title}</p>
      <p className={`display mt-1 text-4xl font-extrabold ${strong ? "text-marigold" : ""}`}>{value}</p>
      <p className={`mt-1 text-sm ${strong ? "text-paper/70" : "text-dusk"}`}>{sub}</p>
    </div>
  );
}
