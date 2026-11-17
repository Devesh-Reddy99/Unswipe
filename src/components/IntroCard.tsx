"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { respondToIntro } from "@/app/actions/dating";
import { Avatar } from "./Avatar";
import { PersonaBadge, VerifiedBadge } from "./Badges";

export type IntroView = {
  id: string;
  action: "pending" | "interested" | "passed";
  score: number;
  reasons: string[];
  name: string;
  age: number;
  area: string;
  jobTitle: string | null;
  intent: string;
  about: string;
  prompts: { q: string; a: string }[];
  photo: string | null;
  avatarSeed: number;
  isPersona: boolean;
  workVerified: boolean;
};

export function IntroCard({ intro }: { intro: IntroView }) {
  const [state, setState] = useState<{ action: IntroView["action"]; matchId?: string; matched?: boolean }>({ action: intro.action });
  const [pending, start] = useTransition();

  const act = (a: "interested" | "passed") =>
    start(async () => {
      const r = await respondToIntro(intro.id, a);
      setState({ action: a, matched: r?.matched, matchId: r?.matchId });
    });

  if (state.matched) {
    return (
      <article className="rounded-3xl border-2 border-rose bg-rose-soft p-6 text-center">
        <Avatar seed={intro.avatarSeed} photo={intro.photo} name={intro.name} size={72} className="mx-auto" />
        <h3 className="display mt-3 text-2xl font-extrabold">It's mutual with {intro.name}</h3>
        <p className="mt-1 text-dusk">You have 72 hours to agree on a first date.</p>
        <Link href={`/app/matches/${state.matchId}`} className="btn-dark mt-4">Say hi and plan a date</Link>
      </article>
    );
  }

  if (state.action !== "pending") {
    return (
      <article className="flex items-center gap-3 rounded-2xl border border-dashed border-mist px-4 py-3 text-dusk">
        <Avatar seed={intro.avatarSeed} photo={intro.photo} name={intro.name} size={36} className="opacity-60" />
        <p className="text-sm">
          {state.action === "interested"
            ? `You're interested in ${intro.name}. If it's mutual, they'll appear in Matches.`
            : `You passed on ${intro.name}. They won't be shown again.`}
        </p>
      </article>
    );
  }

  return (
    <article className="panel overflow-hidden">
      <div className="flex gap-4 p-5">
        <Avatar seed={intro.avatarSeed} photo={intro.photo} name={intro.name} size={84} />
        <div className="min-w-0">
          <h3 className="display text-2xl font-extrabold">
            {intro.name}, {intro.age}
          </h3>
          <p className="text-dusk">
            {intro.jobTitle ? `${intro.jobTitle}, ` : ""}
            {intro.area}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <VerifiedBadge />
            {intro.workVerified && <VerifiedBadge label="Work verified" />}
            {intro.isPersona && <PersonaBadge />}
          </div>
        </div>
      </div>

      <div className="mx-5 rounded-2xl bg-paper p-4">
        <p className="flex items-baseline justify-between">
          <span className="font-bold">Why you might click</span>
          <span className="text-sm text-dusk">{intro.score}% fit</span>
        </p>
        <ul className="mt-2 grid gap-1">
          {intro.reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-leaf" aria-hidden>✓</span>
              {r}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-dusk">Looking for: {intro.intent}</p>
      </div>

      <div className="grid gap-4 p-5">
        {intro.prompts.map((p) => (
          <div key={p.q}>
            <p className="text-sm text-dusk">{p.q}</p>
            <p className="display text-lg font-semibold leading-snug">{p.a}</p>
          </div>
        ))}
        {intro.about && <p className="text-dusk">{intro.about}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-mist p-4">
        <button className="btn-ghost" disabled={pending} onClick={() => act("passed")}>Pass</button>
        <button className="btn-primary" disabled={pending} onClick={() => act("interested")}>
          {pending ? "Saving…" : "I'm interested"}
        </button>
      </div>
    </article>
  );
}
