import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { ValuesForm } from "@/components/ValuesForm";

export default async function EditValues() {
  const user = await requireUser();
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id));
  return (
    <main className="px-5">
      <Link href="/app/me" className="text-dusk">‹ Back</Link>
      <h1 className="mt-2 mb-6 text-3xl font-extrabold">Your answers</h1>
      <ValuesForm initial={p.answers} submitLabel="Save answers" />
    </main>
  );
}
