import { resetDemoData } from "@/lib/seed";

export const maxDuration = 60;

/** Nightly reset of the shared demo world (Vercel Cron sends the CRON_SECRET as a bearer token). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const result = await resetDemoData();
  return Response.json({ ok: true, ...result });
}
