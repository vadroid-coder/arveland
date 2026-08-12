"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireUser, startSession, verifyPassword } from "@/lib/auth";
import { asUiLanguage } from "@/lib/i18n";
import { UI_LANGUAGE_COOKIE, uiLanguageCookieOptions } from "@/lib/ui-language";

export async function updateProfile(fd: FormData) {
  const session = await requireUser();

  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "")
    .trim()
    .toLowerCase();
  const uiLanguage = asUiLanguage(String(fd.get("uiLanguage") ?? ""));

  if (!email || !email.includes("@")) redirect("/settings?error=email");

  const taken = await prisma.user.findFirst({
    where: { email, NOT: { id: session.uid } },
    select: { id: true },
  });
  if (taken) redirect("/settings?error=taken");

  const user = await prisma.user.update({
    where: { id: session.uid },
    data: { name: name || email, email, uiLanguage },
  });

  // The session carries the name and email shown in the header, so it has to be
  // reissued; the cookie is what every render reads the language from.
  await startSession(user);
  const jar = await cookies();
  jar.set(UI_LANGUAGE_COOKIE, uiLanguage, uiLanguageCookieOptions);

  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function changePassword(fd: FormData) {
  const session = await requireUser();

  const current = String(fd.get("currentPassword") ?? "");
  const next = String(fd.get("newPassword") ?? "");
  const repeat = String(fd.get("repeatPassword") ?? "");

  if (next.length < 6) redirect("/settings?error=short");
  if (next !== repeat) redirect("/settings?error=mismatch");

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) redirect("/login");

  if (!(await verifyPassword(current, user.passwordHash)))
    redirect("/settings?error=wrong");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });

  redirect("/settings?password=1");
}
