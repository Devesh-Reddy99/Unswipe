"use client";
import { useActionState } from "react";
import { keepValues } from "@/lib/keep-values";
import { submitGrievance } from "@/app/actions/public";
import { SubmitButton } from "./SubmitButton";

export function GrievanceForm() {
  const [state, action, pending] = useActionState(submitGrievance, undefined);
  if (state?.ok) return <p role="status" className="rounded-2xl bg-leaf-soft p-4 font-bold text-leaf">{state.message}</p>;
  return (
    <form onSubmit={keepValues(action)} className="grid gap-4">
      <div>
        <label htmlFor="g-email" className="label">Your email</label>
        <input id="g-email" name="email" type="email" required className="field" />
      </div>
      <div>
        <label htmlFor="g-subject" className="label">Subject</label>
        <input id="g-subject" name="subject" required maxLength={120} className="field" />
      </div>
      <div>
        <label htmlFor="g-body" className="label">What happened?</label>
        <textarea id="g-body" name="body" rows={5} required maxLength={4000} className="field" />
      </div>
      {state?.error && <p role="alert" className="font-bold text-rose">{state.error}</p>}
      <div>
        <SubmitButton pending={pending} pendingText="Sending…">Send to the Grievance Officer</SubmitButton>
      </div>
    </form>
  );
}
