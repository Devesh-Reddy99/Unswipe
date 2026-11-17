import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getMatchForUser, otherId } from "@/lib/matches";
import { personaTick } from "@/lib/personas";
import { suggestSlots } from "@/lib/slots";
import { ageFrom, fmtDateTime, hoursLeft } from "@/lib/time";
import { FEEDBACK_AFTER_HOURS, INTENTS } from "@/lib/constants";
import { Avatar } from "@/components/Avatar";
import { PersonaBadge, VerifiedBadge } from "@/components/Badges";
import { Ticket } from "@/components/Ticket";
import { MatchChat } from "@/components/MatchChat";
import { ConfirmedActions, ExtendButton, FeedbackForm, MatchMenu, Planner, RespondToPlan } from "@/components/Plan";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  let match = await getMatchForUser(id, user.id);
  if (!match) notFound();
  await personaTick(match, user.id);
  match = (await getMatchForUser(id, user.id))!;

  const oid = otherId(match, user.id);
  const [[other], [otherUser], [me], msgs, [plan], [intro]] = await Promise.all([
    db.select().from(schema.profiles).where(eq(schema.profiles.userId, oid)),
    db.select().from(schema.users).where(eq(schema.users.id, oid)),
    db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id)),
    db.select().from(schema.messages).where(eq(schema.messages.matchId, id)).orderBy(asc(schema.messages.createdAt)),
    db.select().from(schema.datePlans).where(eq(schema.datePlans.matchId, id)).orderBy(desc(schema.datePlans.createdAt)).limit(1),
    db.select().from(schema.intros).where(and(eq(schema.intros.viewerId, user.id), eq(schema.intros.candidateId, oid))),
  ]);
  const venue = plan ? (await db.select().from(schema.venues).where(eq(schema.venues.id, plan.venueId)))[0] : null;
  const [myFeedback] = plan
    ? await db.select().from(schema.feedback).where(and(eq(schema.feedback.planId, plan.id), eq(schema.feedback.userId, user.id)))
    : [];

  const closed = match.status === "expired" || match.status === "closed";
  const unlocked = match.status === "planned" || match.secondDateUnlocked;
  const now = new Date();
  const confirmed = plan?.status === "confirmed" && plan.chosenSlot ? plan : null;
  const dateIsPast = confirmed ? confirmed.chosenSlot!.getTime() + FEEDBACK_AFTER_HOURS * 36e5 < now.getTime() : false;
  const showConfirmedTicket = confirmed && !dateIsPast && match.status === "planned";
  const needsFeedback = confirmed && dateIsPast && !myFeedback;
  const proposedToMe = plan?.status === "proposed" && plan.proposerId !== user.id && match.status === "active";
  const proposedByMe = plan?.status === "proposed" && plan.proposerId === user.id && match.status === "active";
  const canPlan = match.status === "active" && !proposedToMe && !proposedByMe;

  // Planner data: partner venues in the city, the ones near either of you first
  const near = [me.area, other.area];
  const venues = canPlan
    ? (await db.select().from(schema.venues).where(eq(schema.venues.city, me.city))).sort(
        (a, b) => Number(near.includes(b.area)) - Number(near.includes(a.area)) || a.priceForTwo - b.priceForTwo,
      )
    : [];
  const slots = canPlan ? suggestSlots(me.availability, other.availability) : [];
  const planKey = plan ? `${plan.id}:${plan.status}:${plan.chosenSlot?.toISOString() ?? ""}` : "";

  return (
    <main className="px-5">
      <div className="flex items-center gap-3">
        <Link href="/app/matches" className="text-2xl text-dusk" aria-label="Back to matches">‹</Link>
        <Avatar seed={other.avatarSeed} photo={other.photo} name={other.name} size={48} />
        <div className="min-w-0 flex-1">
          <h1 className="display text-xl font-extrabold">
            {other.name}, {ageFrom(other.birthDate)}
          </h1>
          <p className="truncate text-sm text-dusk">
            {other.jobTitle ? `${other.jobTitle}, ` : ""}
            {other.area}
          </p>
        </div>
        {!closed && <MatchMenu matchId={match.id} otherName={other.name} />}
      </div>

      <details className="mt-3 rounded-2xl border border-mist bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-bold">About {other.name}</summary>
        <div className="mt-3 grid gap-3 text-sm">
          <div className="flex flex-wrap gap-1.5">
            <VerifiedBadge />
            {otherUser.workEmailVerified && <VerifiedBadge label="Work verified" />}
            {otherUser.isPersona && <PersonaBadge />}
          </div>
          <p>Looking for: {INTENTS[other.intent].toLowerCase()}</p>
          {intro?.reasons.length ? <p className="text-dusk">{intro.reasons.join(". ")}.</p> : null}
          {other.prompts.map((p) => (
            <p key={p.q}>
              <span className="text-dusk">{p.q}</span> {p.a}
            </p>
          ))}
        </div>
      </details>

      {/* The plan panel: the whole point of a match */}
      <section className="mt-5" aria-label="Date plan">
        {match.status === "active" && !match.secondDateUnlocked && (
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <span className={hoursLeft(match.expiresAt) < 24 ? "font-bold text-rose" : "text-dusk"}>
              {hoursLeft(match.expiresAt)} hours left to agree on a date
            </span>
            {hoursLeft(match.expiresAt) < 36 && !match.extended && <ExtendButton matchId={match.id} asked={match.extendRequests.includes(user.id)} />}
          </div>
        )}

        {showConfirmedTicket && venue && (
          <>
            <Ticket
              when={confirmed!.chosenSlot!}
              venue={venue.name}
              area={venue.area}
              names={`${me.name} & ${other.name}`}
              perk={venue.perk}
              reason={confirmed!.note ? `Note: ${confirmed!.note}` : undefined}
            />
            <ConfirmedActions
              planId={confirmed!.id}
              shareUrl={`/share/${confirmed!.shareToken}`}
              mapsUrl={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.area} ${venue.city}`)}`}
              isDemo={user.isDemo || otherUser.isPersona}
            />
          </>
        )}

        {needsFeedback && <FeedbackForm planId={confirmed!.id} otherName={other.name} />}
        {confirmed && dateIsPast && myFeedback && !match.secondDateUnlocked && match.status === "planned" && (
          <p className="rounded-2xl bg-leaf-soft p-4 text-leaf">
            Thanks for checking in. If you both want to meet again, you'll be able to plan a second date here.
          </p>
        )}

        {proposedToMe && venue && (
          <div className="panel p-5">
            <p className="display text-xl font-bold">{other.name} suggested a date</p>
            <p className="mt-1">
              <b>{venue.name}</b>, {venue.area}. ₹{venue.priceForTwo} for two.
            </p>
            {venue.perk && <p className="mt-1 text-sm font-bold text-marigold-deep">{venue.perk}</p>}
            {plan!.note && <p className="mt-2 text-dusk">“{plan!.note}”</p>}
            <p className="mb-2 mt-4 font-bold">Pick a time that works</p>
            <RespondToPlan planId={plan!.id} slots={plan!.slots.map((s) => ({ iso: s, label: fmtDateTime(s) }))} />
          </div>
        )}

        {proposedByMe && venue && (
          <div className="panel p-5">
            <p className="font-bold">Waiting for {other.name} to pick a time</p>
            <p className="mt-1 text-dusk">
              {venue.name}, {venue.area}: {plan!.slots.map((s) => fmtDateTime(s)).join(", or ")}
            </p>
          </div>
        )}

        {canPlan && <Planner matchId={match.id} venues={venues} slots={slots} otherName={other.name} nearAreas={near} />}

        {closed && (
          <p className="rounded-2xl border border-dashed border-mist p-4 text-dusk">
            {match.status === "expired" ? "This match expired without a date. That's okay: new intros arrive every day." : "This match is closed."}
          </p>
        )}
      </section>

      <MatchChat
        matchId={match.id}
        meId={user.id}
        otherName={other.name}
        initial={msgs.map((m) => ({ id: m.id, senderId: m.senderId, body: m.body, masked: m.masked, createdAt: m.createdAt.toISOString() }))}
        initialStatus={match.status}
        initialPlanKey={planKey}
        closed={closed}
        unlocked={unlocked}
      />
    </main>
  );
}
