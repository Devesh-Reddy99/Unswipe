import { Logo } from "./Logo";

export function AuthShell({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl content-start gap-10 px-6 py-8 md:grid-cols-2 md:content-center">
      <div>
        <Logo />
        <h1 className="mt-10 text-4xl font-extrabold">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
      {aside && <aside>{aside}</aside>}
    </main>
  );
}
