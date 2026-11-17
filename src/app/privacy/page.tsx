import Link from "next/link";
import { DocPage, Block } from "@/components/DocPage";

export const metadata = { title: "Privacy notice · Offline" };

export default function Privacy() {
  return (
    <DocPage
      title="Privacy notice"
      intro="Written to be read, not skimmed past. This is the notice you agree to when you join, as India's Digital Personal Data Protection Act, 2023 and the DPDP Rules, 2025 require."
      updated="November 2026 (version 2026-11-v1)"
    >
      <Block title="Who we are">
        <p>Offline is a dating service from the eLitmus family. It is run separately from eLitmus's hiring products, with its own database. In DPDP terms, Offline is the "Data Fiduciary" for your dating data.</p>
      </Block>
      <Block title="What we collect, and why">
        <ul>
          <li><b>From eLitmus, only with your permission:</b> that you are a verified candidate (yes/no) and your graduation year. We store a one-way hash of your candidate ID so one person can only have one profile. We never receive test scores, percentiles, applications or anything employers see.</li>
          <li><b>Your profile:</b> name, date of birth, gender, who you'd like to meet, city and area, optional company and role, optional photo, prompts, languages, availability. Used to show you to suitable people.</li>
          <li><b>Your 8 values answers:</b> used only to calculate compatibility. They are never shown on your profile. Matches only see what you have in common.</li>
          <li><b>Messages and date plans:</b> to deliver them to your match and keep members safe. Phone numbers and links are removed before saving until a date is confirmed.</li>
          <li><b>Post-date check-ins:</b> to improve intros and spot no-shows or unsafe behaviour. Never shown to the other person.</li>
          <li><b>Work email (optional):</b> to show a "Work verified" badge. The address itself is never shown.</li>
        </ul>
      </Block>
      <Block title="What we will never do">
        <ul>
          <li>Share anything with employers, recruiters or eLitmus's hiring side, or use it in hiring.</li>
          <li>Sell your data or use it for advertising.</li>
          <li>Show your profile publicly. Only people in your daily intros and your matches see it.</li>
        </ul>
      </Block>
      <Block title="Who else sees data">
        <ul>
          <li><b>Partner venues:</b> a first name, a time and a party size for a booking. Nothing else.</li>
          <li><b>Moderators:</b> reports and the messages linked to them.</li>
          <li><b>Service providers</b> (hosting, database, email) process data only on our instructions.</li>
          <li><b>Authorities</b> only when the law requires it.</li>
        </ul>
      </Block>
      <Block title="Your rights, and how to use them">
        <ul>
          <li><b>Access:</b> download everything we hold from Settings, then "Download my data".</li>
          <li><b>Correction:</b> edit your profile or answers at any time.</li>
          <li><b>Erasure and withdrawing consent:</b> Settings, then "Delete my account". It's as easy as signing up and removes your profile, answers, matches, messages and check-ins.</li>
          <li><b>Snooze:</b> hide yourself without deleting anything.</li>
          <li><b>Grievances:</b> contact our <Link href="/grievance" className="underline">Grievance Officer</Link>. We acknowledge within 24 hours and resolve well within the 90-day maximum the DPDP Rules allow. You may also complain to the Data Protection Board of India.</li>
          <li><b>Nominee:</b> you can name a person to exercise these rights for you if you're unable to.</li>
        </ul>
      </Block>
      <Block title="How long we keep data">
        <p>While your account is active. If you're inactive for 3 years we'll warn you at least 48 hours before deleting it. Security logs are kept for one year, as the DPDP Rules require. Reports about serious harm may be kept longer where the law requires.</p>
      </Block>
      <Block title="Security">
        <p>Passwords are hashed (bcrypt). Session tokens are stored only as hashes. Photos are re-encoded in your browser, which removes hidden location data (EXIF). Data is encrypted in transit (HTTPS). In a breach we will tell affected members and the Data Protection Board without delay.</p>
      </Block>
      <Block title="Age">
        <p>Offline is only for adults (18+). We don't knowingly process children's data.</p>
      </Block>
    </DocPage>
  );
}
