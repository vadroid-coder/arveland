// Prepares the Prisma schema for whichever database this environment points at,
// so one schema serves SQLite locally and PostgreSQL (Neon / Vercel Postgres)
// in production. Runs before `prisma generate` / `prisma db push`.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveDatabaseUrl, URL_VARIABLES } from "../lib/db-url.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const schemaPath = join(root, "prisma", "schema.prisma");

const ALLOWED = ["sqlite", "postgresql", "mysql"];
const HOSTED = Boolean(process.env.VERCEL || process.env.CI);

function fail(message, hint) {
  console.error(`\n[db-provider] ${message}\n`);
  if (hint) console.error(`${hint}\n`);
  process.exit(1);
}

const { url, source } = resolveDatabaseUrl();

// On a hosted build there is no local SQLite file to fall back to — a missing
// connection string there is a misconfiguration, not a default.
if (!url && HOSTED) {
  fail(
    "No database connection string found in the environment.",
    [
      `Checked: ${URL_VARIABLES.join(", ")}`,
      "",
      "Set these in Vercel: Project → Settings → Environment Variables,",
      "and make sure the Production checkbox is ticked on each one:",
      "",
      "  DATABASE_URL   postgresql://user:pass@host/db?sslmode=require",
      "  AUTH_SECRET    output of: openssl rand -base64 32",
      "",
      "A free Postgres takes a minute to create at https://neon.com",
      "(or Vercel → Storage). Redeploy afterwards with the build cache off.",
    ].join("\n"),
  );
}

// The Prisma CLI resolves env("DATABASE_URL") from the environment and .env
// only. If the string arrived under an integration's own name, publish it
// under the name the schema asks for.
if (url && source !== "DATABASE_URL") {
  process.env.DATABASE_URL = url;
  const envPath = join(root, ".env");
  const prefix = existsSync(envPath) ? "\n" : "";
  appendFileSync(envPath, `${prefix}DATABASE_URL="${url}"\n`);
  console.log(`[db-provider] connection string taken from ${source}`);
}

function inferProvider(connectionString) {
  if (!connectionString) return "sqlite";
  if (/^postgres(ql)?:\/\//.test(connectionString)) return "postgresql";
  if (/^mysql:\/\//.test(connectionString)) return "mysql";
  if (/^file:/.test(connectionString)) return "sqlite";
  fail(
    `Cannot tell which database the connection string points at: "${connectionString.slice(0, 24)}…"`,
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

if (!process.env.AUTH_SECRET && HOSTED) {
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
const useDirectUrl =
  wanted === "postgresql" && !!process.env.DATABASE_URL_UNPOOLED;

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
