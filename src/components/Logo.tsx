import Link from "next/link";

/** Wordmark: "unswipe" with a small location pin standing in for the dot of the i: a real place to meet. */
export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`display inline-flex items-baseline text-2xl font-extrabold ${light ? "text-paper" : "text-ink"}`}>
      unsw
      <span className="relative inline-block">
        ı
        <svg viewBox="0 0 12 16" className="absolute -top-[0.45em] left-1/2 h-[0.55em] w-[0.42em] -translate-x-1/2" aria-hidden>
          <path d="M6 15s5-5.4 5-9A5 5 0 0 0 1 6c0 3.6 5 9 5 9z" fill="#F0A22E" />
          <circle cx="6" cy="6" r="1.8" fill={light ? "#221B33" : "#fff"} />
        </svg>
      </span>
      pe
    </Link>
  );
}
