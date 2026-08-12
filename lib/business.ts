import "server-only";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const BUSINESS_COOKIE = "arvemaa_business";

export async function listBusinesses() {
  return prisma.business.findMany({
    where: { archived: false },
    orderBy: { createdAt: "asc" },
  });
}

/** Active business = the one in the cookie, else the first one. */
export async function getActiveBusiness() {
  const businesses = await listBusinesses();
  if (businesses.length === 0) return { businesses, active: null };

  const jar = await cookies();
  const wanted = jar.get(BUSINESS_COOKIE)?.value;
  const active = businesses.find((b) => b.id === wanted) ?? businesses[0];
  return { businesses, active };
}
