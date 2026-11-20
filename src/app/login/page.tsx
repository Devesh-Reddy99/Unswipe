import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm, DemoLogin } from "@/components/AuthForms";

export const metadata = { title: "Sign in · Unswipe" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      aside={
        <div className={`panel p-6 ${demo ? "ring-2 ring-marigold" : ""}`}>
          <h2 className="text-xl font-bold">Try it with a demo account</h2>
          <p className="hint mt-1">
            These accounts already have matches, a date waiting to be accepted and a date to review. Demo personas reply
            automatically so you can try every step on your own.
          </p>
          <div className="mt-5 grid gap-2.5">
            <DemoLogin email="aarav@unswipe.test" password="unswipe123" label="Aarav, 25" sub="Man, Bengaluru" />
            <DemoLogin email="diya@unswipe.test" password="unswipe123" label="Diya, 24" sub="Woman, Bengaluru" />
          </div>
          <p className="hint mt-4">Aarav and Diya have a date with each other. Sign in as both in two browsers to see both sides.</p>
        </div>
      }
    >
      <LoginForm />
      <p className="mt-6 text-dusk">
        New here?{" "}
        <Link href="/signup" className="font-bold text-ink underline">
          Create a profile
        </Link>
      </p>
      <p className="mt-2 text-sm text-dusk">
        Unswipe team?{" "}
        <Link href="/admin/login" className="underline">
          Admin sign-in
        </Link>
      </p>
    </AuthShell>
  );
}
