import { DocPage, Block } from "@/components/DocPage";

export const metadata = { title: "Why we built it this way · Offline" };

export default function Why() {
  return (
    <DocPage
      title="Why we built it this way"
      intro="Every feature in Offline answers a specific problem. Here are the decisions, the reasons, and what we chose not to build."
    >
      <Block title="The bet">
        <p>
          Dating apps make money when you keep swiping, so the product never has a reason to get you off it. Offline makes money when a
          date actually happens, from the café that hosts it. That lines our incentive up with yours. Our north-star metric is
          <b> good first dates per week</b>: you both turned up, and at least one of you wants to meet again.
        </p>
      </Block>
      <Block title="Why eLitmus can win this">
        <ul>
          <li><b>Trust out of the box:</b> more than a million 2020–2023 graduates were identity-checked at a proctored test. Fake profiles, the top complaint on Indian apps, are gone from day one.</li>
          <li><b>A clear audience:</b> early-career, often new to Bengaluru, Hyderabad or Pune for work, with a small social circle.</li>
          <li><b>Free distribution</b> through eLitmus email and dashboards, instead of paying app-store install costs.</li>
          <li><b>What we deliberately don't use:</b> test scores. Data collected for hiring can't be reused for dating under the DPDP Act, and it would be creepy anyway.</li>
        </ul>
      </Block>
      <Block title="Decisions and the reasons behind them">
        <ul>
          <li><b>5 intros a day instead of swiping.</b> Swiping turns people into a deck of cards. Five considered intros, each with reasons, make each person feel chosen.</li>
          <li><b>Fair exposure.</b> Indian apps have about 3 men per woman. Unlimited likes flood women and leave most men unseen. Each profile appears in at most 6 people's intros a day, and people with many pending likes are shown less.</li>
          <li><b>72 hours to agree a date.</b> Two in three users have never met a match in person. A gentle deadline turns chats into plans. One 48-hour extension if both want it.</li>
          <li><b>A built-in date planner.</b> "So… where?" is where momentum dies. Partner venues near both people and a few suggested times make yes a single tap. It's also how we make money.</li>
          <li><b>Contact details hidden until a date is confirmed.</b> Most romance scams start by moving the chat off-platform.</li>
          <li><b>Private post-date check-in.</b> It's the only honest signal of quality. No-shows lower visibility; feeling unsafe triggers an urgent review.</li>
          <li><b>Hide me from my company, on by default.</b> Fear of colleagues seeing you is real for young professionals.</li>
          <li><b>Socials with equal seats.</b> They solve the cold start in a new city and suit people who'd rather meet in a group first.</li>
        </ul>
      </Block>
      <Block title="How Offline makes money (users mostly pay nothing)">
        <ul>
          <li><b>Venues pay per confirmed date</b> (₹50–150). They get weekday footfall from a salaried audience; our members get a perk.</li>
          <li><b>Socials tickets</b> (₹299–449). People already pay for events.</li>
          <li><b>Offline Plus</b> (₹199/month): convenience only (travel mode, longer windows, full compatibility breakdown). It never buys visibility.</li>
          <li><b>Later:</b> an experiences marketplace (pottery for two, treks) on commission.</li>
        </ul>
      </Block>
      <Block title="What we chose not to build">
        <ul>
          <li><b>Paid boosts and "see who liked you" paywalls.</b> Pay-to-win breaks fairness, and fairness is the product.</li>
          <li><b>AI-written chat replies.</b> They make conversations less real, and scammers already use them.</li>
          <li><b>Public profile browsing.</b> 74% of users want to control who sees them.</li>
          <li><b>A native app on day one.</b> An installable web app (PWA) ships faster while we prove the loop works.</li>
        </ul>
      </Block>
      <Block title="Sources">
        <ul>
          <li>Juleo × YouGov, Indian matchmaking report 2024 (in-person meetings, fake profiles, profile control).</li>
          <li>Woo survey of 20,000 urban Indians, reported by Quartz (gender ratio).</li>
          <li>McAfee India, February 2026 (fake dating apps and scams by age group).</li>
          <li>DPDP Act 2023 and DPDP Rules 2025; IT (Intermediary Guidelines) Rules 2021.</li>
        </ul>
      </Block>
    </DocPage>
  );
}
