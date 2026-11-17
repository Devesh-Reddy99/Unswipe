import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listMatches } from "@/lib/matches";
import { TabBar } from "@/components/TabBar";
import { Logo } from "@/components/Logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const matches = user.role === "admin" ? [] : await listMatches(user.id);
  // Red dot when someone is waiting on you: a date suggestion to answer
  const waiting = matches.some((m) => m.match.status === "active" && m.plan?.status === "proposed" && m.plan.proposerId !== user.id);
  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-24">
      <header className="flex items-center justify-between px-5 pb-2 pt-5">
        <Logo href="/app/today" />
        {user.isDemo && (
          <Link href="/login?demo=1" className="rounded-full bg-marigold/20 px-3 py-1 text-xs font-bold text-marigold-deep">
            Demo account
          </Link>
        )}
        {user.role === "admin" && (
          <Link href="/admin" className="btn-dark px-3 py-1 text-sm">Admin</Link>
        )}
      </header>
      {children}
      <TabBar dot={waiting} />
    </div>
  );
}
