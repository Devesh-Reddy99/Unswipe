import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Logo } from "@/components/Logo";
import { Ticket } from "@/components/Ticket";
import { Avatar } from "@/components/Avatar";
import { otherId } from "@/lib/matches";

export const dynamic = "force-dynamic";
export const metadata = { title: "A friend shared their date plan · Offline", robots: { index: false } };

/*
 * Safety: a link a member sends to a trusted friend.
 * Shows only what a friend needs: who, where, when. Unguessable token, no sign-in needed.
 */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [plan] = await db.select().from(schema.datePlans).where(eq(schema.datePlans.shareToken, token));
  if (!plan || plan.status !== "confirmed" || !plan.chosenSlot) notFound();
  const [match] = await db.select().from(schema.matches).where(eq(schema.matches.id, plan.matchId));
  const [venue] = await db.select().from(schema.venues).where(eq(schema.venues.id, plan.venueId));
  const a = (await db.select().from(schema.profiles).where(eq(schema.profiles.userId, plan.proposerId)))[0];
  const b = (await db.select().from(schema.profiles).where(eq(schema.profiles.userId, otherId(match, plan.proposerId))))[0];
  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <Logo />
      <h1 className="mt-8 text-3xl font-extrabold">A friend shared their date plan with you</h1>
      <p className="mt-2 text-dusk">They'd like someone to know where they'll be. Both people are verified Offline members.</p>
      <div className="mt-6 flex gap-4">
        {[a, b].map((p) => (
          <div key={p.userId} className="flex items-center gap-2">
            <Avatar seed={p.avatarSeed} photo={p.photo} name={p.name} size={44} />
            <span className="font-bold">{p.name}</span>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Ticket when={plan.chosenSlot} venue={venue.name} area={`${venue.area}, ${venue.city}`} names={`${a.name} & ${b.name}`} stamp={false} />
      </div>
      <div className="mt-6 rounded-2xl bg-leaf-soft p-4 text-sm">
        <p className="font-bold text-leaf">If something feels wrong</p>
        <p className="mt-1">Call your friend first. In an emergency call 112. To report a member, email safety@offline.example.</p>
      </div>
    </main>
  );
}
