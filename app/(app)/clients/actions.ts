"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

function str(fd: FormData, key: string) {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

function read(fd: FormData) {
  return {
    name: String(fd.get("name") ?? "").trim(),
    regNumber: String(fd.get("regNumber") ?? "").trim(),
    vatNumber: str(fd, "vatNumber"),
    address: str(fd, "address"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
  };
}

export async function createClient(businessId: string, fd: FormData) {
  await requireUser();
  const data = read(fd);
  if (!data.name || !data.regNumber) redirect("/clients?error=required");

  const existing = await prisma.client.findUnique({
    where: { businessId_regNumber: { businessId, regNumber: data.regNumber } },
  });
  if (existing) redirect(`/clients/${existing.id}?error=duplicate`);

  await prisma.client.create({ data: { ...data, businessId } });
  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(id: string, fd: FormData) {
  await requireUser();
  const data = read(fd);
  if (!data.name || !data.regNumber) redirect(`/clients/${id}?error=required`);

  await prisma.client.update({ where: { id }, data });
  revalidatePath("/clients");
  redirect("/clients");
}

export async function deleteClient(id: string) {
  await requireUser();
  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
  redirect("/clients");
}
