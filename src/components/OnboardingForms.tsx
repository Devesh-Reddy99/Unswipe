"use client";
import { useActionState } from "react";
import Link from "next/link";
import { giveConsent, verifyElitmus } from "@/app/actions/onboarding";
import { SubmitButton } from "./SubmitButton";

export function VerifyForm() {
  const [state, action] = useActionState(verifyElitmus, undefined);
  return (
    <form action={action} className="grid gap-5">
      <div>
        <label className="label" htmlFor="elitmusId">eLitmus candidate ID</label>
        <input id="elitmusId" name="elitmusId" inputMode="numeric" pattern="\d{7}" maxLength={7} required placeholder="7 digits" className="field max-w-xs" />
        <p className="hint mt-1">Shown at the top right of your eLitmus dashboard. In this demo, any 7 digits work.</p>
      </div>
      <div>
        <label className="label" htmlFor="gradYear">Graduation year</label>
        <select id="gradYear" name="gradYear" required className="field max-w-xs" defaultValue="2022">
          {[2020, 2021, 2022, 2023].map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <p className="hint mt-1">In the real product this comes from eLitmus, so you don't type it.</p>
      </div>
      {state?.error && <p role="alert" className="font-bold text-rose">{state.error}</p>}
      <div>
        <SubmitButton pendingText="Verifying…">Verify with eLitmus</SubmitButton>
      </div>
    </form>
  );
}

export function ConsentForm() {
  const [state, action] = useActionState(giveConsent, undefined);
  return (
    <form action={action} className="grid gap-4">
      <Check name="adult">I am 18 or older.</Check>
      <Check name="processing">
        I agree that Unswipe can use my profile, answers, messages and date check-ins to suggest matches, run dates and
        keep members safe, as explained in the{" "}
        <Link href="/privacy" target="_blank" className="underline">privacy notice</Link>.
      </Check>
      <Check name="terms">
        I agree to the <Link href="/terms" target="_blank" className="underline">terms</Link> and the community rules:
        be honest, be kind, turn up or cancel.
      </Check>
      {state?.error && <p role="alert" className="font-bold text-rose">{state.error}</p>}
      <div>
        <SubmitButton pendingText="Saving…">I agree, continue</SubmitButton>
      </div>
    </form>
  );
}

function Check({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-mist bg-white p-4 has-[:checked]:border-ink">
      <input type="checkbox" name={name} className="mt-1 h-5 w-5 shrink-0 accent-ink" />
      <span>{children}</span>
    </label>
  );
}
