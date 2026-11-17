import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { SignupForm } from "@/components/AuthForms";

export const metadata = { title: "Create your profile · Offline" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your profile"
      aside={
        <div className="panel p-6">
          <h2 className="text-xl font-bold">What happens next</h2>
          <ol className="mt-4 grid gap-3 text-dusk">
            <li><b className="text-ink">1. Verify.</b> Link your eLitmus account (in this demo, any 7-digit ID works).</li>
            <li><b className="text-ink">2. Consent.</b> A short, plain-language notice about what we store and why.</li>
            <li><b className="text-ink">3. Profile.</b> The basics, two short prompts and how you like to meet.</li>
            <li><b className="text-ink">4. Values.</b> Eight quick questions that power your daily intros.</li>
          </ol>
          <p className="hint mt-4">Takes about 4 minutes. Offline is for adults (18+) only.</p>
        </div>
      }
    >
      <SignupForm />
      <p className="mt-6 text-dusk">
        Already a member?{" "}
        <Link href="/login" className="font-bold text-ink underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
