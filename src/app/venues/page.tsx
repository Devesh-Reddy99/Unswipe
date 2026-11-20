import { DocPage, Block } from "@/components/DocPage";

export const metadata = { title: "For cafés and venues · Unswipe" };

export default function Venues() {
  return (
    <DocPage
      title="Fill your quiet hours with first dates"
      intro="Unswipe members are verified young professionals who arrive with a confirmed booking, often on weekday evenings when tables sit empty."
    >
      <Block title="How it works">
        <ul>
          <li>You appear in the date planner for members who live or work nearby.</li>
          <li>You offer a perk to Unswipe dates (for example 15% off or a free dessert).</li>
          <li>You pay a flat fee only for confirmed dates booked at your venue, typically ₹50–150. No listing fee, no lock-in.</li>
          <li>You see first names, a time and party size. Nothing else about our members.</li>
        </ul>
      </Block>
      <Block title="Why it's worth it">
        <ul>
          <li>Two people who will probably come back, because a good first date becomes "our place".</li>
          <li>Weekday footfall from an audience that's hard to reach with ads.</li>
          <li>You can host Socials too. We bring 12–20 guests; you cover the space in exchange for food and drink spending.</li>
        </ul>
      </Block>
      <Block title="Become a partner">
        <p>Write to partners@unswipe.example with your venue name, area and the perk you'd like to offer. We're signing venues in Bengaluru, Hyderabad and Pune.</p>
      </Block>
    </DocPage>
  );
}
