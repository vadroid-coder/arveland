"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";

export async function createUser(fd: FormData) {
  await requireAdmin();

  const email = String(fd.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(fd.get("name") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const role = fd.get("role") === "ADMIN" ? "ADMIN" : "USER";

  if (!email || password.length < 6) redirect("/admin?error=invalid");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) redirect("/admin?error=duplicate");

  await prisma.user.create({
    data: {
      email,
      name: name || email,
      role,
      passwordHash: await hashPassword(password),
    },
  });

  revalidatePath("/admin");
  redirect("/admin?created=1");
}

export async function updateUser(id: string, fd: FormData) {
  const admin = await requireAdmin();

  const name = String(fd.get("name") ?? "").trim();
  const role = fd.get("role") === "ADMIN" ? "ADMIN" : "USER";
  const active = fd.get("active") === "on";
  const password = String(fd.get("password") ?? "");

  // An admin must not lock themselves out.
  const isSelf = admin.uid === id;
  const adminCount = await prisma.user.count({
    where: { role: "ADMIN", active: true },
  });
  const wouldRemoveLastAdmin =
    adminCount <= 1 && (role !== "ADMIN" || !active);

  await prisma.user.update({
    where: { id },
    data: {
      name: name || undefined,
      role: isSelf && wouldRemoveLastAdmin ? "ADMIN" : role,
      active: isSelf && wouldRemoveLastAdmin ? true : active,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    },
  });

  revalidatePath("/admin");
  redirect("/admin?saved=1");
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();
  if (admin.uid === id) redirect("/admin?error=self");

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin");
  redirect("/admin");
}
