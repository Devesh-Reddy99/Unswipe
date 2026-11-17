import Link from "next/link";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

export function DocPage({ title, intro, updated, children }: { title: string; intro?: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Logo />
        <Link href="/login" className="btn-ghost">Sign in</Link>
      </header>
      <main className="mx-auto max-w-3xl px-6">
        <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-dusk">{intro}</p>}
        {updated && <p className="mt-2 text-sm text-dusk">Last updated {updated}</p>}
        <div className="doc mt-10 grid gap-10">{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-3 grid gap-3 text-[17px] leading-relaxed text-ink/90 [&_li]:ml-5 [&_li]:list-disc [&_ul]:grid [&_ul]:gap-1.5">{children}</div>
    </section>
  );
}
