import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listMatches } from "@/lib/matches";
import { Avatar } from "@/components/Avatar";
import { fmtDateTime, hoursLeft } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Matches({ searchParams }: { searchParams: Promise<{ reported?: string }> }) {
  const user = await requireUser();
  const { reported } = await searchParams;
  const all = await listMatches(user.id);
  const open = all.filter((m) => m.match.status === "active" || m.match.status === "planned");
  const past = all.filter((m) => m.match.status === "expired" || m.match.status === "closed");

  const status = (m: (typeof all)[number]) => {
    const p = m.plan;
    if (m.match.status === "planned" && p?.status === "confirmed" && p.chosenSlot) {
      return p.chosenSlot > new Date() ? { text: `Date on ${fmtDateTime(p.chosenSlot)}`, tone: "rose" } : { text: "How did it go? Tell us", tone: "marigold" };
    }
    if (m.match.secondDateUnlocked) return { text: "Second date unlocked", tone: "leaf" };
    if (p?.status === "proposed" && p.proposerId !== user.id) return { text: "Suggested a date: your turn", tone: "marigold" };
    if (p?.status === "proposed") return { text: "Waiting for them to pick a time", tone: "dusk" };
    return { text: `${hoursLeft(m.match.expiresAt)}h left to plan a date`, tone: "dusk" };
  };

  return (
    <main className="px-5">
      <h1 className="text-3xl font-extrabold">Matches</h1>
      {reported && (
        <p role="status" className="mt-4 rounded-2xl bg-leaf-soft p-4 text-leaf">
          Thanks for telling us. They've been blocked and our team will review the report within 24 hours.
        </p>
      )}
      {open.length === 0 && (
        <div className="panel mt-6 p-6">
          <p className="display text-xl font-bold">No matches yet</p>
          <p className="mt-2 text-dusk">When you and someone from your intros are both interested, they'll show up here.</p>
          <Link href="/app/today" className="btn-primary mt-4">See today's intros</Link>
        </div>
      )}
      <ul className="mt-6 grid gap-3">
        {open.map((m) => {
          const s = status(m);
          return (
            <li key={m.match.id} className="min-w-0">
              <Link href={`/app/matches/${m.match.id}`} className="panel flex items-center gap-4 p-4 hover:border-dusk">
                <Avatar seed={m.other.avatarSeed} photo={m.other.photo} name={m.other.name} size={56} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{m.other.name}</p>
                  <p className="truncate text-sm text-dusk">{m.last?.body ?? ""}</p>
                </div>
                <span
                  className={`max-w-[9rem] text-right text-xs font-bold ${
                    s.tone === "rose" ? "text-rose" : s.tone === "marigold" ? "text-marigold-deep" : s.tone === "leaf" ? "text-leaf" : "text-dusk"
                  }`}
                >
                  {s.text}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {past.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-bold text-dusk">Closed</h2>
          <ul className="mt-3 grid gap-2">
            {past.map((m) => (
              <li key={m.match.id} className="min-w-0">
                <Link href={`/app/matches/${m.match.id}`} className="flex items-center gap-3 rounded-2xl px-2 py-2 text-dusk hover:bg-white">
                  <Avatar seed={m.other.avatarSeed} photo={m.other.photo} name={m.other.name} size={36} className="opacity-60" />
                  <span>{m.other.name}</span>
                  <span className="ml-auto text-xs">{m.match.status === "expired" ? "Expired, no date planned" : "Closed"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
