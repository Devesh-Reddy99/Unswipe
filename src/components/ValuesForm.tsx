"use client";
import { useActionState } from "react";
import { keepValues } from "@/lib/keep-values";
import { saveValues } from "@/app/actions/onboarding";
import { QUESTIONS } from "@/lib/constants";
import type { Answer } from "@/db/schema";
import { SubmitButton } from "./SubmitButton";

const WEIGHTS = ["Not much", "Somewhat", "A lot"];

export function ValuesForm({ initial, submitLabel }: { initial?: Record<string, Answer>; submitLabel: string }) {
  const [state, action, pending] = useActionState(saveValues, undefined);
  return (
    <form onSubmit={keepValues(action)} className="grid gap-6">
      {QUESTIONS.map((q, qi) => (
        <fieldset key={q.id} className="panel p-5">
          <legend className="sr-only">{q.text}</legend>
          <p className="display text-lg font-bold" aria-hidden>
            {qi + 1}. {q.text}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {q.options.map((o, i) => (
              <label key={o} className="chip cursor-pointer has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-marigold">
                <input type="radio" name={`q_${q.id}`} value={i} required defaultChecked={initial?.[q.id]?.a === i} className="sr-only" />
                {o}
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dusk">
            <span>How much does this matter to you?</span>
            {WEIGHTS.map((w, i) => (
              <label key={w} className="inline-flex cursor-pointer items-center gap-1.5">
                <input type="radio" name={`w_${q.id}`} value={i} defaultChecked={(initial?.[q.id]?.w ?? 1) === i} className="accent-ink" />
                {w}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {state?.error && <p role="alert" className="font-bold text-rose">{state.error}</p>}
      {state?.ok && <p role="status" className="font-bold text-leaf">{state.message}</p>}
      <div>
        <SubmitButton pending={pending} pendingText="Saving…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
