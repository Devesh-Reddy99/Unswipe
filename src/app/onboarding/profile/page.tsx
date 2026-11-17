import { Steps } from "@/components/Steps";
import { ProfileForm } from "@/components/ProfileForm";
import { guardStep } from "@/lib/onboarding-guard";

export default async function ProfileStep() {
  await guardStep("profile");
  return (
    <>
      <Steps current={2} />
      <h1 className="text-3xl font-extrabold">Your profile</h1>
      <p className="mt-3 mb-8 text-dusk">Only people in your daily intros and your matches can see this. There is no public browsing.</p>
      <ProfileForm submitLabel="Save and continue" />
    </>
  );
}
