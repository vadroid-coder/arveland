// Rewrites the Prisma datasource provider so the same schema works with
// SQLite locally and PostgreSQL (Neon / Vercel Postgres) in production.
//
// The provider is inferred from DATABASE_URL, so deploying only needs
// DATABASE_URL to be set. DATABASE_PROVIDER overrides the inference if you
// ever need it.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(here, "..", "prisma", "schema.prisma");

const ALLOWED = ["sqlite", "postgresql", "mysql"];
const url = process.env.DATABASE_URL;

function fail(message, hint) {
  console.error(`\n[db-provider] ${message}\n`);
  if (hint) console.error(`${hint}\n`);
  process.exit(1);
}

// On a hosted build there is no local SQLite file to fall back to — a missing
// DATABASE_URL there is a misconfiguration, not a default.
if (!url && (process.env.VERCEL || process.env.CI)) {
  fail(
    "DATABASE_URL is not set, so the build cannot reach a database.",
    [
      "Set it in Vercel: Project → Settings → Environment Variables",
      "",
      "  DATABASE_URL   postgresql://user:pass@host/db?sslmode=require",
      "  AUTH_SECRET    output of: openssl rand -base64 32",
      "",
      "A free Postgres takes a minute to create at https://neon.com",
      "(or Vercel → Storage). Redeploy after adding the variables.",
    ].join("\n"),
  );
}

function inferProvider(connectionString) {
  if (!connectionString) return "sqlite";
  if (/^postgres(ql)?:\/\//.test(connectionString)) return "postgresql";
  if (/^mysql:\/\//.test(connectionString)) return "mysql";
  if (/^file:/.test(connectionString)) return "sqlite";
  fail(
    `Cannot tell which database DATABASE_URL points at: "${connectionString.slice(0, 24)}…"`,
    'Set DATABASE_PROVIDER explicitly to "postgresql", "mysql" or "sqlite".',
  );
}

const wanted = process.env.DATABASE_PROVIDER || inferProvider(url);

if (!ALLOWED.includes(wanted)) {
  fail(
    `Unsupported DATABASE_PROVIDER="${wanted}".`,
    `Supported values: ${ALLOWED.join(", ")}.`,
  );
}

if (!process.env.AUTH_SECRET && (process.env.VERCEL || process.env.CI)) {
  console.warn(
    "[db-provider] warning: AUTH_SECRET is not set — sign-in will fail at runtime.\n" +
      "              Generate one with: openssl rand -base64 32",
  );
}

const schema = readFileSync(schemaPath, "utf8");

let next = schema.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*")[^"]+(")/s,
  `$1${wanted}$2`,
);

// Pooled connections (Neon's pgbouncer endpoint) are right for queries but not
// for the DDL `prisma db push` issues. When the provider gives us a direct
// endpoint as well, point schema changes at it and leave queries on the pool.
const useDirectUrl = wanted === "postgresql" && !!process.env.DATABASE_URL_UNPOOLED;

next = next.replace(/^\s*directUrl\s*=.*\n/m, "");
if (useDirectUrl) {
  next = next.replace(
    /(datasource\s+db\s*\{[^}]*?url\s*=\s*env\("DATABASE_URL"\)\n)/s,
    `$1  directUrl = env("DATABASE_URL_UNPOOLED")\n`,
  );
}

if (next !== schema) {
  writeFileSync(schemaPath, next);
  console.log(
    `[db-provider] datasource provider -> ${wanted}` +
      (useDirectUrl ? " (schema changes via DATABASE_URL_UNPOOLED)" : ""),
  );
} else {
  console.log(`[db-provider] datasource provider already ${wanted}`);
}
