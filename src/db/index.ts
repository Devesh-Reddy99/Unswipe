import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/*
 * One small connection pool per server instance.
 * `prepare: false` keeps it compatible with Neon's pooled (PgBouncer) connection string.
 */
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgres://postgres@localhost:5432/unswipe";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
const client = globalForDb.pg ?? postgres(url, { prepare: false, max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
