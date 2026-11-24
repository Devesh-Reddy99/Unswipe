import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { ageFrom } from "@/lib/time";
import { INTENTS, PLUS_PRICE_INR } from "@/lib/constants";
import { Avatar } from "@/components/Avatar";
import { VerifiedBadge } from "@/components/Badges";
import { DeleteAccount, SwitchRow, WorkEmail } from "@/components/Settings";

export const dynamic = "force-dynamic";

export default async function Me() {
  const user = await requireUser();
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  return (
    <main className="px-5">
      <h1 className="text-3xl font-extrabold">You</h1>

      <section className="panel mt-6 p-5" aria-label="Your profile">
        <div className="flex items-center gap-4">
          <Avatar seed={p.avatarSeed} photo={p.photo} name={p.name} size={72} />
          <div>
            <p className="display text-2xl font-extrabold">
              {p.name}, {ageFrom(p.birthDate)}
            </p>
            <p className="text-dusk">
              {p.jobTitle ? `${p.jobTitle}, ` : ""}
              {p.area}, {p.city}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {user.elitmusVerified && <VerifiedBadge />}
              {user.workEmailVerified && <VerifiedBadge label="Work verified" />}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-dusk">Looking for: {INTENTS[p.intent].toLowerCase()}. Class of {p.gradYear}.</p>
        {p.prompts.map((x) => (
          <p key={x.q} className="mt-2">
            <span className="text-sm text-dusk">{x.q}</span> {x.a}
          </p>
        ))}
        <div className="mt-4 flex gap-2">
          <Link href="/app/me/edit" className="btn-ghost">Edit profile</Link>
          <Link href="/app/me/values" className="btn-ghost">Edit answers</Link>
        </div>
      </section>

      <section className="mt-8" aria-label="Privacy and visibility">
        <h2 className="text-xl font-bold">Privacy and visibility</h2>
        <div className="divide-y divide-mist">
          <SwitchRow kind="snooze" title="Snooze my profile" text="Take a break. No intros, and nobody sees you, until you turn this off." on={user.status === "snoozed"} />
          <SwitchRow kind="company" title="Hide me from my company" text={p.company ? `People who work at ${p.company} won't see you, and you won't see them.` : "Add your company to your profile to use this."} on={p.hideFromCompany} />
          <WorkEmail verified={user.workEmailVerified} email={user.workEmail} />
        </div>
      </section>

      <section className="mt-8" aria-label="Unswipe Plus">
        <h2 className="text-xl font-bold">Unswipe Plus</h2>
        <p className="mt-1 text-sm text-dusk">
          ₹{PLUS_PRICE_INR}/month. Convenience, never visibility: Travel mode (get intros in a city before you move), 5 days to
          plan instead of 3, your full compatibility breakdown and early booking for socials. Plus never makes you appear in more intros.
        </p>
        <div className="divide-y divide-mist">
          <SwitchRow kind="plus" title="Plus (demo, no charge)" text="Turn on to see how a subscriber's account is marked." on={user.plus} />
        </div>
      </section>

      <section className="mt-8" aria-label="Your data">
        <h2 className="text-xl font-bold">Your data</h2>
        <div className="divide-y divide-mist">
          <div className="py-4">
            <p className="font-bold">Download my data</p>
            <p className="text-sm text-dusk">Everything we hold about you, in one file (JSON).</p>
            <a href="/api/me/export" className="btn-ghost mt-3">Download</a>
          </div>
          <DeleteAccount />
          <p className="py-4 text-sm text-dusk">
            Consent given {user.consentAt ? user.consentAt.toISOString().slice(0, 10) : "-"} (notice version {user.consentVersion}).{" "}
            <Link href="/privacy" className="underline">Privacy notice</Link>. <Link href="/grievance" className="underline">Contact the Grievance Officer</Link>.
          </p>
        </div>
      </section>

      <div className="mt-6 pb-6">
        <SignOutButton className="btn-ghost w-full" />
      </div>
    </main>
  );
}
