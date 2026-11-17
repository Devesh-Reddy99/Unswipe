import Link from "next/link";
import { DocPage, Block } from "@/components/DocPage";

export const metadata = { title: "Safety centre · Offline" };

export default function Safety() {
  return (
    <DocPage title="Safety centre" intro="Safety isn't a settings page here. It is built into how matching and dates work.">
      <Block title="What Offline does for you">
        <ul>
          <li><b>Everyone is identity-verified</b> through eLitmus. One person, one profile, so banned people can't simply come back.</li>
          <li><b>Contact details stay hidden</b> until a date is confirmed. Scammers try to move you to WhatsApp fast; on Offline they can't.</li>
          <li><b>Public, partner venues</b> are suggested first for first dates.</li>
          <li><b>Share with a friend:</b> one tap sends who, where and when to someone you trust.</li>
          <li><b>Hide me from my company</b> is on by default.</li>
          <li><b>Private check-in after every date.</b> Saying you felt unsafe sends an urgent report to our team.</li>
          <li><b>Fair exposure</b> means no one is flooded with messages, which is when harassment tends to slip through.</li>
        </ul>
      </Block>
      <Block title="Tips for a first date">
        <ul>
          <li>Meet in a public place and arrange your own travel there and back.</li>
          <li>Never send money, OTPs or gift cards, or install apps a match recommends.</li>
          <li>Stay in control of your drink.</li>
          <li>It's fine to leave. A polite "I'm heading off" is enough.</li>
        </ul>
      </Block>
      <Block title="If something goes wrong">
        <ul>
          <li>In immediate danger: call <b>112</b>.</li>
          <li>Women's helpline: <b>181</b>. Cyber crime: <b>1930</b> or cybercrime.gov.in.</li>
          <li>Report a member from the chat menu (•••, then "Report and block"). They won't know it was you.</li>
          <li>Anything else: <Link href="/grievance" className="underline">contact the Grievance Officer</Link>.</li>
        </ul>
      </Block>
    </DocPage>
  );
}
