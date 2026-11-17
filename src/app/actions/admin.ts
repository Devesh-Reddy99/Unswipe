"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { resetDemoData } from "@/lib/seed";

export async function resolveReport(reportId: string, decision: "dismiss" | "suspend") {
  await requireAdmin();
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId));
  if (!r) return;
  if (decision === "suspend") {
    // Suspended members disappear from intros immediately; matches stay closed.
    await db.update(schema.users).set({ status: "suspended" }).where(eq(schema.users.id, r.reportedId));
  }
  await db
    .update(schema.reports)
    .set({
      status: decision === "suspend" ? "actioned" : "dismissed",
      resolution: decision === "suspend" ? "Account suspended" : "No action needed",
      resolvedAt: new Date(),
    })
    .where(eq(schema.reports.id, reportId));
  revalidatePath("/admin");
}

export async function resolveGrievance(id: string) {
  await requireAdmin();
  await db.update(schema.grievances).set({ status: "resolved" }).where(eq(schema.grievances.id, id));
  revalidatePath("/admin");
}

export async function resetDemo() {
  await requireAdmin();
  await resetDemoData();
  revalidatePath("/admin");
}
