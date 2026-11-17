import { Steps } from "@/components/Steps";
import { ConsentForm } from "@/components/OnboardingForms";
import { guardStep } from "@/lib/onboarding-guard";

export default async function ConsentPage() {
  await guardStep("consent");
  return (
    <>
      <Steps current={1} />
      <h1 className="text-3xl font-extrabold">Before you start: your data, in plain words</h1>
      <div className="mt-6 grid gap-4 text-[15px]">
        <Item title="What we collect">
          Your profile (name, age, city, work, photos), your answers to 8 values questions, your messages, and how your
          dates went.
        </Item>
        <Item title="Why">
          To pick your daily intros, run date planning and keep people safe. Nothing else. No ads, and we never sell
          or share data with employers.
        </Item>
        <Item title="Who sees what">
          Matches see your profile. Partner cafés see only a first name and a time for a booking. Moderators see reports.
        </Item>
        <Item title="Your rights">
          Download your data, fix it, or delete your account at any time from Settings. Deleting is as easy as
          signing up. Complaints go to our Grievance Officer, who replies within 24 hours.
        </Item>
      </div>
      <div className="mt-8">
        <ConsentForm />
      </div>
    </>
  );
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-l-2 border-ink pl-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <p className="font-bold">{title}</p>
      <p className="text-dusk">{children}</p>
    </div>
  );
}
