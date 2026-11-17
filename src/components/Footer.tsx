import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-3 max-w-sm text-paper/70">
            From the eLitmus family. A separate product with separate data: nothing you do here is ever shared with
            employers or used in hiring.
          </p>
        </div>
        <nav aria-label="Product" className="grid content-start gap-2 text-paper/80">
          <Link href="/why" className="hover:text-marigold">Why we built it this way</Link>
          <Link href="/venues" className="hover:text-marigold">For cafés and venues</Link>
          <Link href="/login" className="hover:text-marigold">Sign in</Link>
        </nav>
        <nav aria-label="Legal" className="grid content-start gap-2 text-paper/80">
          <Link href="/safety" className="hover:text-marigold">Safety centre</Link>
          <Link href="/privacy" className="hover:text-marigold">Privacy notice</Link>
          <Link href="/terms" className="hover:text-marigold">Terms of use</Link>
          <Link href="/grievance" className="hover:text-marigold">Grievance officer</Link>
        </nav>
      </div>
      <p className="border-t border-paper/10 px-6 py-5 text-center text-sm text-paper/50">
        Built as a product assignment for eLitmus. Demo profiles use illustrated avatars, not real people.
      </p>
    </footer>
  );
}
