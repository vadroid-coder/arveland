/**
 * Prisma only ever reads DATABASE_URL, but the Vercel and Neon integrations
 * publish the connection string under whichever name their template uses.
 * Accepting all of them means an integration-provisioned database works
 * without hand-copying variables.
 *
 * Order matters: pooled endpoints first (right for serverless queries),
 * direct endpoints only as a last resort.
 *
 * Shared by scripts/db-provider.mjs (build) and lib/prisma.ts (runtime).
 */
export const URL_VARIABLES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
];

/** @returns {{ url: string | null, source: string | null }} */
export function resolveDatabaseUrl(env = process.env) {
  for (const name of URL_VARIABLES) {
    const value = env[name]?.trim();
    if (value) return { url: value, source: name };
  }
  return { url: null, source: null };
}
