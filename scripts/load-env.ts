// Load .env / .env.local the same way `next dev` does, so `npm run db:migrate`
// and `npm run db:seed` work locally after `cp .env.example .env`.
// On Vercel the variables are already set, and existing values are never overwritten.
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());
