// Rewrites the Prisma datasource provider so the same schema works with
// SQLite locally and PostgreSQL (Neon / Vercel Postgres) in production.
//
//   local:  no env var        -> sqlite
//   vercel: DATABASE_PROVIDER=postgresql
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, "..", "prisma", "schema.prisma");

const allowed = ["sqlite", "postgresql", "mysql"];
const wanted = process.env.DATABASE_PROVIDER || "sqlite";

if (!allowed.includes(wanted)) {
  console.error(`[db-provider] unsupported DATABASE_PROVIDER="${wanted}"`);
  process.exit(1);
}

const schema = readFileSync(schemaPath, "utf8");
const next = schema.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*")[^"]+(")/s,
  `$1${wanted}$2`,
);

if (next !== schema) {
  writeFileSync(schemaPath, next);
  console.log(`[db-provider] datasource provider -> ${wanted}`);
} else {
  console.log(`[db-provider] datasource provider already ${wanted}`);
}
