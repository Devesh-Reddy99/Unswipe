"use client";
import { useActionState } from "react";
import { joinWaitlist } from "@/app/actions/public";
import { WAITLIST_CITIES } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

export function WaitlistForm() {
  const [state, action] = useActionState(joinWaitlist, undefined);
  if (state?.ok) return <p className="rounded-xl bg-leaf-soft p-4 font-bold text-leaf">{state.message}</p>;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
      <label className="sr-only" htmlFor="wl-email">Email</label>
      <input id="wl-email" name="email" type="email" required placeholder="you@email.com" className="field" />
      <label className="sr-only" htmlFor="wl-city">City</label>
      <select id="wl-city" name="city" required className="field" defaultValue="">
        <option value="" disabled>Your city</option>
        {WAITLIST_CITIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor="wl-gender">I am a</label>
      <select id="wl-gender" name="gender" required className="field" defaultValue="">
        <option value="" disabled>I am a…</option>
        <option value="woman">Woman</option>
        <option value="man">Man</option>
        <option value="nonbinary">Non-binary person</option>
      </select>
      <SubmitButton pendingText="Joining…">Join waitlist</SubmitButton>
      {state?.error && <p className="text-sm text-rose sm:col-span-4">{state.error}</p>}
    </form>
  );
}
