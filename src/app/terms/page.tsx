import { DocPage, Block } from "@/components/DocPage";

export const metadata = { title: "Terms of use · Unswipe" };

export default function Terms() {
  return (
    <DocPage title="Terms of use" intro="The short version: be real, be kind, turn up or cancel." updated="November 2026">
      <Block title="Who can join">
        <ul>
          <li>Adults (18+) who have verified with eLitmus. One person, one profile.</li>
          <li>You must not be legally barred from using the service, and you must not have been removed from Unswipe before.</li>
        </ul>
      </Block>
      <Block title="Community rules">
        <ul>
          <li><b>Be real:</b> your own photos, your real age, honest intent.</li>
          <li><b>Be kind:</b> no harassment, hate, unwanted sexual content, or pressure of any kind.</li>
          <li><b>No money talk:</b> never ask a match for money, investments, crypto, gift cards or "help". It is the most common scam pattern and leads to removal.</li>
          <li><b>Turn up or cancel:</b> cancel in the app if plans change. Repeated no-shows mean you're shown to fewer people.</li>
          <li><b>No selling:</b> no promotion, recruiting or commercial messages.</li>
        </ul>
      </Block>
      <Block title="Safety and moderation">
        <p>We review every report, acknowledge it within 24 hours and resolve it within 15 days. Content that shows nudity or impersonates someone is removed within 24 hours of a complaint, as the IT (Intermediary Guidelines) Rules, 2021 require. We may suspend accounts that break these rules. You can appeal by contacting the Grievance Officer.</p>
      </Block>
      <Block title="Payments">
        <p>Using Unswipe is free. Socials tickets and Unswipe Plus are optional, priced up front, and processed by a licensed payment gateway. We never store card details or hold money in a wallet. Socials tickets are fully refunded if you cancel 24 hours before. Plus can be cancelled anytime and runs to the end of the paid month.</p>
      </Block>
      <Block title="Separation from hiring">
        <p>Nothing on Unswipe is shared with employers or used in eLitmus's hiring products. This is a binding commitment of these terms.</p>
      </Block>
      <Block title="Meeting people">
        <p>We verify identity, but we can't vet everyone's behaviour. Meet in public places, tell a friend (use "Share with a friend"), and arrange your own travel. Unswipe is not liable for the conduct of members on or off the service, to the extent the law allows.</p>
      </Block>
      <Block title="Law">
        <p>These terms are governed by the laws of India. Courts in Bengaluru have jurisdiction.</p>
      </Block>
    </DocPage>
  );
}
