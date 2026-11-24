"use client";
import { useActionState, useState } from "react";
import { keepValues } from "@/lib/keep-values";
import { acceptSlot, blockAndReport, cancelDate, declinePlan, demoSkipToAfterDate, proposePlan, requestExtension, submitFeedback, unmatch } from "@/app/actions/dating";
import type { Venue } from "@/db/schema";
import { REPORT_REASONS } from "@/lib/constants";
import { SubmitButton } from "./SubmitButton";

const KIND: Record<string, string> = { cafe: "Café", food: "Food", walk: "Walk", activity: "Activity" };

export function Planner({
  matchId,
  venues,
  slots,
  otherName,
  nearAreas,
}: {
  matchId: string;
  venues: Venue[];
  slots: { iso: string; label: string }[];
  otherName: string;
  nearAreas: string[];
}) {
  const [state, action, pending] = useActionState(proposePlan.bind(null, matchId), undefined);
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  if (state?.ok) return null;
  if (!open)
    return (
      <button className="btn-primary w-full py-3 text-lg" onClick={() => setOpen(true)}>
        Plan a date with {otherName}
      </button>
    );
  return (
    <form onSubmit={keepValues(action)} className="panel grid gap-6 p-5">
      <fieldset>
        <legend className="display text-xl font-bold">1. Pick a place</legend>
        <p className="hint mt-1">Partner places give Unswipe dates a perk. Places near you or {otherName} are listed first.</p>
        <div className="mt-3 grid gap-2">
          {venues.map((v) => (
            <label key={v.id} className="flex cursor-pointer gap-3 rounded-xl border border-mist bg-white p-3 has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink">
              <input type="radio" name="venueId" value={v.id} required className="mt-1 accent-ink" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-bold">{v.name}</span>
                  <span className="text-sm text-dusk">{KIND[v.kind]}, ₹{v.priceForTwo} for two</span>
                </span>
                <span className="block text-sm text-dusk">
                  {v.area}
                  {nearAreas.includes(v.area) ? " (near you two)" : ""}. {v.blurb}
                </span>
                {v.perk && <span className="mt-1 inline-block rounded-full bg-marigold/20 px-2 py-0.5 text-xs font-bold text-marigold-deep">{v.perk}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="display text-xl font-bold">2. Offer up to three times</legend>
        <p className="hint mt-1">Based on when you're both usually free. {otherName} picks one.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {slots.map((s) => {
            const on = picked.includes(s.iso);
            return (
              <label key={s.iso} className={`chip cursor-pointer ${on ? "chip-on" : ""} has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-marigold`}>
                <input
                  type="checkbox"
                  name="slots"
                  value={s.iso}
                  checked={on}
                  className="sr-only"
                  onChange={() => setPicked((p) => (on ? p.filter((x) => x !== s.iso) : p.length < 3 ? [...p, s.iso] : p))}
                />
                {s.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div>
        <label htmlFor="note" className="label">A note (optional)</label>
        <input id="note" name="note" maxLength={200} placeholder="I'll be the one with the yellow tote bag" className="field" />
      </div>
      {state?.error && <p role="alert" className="font-bold text-rose">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton pending={pending} pendingText="Sending…">Send suggestion</SubmitButton>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Not now</button>
      </div>
    </form>
  );
}

export function RespondToPlan({ planId, slots }: { planId: string; slots: { iso: string; label: string }[] }) {
  return (
    <div className="grid gap-2">
      {slots.map((s) => (
        <form key={s.iso} action={acceptSlot.bind(null, planId, s.iso)}>
          <SubmitButton className="btn-ghost w-full justify-between" pendingText="Confirming…">
            <span>{s.label}</span>
            <span className="text-marigold-deep">This works</span>
          </SubmitButton>
        </form>
      ))}
      <form action={declinePlan.bind(null, planId)}>
        <SubmitButton className="w-full py-2 text-sm text-dusk underline" pendingText="…">
          None of these work for me
        </SubmitButton>
      </form>
    </div>
  );
}

export function ConfirmedActions({ planId, shareUrl, mapsUrl, isDemo }: { planId: string; shareUrl: string; mapsUrl: string; isDemo: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-dark"
          onClick={async () => {
            const url = location.origin + shareUrl;
            if (navigator.share) {
              try {
                await navigator.share({ title: "My date plan", url });
                return;
              } catch {
                /* fall back to copying */
              }
            }
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
        >
          {copied ? "Link copied" : "Share with a friend"}
        </button>
        <a className="btn-ghost" href={`/api/plans/${planId}/ics`}>Add to calendar</a>
      </div>
      <a className="btn-ghost" href={mapsUrl} target="_blank" rel="noreferrer">Directions</a>
      <details className="text-sm">
        <summary className="cursor-pointer py-2 text-center text-dusk">Can't make it?</summary>
        <form action={cancelDate.bind(null, planId)} className="pt-1">
          <p className="mb-2 text-dusk">Cancelling lets them know straight away and gives you 48 hours to pick a new time. Not turning up without cancelling lowers how often you're shown.</p>
          <SubmitButton className="btn-danger w-full" pendingText="Cancelling…">Cancel this date</SubmitButton>
        </form>
      </details>
      {isDemo && (
        <form action={demoSkipToAfterDate.bind(null, planId)} className="rounded-xl border border-dashed border-dusk/40 p-3">
          <p className="mb-2 text-xs text-dusk">Demo control: jump to after the date so you can try the private check-in.</p>
          <SubmitButton className="btn-ghost w-full text-sm" pendingText="…">Skip to after the date</SubmitButton>
        </form>
      )}
    </div>
  );
}

export function FeedbackForm({ planId, otherName }: { planId: string; otherName: string }) {
  const [state, action, pending] = useActionState(submitFeedback.bind(null, planId), undefined);
  const [met, setMet] = useState<string>("");
  if (state?.ok) return <p className="rounded-2xl bg-leaf-soft p-4 text-leaf">Thanks. Your answers are private and help us pick better intros.</p>;
  return (
    <form onSubmit={keepValues(action)} className="panel grid gap-5 p-5">
      <div>
        <h2 className="display text-xl font-bold">How did it go with {otherName}?</h2>
        <p className="hint mt-1">Private. {otherName} never sees your answers.</p>
      </div>
      <Radio name="met" legend="Did you meet?" onChange={setMet} options={[["yes", "Yes, we met"], ["they_no_show", `${otherName} didn't turn up`], ["cancelled", "We cancelled"]]} />
      {met === "yes" && (
        <>
          <Radio name="again" legend={`Would you like to see ${otherName} again?`} options={[["yes", "Yes"], ["no", "Not really"]]} />
          <Radio name="feltSafe" legend="Did you feel safe and respected?" options={[["yes", "Yes"], ["no", "No"]]} />
          <div>
            <label htmlFor="fbnote" className="label">Anything we should know? (optional)</label>
            <textarea id="fbnote" name="note" rows={2} maxLength={500} className="field" />
          </div>
        </>
      )}
      {state?.error && <p role="alert" className="font-bold text-rose">{state.error}</p>}
      <div>
        <SubmitButton pending={pending} pendingText="Sending…" disabled={pending || !met}>Send privately</SubmitButton>
      </div>
    </form>
  );
}

function Radio({ name, legend, options, onChange }: { name: string; legend: string; options: [string, string][]; onChange?: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label key={v} className="chip cursor-pointer has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-marigold">
            <input type="radio" name={name} value={v} required className="sr-only" onChange={() => onChange?.(v)} />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ExtendButton({ matchId, asked }: { matchId: string; asked: boolean }) {
  if (asked) return <p className="text-sm text-dusk">You asked for more time. It's added once they ask too.</p>;
  return (
    <form action={requestExtension.bind(null, matchId)}>
      <SubmitButton className="text-sm font-bold text-ink underline" pendingText="Asking…">Ask for 48 more hours</SubmitButton>
    </form>
  );
}

export function MatchMenu({ matchId, otherName }: { matchId: string; otherName: string }) {
  const [state, action, pending] = useActionState(blockAndReport.bind(null, matchId), undefined);
  return (
    <details className="relative">
      <summary className="btn-ghost cursor-pointer list-none px-3 py-1.5 text-sm" aria-label="More options">•••</summary>
      <div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-mist bg-white p-4 shadow-lg">
        <form action={unmatch.bind(null, matchId)}>
          <SubmitButton className="btn-ghost w-full" pendingText="Closing…">Unmatch {otherName}</SubmitButton>
        </form>
        <form onSubmit={keepValues(action)} className="mt-4 grid gap-2 border-t border-mist pt-4">
          <p className="font-bold">Report and block</p>
          <label htmlFor="reason" className="sr-only">Reason</label>
          <select id="reason" name="reason" required defaultValue="" className="field text-sm">
            <option value="" disabled>What happened?</option>
            {REPORT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label htmlFor="details" className="sr-only">Details</label>
          <textarea id="details" name="details" rows={2} placeholder="Details (optional)" className="field text-sm" />
          {state?.error && <p className="text-sm text-rose">{state.error}</p>}
          <SubmitButton pending={pending} className="btn-danger" pendingText="Reporting…">Report and block</SubmitButton>
          <p className="text-xs text-dusk">They won't know you reported them. In danger? Call 112.</p>
        </form>
      </div>
    </details>
  );
}
