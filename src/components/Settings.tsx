"use client";
import { useActionState, useState, useTransition } from "react";
import { keepValues } from "@/lib/keep-values";
import { confirmWorkCode, deleteAccount, sendWorkCode, setHideFromCompany, setPlus, setSnooze } from "@/app/actions/account";
import { SubmitButton } from "./SubmitButton";

export function SwitchRow({ title, text, on, kind }: { title: string; text: string; on: boolean; kind: "snooze" | "company" | "plus" }) {
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  const fn = kind === "snooze" ? setSnooze : kind === "company" ? setHideFromCompany : setPlus;
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm text-dusk">{text}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={title}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setValue(!value);
            await fn(!value);
          })
        }
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors ${value ? "bg-ink" : "bg-mist"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${value ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

export function WorkEmail({ verified, email }: { verified: boolean; email: string | null }) {
  const [sent, sendAction, sending] = useActionState(sendWorkCode, undefined);
  const [done, confirmAction, confirming] = useActionState(confirmWorkCode, undefined);
  if (verified || done?.ok) return <p className="py-4 text-sm"><b>Work email verified</b> <span className="text-dusk">({email ?? "saved"}). Matches see a "Work verified" badge, never the address.</span></p>;
  return (
    <div className="py-4">
      <p className="font-bold">Add a work-verified badge</p>
      <p className="text-sm text-dusk">Optional. We confirm you work where you say, and never show the email.</p>
      {!sent?.ok ? (
        <form onSubmit={keepValues(sendAction)} className="mt-3 flex gap-2">
          <label htmlFor="workEmail" className="sr-only">Work email</label>
          <input id="workEmail" name="workEmail" type="email" placeholder="you@company.com" className="field" required />
          <SubmitButton pending={sending} className="btn-ghost shrink-0" pendingText="Sending…">Send code</SubmitButton>
        </form>
      ) : (
        <form onSubmit={keepValues(confirmAction)} className="mt-3 grid gap-2">
          <p className="rounded-xl bg-marigold/15 px-3 py-2 text-sm">Demo: in production this code is emailed to you. Your code is <b>{sent.message}</b></p>
          <div className="flex gap-2">
            <label htmlFor="code" className="sr-only">Code</label>
            <input id="code" name="code" inputMode="numeric" maxLength={6} placeholder="6-digit code" className="field" required />
            <SubmitButton pending={confirming} className="btn-ghost shrink-0" pendingText="Checking…">Verify</SubmitButton>
          </div>
        </form>
      )}
      {(sent?.error || done?.error) && <p className="mt-2 text-sm text-rose">{sent?.error ?? done?.error}</p>}
    </div>
  );
}

export function DeleteAccount() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  return (
    <details className="py-4">
      <summary className="cursor-pointer font-bold text-rose">Delete my account</summary>
      <form onSubmit={keepValues(action)} className="mt-3 grid gap-2">
        <p className="text-sm text-dusk">This permanently deletes your profile, answers, matches, messages and check-ins. It can't be undone.</p>
        <label htmlFor="confirm" className="text-sm">Type DELETE to confirm</label>
        <input id="confirm" name="confirm" autoComplete="off" className="field" />
        {state?.error && <p className="text-sm text-rose">{state.error}</p>}
        <SubmitButton pending={pending} className="btn-danger" pendingText="Deleting…">Delete everything</SubmitButton>
      </form>
    </details>
  );
}
