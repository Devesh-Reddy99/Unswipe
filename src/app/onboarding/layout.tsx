import { Logo } from "@/components/Logo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Logo href="/" />
      <div className="mt-8">{children}</div>
    </main>
  );
}
