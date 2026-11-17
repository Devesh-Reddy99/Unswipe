import { Steps } from "@/components/Steps";
import { ValuesForm } from "@/components/ValuesForm";
import { guardStep } from "@/lib/onboarding-guard";

export default async function ValuesStep() {
  await guardStep("values");
  return (
    <>
      <Steps current={3} />
      <h1 className="text-3xl font-extrabold">Eight quick questions</h1>
      <p className="mt-3 mb-8 text-dusk">
        These decide who you're introduced to, along with what you're looking for and when you're free. Your answers are
        never shown on your profile, only the things you have in common with a match.
      </p>
      <ValuesForm submitLabel="See my first intros" />
    </>
  );
}
