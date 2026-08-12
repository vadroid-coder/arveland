import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { requireUser } from "./auth";

export const BUSINESS_COOKIE = "arvemaa_business";

/** Businesses belonging to the signed-in account. */
export async function listBusinesses(ownerId: string) {
  return prisma.business.findMany({
    where: { ownerId, archived: false },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Active business = the one in the cookie, else the first one owned by this
 * account. A cookie pointing at somebody else's business simply does not match.
 */
export async function getActiveBusiness() {
  const user = await requireUser();
  const businesses = await listBusinesses(user.uid);
  if (businesses.length === 0) return { businesses, active: null, user };

  const jar = await cookies();
  const wanted = jar.get(BUSINESS_COOKIE)?.value;
  const active = businesses.find((b) => b.id === wanted) ?? businesses[0];
  return { businesses, active, user };
}
