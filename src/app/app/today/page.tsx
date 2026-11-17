import Link from "next/link";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { getTodayIntros } from "@/lib/matching";
import { ageFrom, fmtDay } from "@/lib/time";
import { INTENTS, INTROS_PER_DAY } from "@/lib/constants";
import { IntroCard, type IntroView } from "@/components/IntroCard";

export const dynamic = "force-dynamic";

export default async function Today({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  const { welcome } = await searchParams;
  if (user.role === "admin") {
    return <p className="px-5 py-10 text-dusk">Admins don't get intros. <Link className="underline" href="/admin">Open the admin dashboard</Link>.</p>;
  }
  const [me] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  const intros = await getTodayIntros(user, me);

  const ids = intros.map((i) => i.candidateId);
  const people = ids.length
    ? await db
        .select({ p: schema.profiles, u: schema.users })
        .from(schema.profiles)
        .innerJoin(schema.users, eq(schema.users.id, schema.profiles.userId))
        .where(inArray(schema.profiles.userId, ids))
    : [];

  const views: IntroView[] = intros
    .map((i): IntroView | null => {
      const row = people.find((x) => x.p.userId === i.candidateId);
      if (!row) return null;
      return {
        id: i.id,
        action: i.action,
        score: i.score,
        reasons: i.reasons,
        name: row.p.name,
        age: ageFrom(row.p.birthDate),
        area: row.p.area,
        jobTitle: row.p.jobTitle,
        intent: INTENTS[row.p.intent],
        about: row.p.about,
        prompts: row.p.prompts,
        photo: row.p.photo,
        avatarSeed: row.p.avatarSeed,
        isPersona: row.u.isPersona,
        workVerified: row.u.workEmailVerified,
      };
    })
    .filter((v): v is IntroView => v !== null)
    .sort((a, b) => Number(a.action !== "pending") - Number(b.action !== "pending"));

  const left = views.filter((v) => v.action === "pending").length;

  return (
    <main className="px-5">
      {welcome && (
        <p className="mb-5 rounded-2xl bg-leaf-soft p-4 text-leaf">
          <b>You're in.</b> Here are your first intros. A new set arrives every day, so take your time with these.
        </p>
      )}
      <h1 className="text-3xl font-extrabold">Today's intros</h1>
      <p className="mt-1 text-dusk">
        {fmtDay(new Date())}. {views.length ? `${left} of ${views.length} waiting for you.` : ""} New intros arrive at midnight.
      </p>

      {user.status === "snoozed" && (
        <div className="panel mt-6 p-5">
          <p className="font-bold">Your profile is snoozed</p>
          <p className="mt-1 text-dusk">You won't get intros or be shown to anyone until you turn it back on.</p>
          <Link href="/app/me" className="btn-ghost mt-3">Go to settings</Link>
        </div>
      )}

      {user.status === "active" && views.length === 0 && (
        <div className="panel mt-6 p-6">
          <p className="display text-xl font-bold">No new people for you today</p>
          <p className="mt-2 text-dusk">
            We only show people who fit what you're looking for, and everyone is shown to a limited number of people each day.
            Try widening your age range, or meet people in person at a social.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/events" className="btn-primary">See socials</Link>
            <Link href="/app/me/edit" className="btn-ghost">Edit preferences</Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-5">
        {views.map((v) => (
          <IntroCard key={v.id} intro={v} />
        ))}
      </div>

      {views.length > 0 && left === 0 && (
        <p className="mt-8 text-center text-dusk">
          That's everyone for today. We keep it to {INTROS_PER_DAY} so each person gets real attention. See you tomorrow.
        </p>
      )}
    </main>
  );
}
