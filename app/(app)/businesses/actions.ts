"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { BUSINESS_COOKIE } from "@/lib/business";
import { ownedBusiness, ownedTaxRate } from "@/lib/guard";

function str(fd: FormData, key: string) {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function readBusiness(fd: FormData) {
  return {
    name: String(fd.get("name") ?? "").trim(),
    regNumber: str(fd, "regNumber"),
    vatNumber: str(fd, "vatNumber"),
    address: str(fd, "address"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    website: str(fd, "website"),
    logo: str(fd, "logo"),
    invoicePrefix:
      (str(fd, "invoicePrefix") ?? "INV").toUpperCase().replace(/\s+/g, ""),
    paymentTermDays: Math.max(0, Number(fd.get("paymentTermDays") ?? 7) || 0),
    currency: (str(fd, "currency") ?? "EUR").toUpperCase(),
    defaultLanguage: fd.get("defaultLanguage") === "EN" ? "EN" : "ET",
    bankName: str(fd, "bankName"),
    bankAccount: str(fd, "bankAccount"),
    bankSwift: str(fd, "bankSwift"),
    footerNote: str(fd, "footerNote"),
  };
}

export async function createBusiness(fd: FormData) {
  const user = await requireUser();
  const data = readBusiness(fd);
  if (!data.name) redirect("/businesses/new?error=name");

  const business = await prisma.business.create({
    data: { ...data, ownerId: user.uid },
  });

  // Make the freshly created business the active one.
  const jar = await cookies();
  jar.set(BUSINESS_COOKIE, business.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  redirect("/businesses");
}

export async function updateBusiness(id: string, fd: FormData) {
  if (!(await ownedBusiness(id))) redirect("/businesses");

  const data = readBusiness(fd);
  if (!data.name) redirect(`/businesses/${id}?error=name`);

  await prisma.business.update({ where: { id }, data });
  revalidatePath("/", "layout");
  redirect("/businesses");
}

export async function archiveBusiness(id: string) {
  if (!(await ownedBusiness(id))) redirect("/businesses");

  await prisma.business.update({ where: { id }, data: { archived: true } });

  const jar = await cookies();
  if (jar.get(BUSINESS_COOKIE)?.value === id) jar.delete(BUSINESS_COOKIE);

  revalidatePath("/", "layout");
  redirect("/businesses");
}

export async function addTaxRate(businessId: string, fd: FormData) {
  if (!(await ownedBusiness(businessId))) redirect("/businesses");

  const rate = Number(String(fd.get("rate") ?? "").replace(",", "."));
  if (!Number.isFinite(rate) || rate < 0) return;

  await prisma.taxRate.upsert({
    where: { businessId_rate: { businessId, rate } },
    update: { label: str(fd, "label") },
    create: { businessId, rate, label: str(fd, "label") },
  });
  revalidatePath(`/businesses/${businessId}`);
}

export async function deleteTaxRate(id: string, businessId: string) {
  if (!(await ownedTaxRate(id))) redirect("/businesses");

  await prisma.taxRate.delete({ where: { id } });
  revalidatePath(`/businesses/${businessId}`);
}
