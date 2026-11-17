import { Steps } from "@/components/Steps";
import { VerifyForm } from "@/components/OnboardingForms";
import { guardStep } from "@/lib/onboarding-guard";

export default async function VerifyPage() {
  await guardStep("verify");
  return (
    <>
      <Steps current={0} />
      <h1 className="text-3xl font-extrabold">Link your eLitmus account</h1>
      <p className="mt-3 text-dusk">
        Every Offline member is a real, identity-checked graduate. That is how we keep out fake profiles.
      </p>
      <div className="mt-6 grid gap-3 rounded-2xl bg-leaf-soft p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="font-bold text-leaf">What we receive</p>
          <p className="mt-1">That you are verified (yes or no) and your graduation year.</p>
        </div>
        <div>
          <p className="font-bold text-leaf">What we never receive</p>
          <p className="mt-1">Your test scores, percentile, job applications or anything an employer sees.</p>
        </div>
      </div>
      <div className="mt-8">
        <VerifyForm />
      </div>
    </>
  );
}
