/*
 * Runs on every deploy (see "build" in package.json):
 *  1. applies any new SQL migrations in /drizzle
 *  2. seeds demo data, but only if the database is empty
 */
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    console.log("No DATABASE_URL set: skipping migrations.");
    return;
  }
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
  await client.end();

  const { seedIfEmpty } = await import("../src/lib/seed");
  const seeded = await seedIfEmpty();
  console.log(seeded ? "Seeded demo data." : "Database already has data: seed skipped.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
