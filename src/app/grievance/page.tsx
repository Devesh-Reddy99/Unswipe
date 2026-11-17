import { DocPage, Block } from "@/components/DocPage";
import { GrievanceForm } from "@/components/GrievanceForm";

export const metadata = { title: "Grievance officer · Offline" };

export default function Grievance() {
  return (
    <DocPage
      title="Grievance Officer"
      intro="For complaints about content, accounts, privacy or how we handled a report. We acknowledge within 24 hours and resolve within 15 days."
    >
      <Block title="Contact">
        <p>
          Grievance Officer, Offline
          <br />
          Email: grievance@offline.example
          <br />
          Address: Bengaluru, Karnataka, India
        </p>
        <p className="text-sm text-dusk">Demo note: at launch this names an India-resident officer, as the IT Rules 2021 require.</p>
      </Block>
      <Block title="Raise a grievance">
        <GrievanceForm />
      </Block>
      <Block title="If you're not satisfied">
        <p>For data-protection complaints you can approach the Data Protection Board of India. For content decisions you can appeal to the Grievance Appellate Committee under the IT Rules.</p>
      </Block>
    </DocPage>
  );
}
