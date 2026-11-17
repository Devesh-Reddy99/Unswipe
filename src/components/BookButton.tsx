"use client";
import { useState, useTransition } from "react";
import { bookTicket, cancelTicket } from "@/app/actions/account";

export function BookButton({ eventId, booked, full, price }: { eventId: string; booked: boolean; full: boolean; price: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  if (booked)
    return (
      <span className="flex items-center gap-3">
        <span className="font-bold text-leaf">You're going</span>
        <button className="text-sm text-dusk underline" disabled={pending} onClick={() => start(() => cancelTicket(eventId))}>
          Cancel
        </button>
      </span>
    );
  if (full) return <span className="text-sm font-bold text-dusk">Full</span>;
  if (confirming)
    return (
      <span className="grid justify-items-end gap-1">
        <span className="text-xs text-dusk">Demo checkout: no money is charged.</span>
        <span className="flex gap-2">
          <button className="btn-ghost px-3 py-1.5 text-sm" onClick={() => setConfirming(false)}>Back</button>
          <button
            className="btn-primary px-3 py-1.5 text-sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await bookTicket(eventId);
                if (r?.error) setError(r.error);
                setConfirming(false);
              })
            }
          >
            {pending ? "Booking…" : `Pay ₹${price}`}
          </button>
        </span>
        {error && <span className="text-sm text-rose">{error}</span>}
      </span>
    );
  return (
    <span className="grid justify-items-end gap-1">
      <button className="btn-primary px-4 py-1.5" onClick={() => setConfirming(true)}>Book a seat</button>
      {error && <span className="text-sm text-rose">{error}</span>}
    </span>
  );
}
