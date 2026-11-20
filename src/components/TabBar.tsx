"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app/today", label: "Today", icon: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" },
  { href: "/app/matches", label: "Matches", icon: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" },
  { href: "/app/events", label: "Socials", icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 2.7-5 6-5s6 2 6 5m-2.6-4.6C12.5 15.1 14 15 16 15c3.3 0 6 2 6 5" },
  { href: "/app/me", label: "You", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-4 3.6-6 8-6s8 2 8 6" },
];

export function TabBar({ dot }: { dot?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-mist bg-white/95 backdrop-blur">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {TABS.map((t) => {
          const active = path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                prefetch // load the other tabs in the background so tapping them feels instant
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 text-xs ${active ? "font-bold text-ink" : "text-dusk"}`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.icon} />
                </svg>
                {t.label}
                {t.href === "/app/matches" && dot && <span className="absolute right-[34%] top-2 h-2.5 w-2.5 rounded-full bg-rose" aria-label="needs your reply" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
