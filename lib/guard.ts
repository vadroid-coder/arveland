import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import { requireUser } from "./auth";

/**
 * Ownership checks. Every record reachable from the UI hangs off a Business,
 * so each of these resolves back to `business.ownerId` and compares it with the
 * session. Nothing here trusts an id coming from the URL or a form.
 *
 * `*OrNotFound` variants are for pages — another account's id is indistinguishable
 * from a nonexistent one. The plain variants return null and are for server
 * actions, which report the failure instead of rendering a 404.
 */

export async function ownedBusiness(id: string) {
  const user = await requireUser();
  return prisma.business.findFirst({ where: { id, ownerId: user.uid } });
}

export async function ownedBusinessOrNotFound(id: string) {
  const business = await ownedBusiness(id);
  if (!business) notFound();
  return business;
}

export async function ownedClient(id: string) {
  const user = await requireUser();
  return prisma.client.findFirst({
    where: { id, business: { ownerId: user.uid } },
  });
}

export async function ownedClientOrNotFound(id: string) {
  const user = await requireUser();
  const client = await prisma.client.findFirst({
    where: { id, business: { ownerId: user.uid } },
    include: { invoices: { orderBy: { issueDate: "desc" }, take: 10 } },
  });
  if (!client) notFound();
  return client;
}

export async function ownedInvoice(id: string) {
  const user = await requireUser();
  return prisma.invoice.findFirst({
    where: { id, business: { ownerId: user.uid } },
  });
}

export async function ownedInvoiceOrNotFound(id: string) {
  const user = await requireUser();
  const invoice = await prisma.invoice.findFirst({
    where: { id, business: { ownerId: user.uid } },
    include: { items: { orderBy: { sortNo: "asc" } }, business: true },
  });
  if (!invoice) notFound();
  return invoice;
}

export async function ownedTaxRate(id: string) {
  const user = await requireUser();
  return prisma.taxRate.findFirst({
    where: { id, business: { ownerId: user.uid } },
  });
}
