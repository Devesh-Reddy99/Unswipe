import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm, DemoLogin } from "@/components/AuthForms";

export const metadata = { title: "Team sign-in · Unswipe", robots: { index: false } };

/*
 * Separate sign-in for the Unswipe team (ops and moderation).
 * Keeping it apart from the members' login keeps team tools out of the member journey,
 * and the server refuses member accounts here (see the "portal" check in actions/auth.ts).
 */
export default function AdminLoginPage() {
  return (
    <AuthShell
      title="Team sign-in"
      aside={
        <div className="panel p-6">
          <h2 className="text-xl font-bold">Demo admin account</h2>
          <p className="hint mt-1">
            Opens the ops and moderation dashboard: good first dates per week, the intro-to-second-date funnel, venue billing,
            reports to review, grievances and the city waitlist.
          </p>
          <div className="mt-5">
            <DemoLogin email="admin@unswipe.test" password="admin123" label="Ops & moderation" sub="Admin" portal="admin" />
          </div>
        </div>
      }
    >
      <p className="-mt-2 mb-6 text-dusk">For the Unswipe team only. Member accounts can't sign in here.</p>
      <LoginForm portal="admin" />
      <p className="mt-6 text-dusk">
        Looking for the dating app?{" "}
        <Link href="/login" className="font-bold text-ink underline">
          Member sign-in
        </Link>
      </p>
    </AuthShell>
  );
}
