import { fmtDay, fmtTime } from "@/lib/time";

/** The confirmed-date ticket. Used on the landing page and for every real confirmed date. */
export function Ticket({
  when,
  venue,
  area,
  names,
  perk,
  reason,
  notchBg,
  stamp = true,
}: {
  when: Date | string;
  venue: string;
  area: string;
  names: string;
  perk?: string | null;
  reason?: string;
  notchBg?: string;
  stamp?: boolean;
}) {
  return (
    <div className="ticket" style={notchBg ? ({ "--notch-bg": notchBg } as React.CSSProperties) : undefined}>
      <div className="relative p-5 pb-4">
        <p className="text-sm text-dusk">First date</p>
        <p className="display mt-1 text-2xl font-bold">{fmtDay(when)}</p>
        <p className="display text-4xl font-extrabold">{fmtTime(when)}</p>
        <p className="mt-3 font-bold">{venue}</p>
        <p className="text-dusk">{area}</p>
        {stamp && (
          <span className="stamp absolute bottom-5 right-5 rounded-md border-2 border-rose px-2 py-0.5 text-sm font-bold text-rose">
            Confirmed
          </span>
        )}
      </div>
      <div className="ticket-tear" />
      <div className="flex flex-wrap items-center justify-between gap-2 p-5 pt-4 text-sm">
        <span className="font-bold">{names}</span>
        {perk && <span className="rounded-full bg-marigold/20 px-2.5 py-0.5 font-bold text-marigold-deep">{perk}</span>}
        {reason && <span className="w-full text-dusk">{reason}</span>}
      </div>
    </div>
  );
}
