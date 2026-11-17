import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

/** Keep people on the onboarding step they're actually at. */
export async function guardStep(step: "verify" | "consent" | "profile" | "values") {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboardingStep === "done") redirect("/app/today");
  if (user.onboardingStep !== step) redirect(`/onboarding/${user.onboardingStep}`);
  return user;
}
