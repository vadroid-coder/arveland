"use server";

import { redirect } from "next/navigation";
import { authenticate, startSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!email || !password) return { error: "Введите e-mail и пароль" };

  const user = await authenticate(email, password);
  if (!user) return { error: "Неверный e-mail или пароль" };

  await startSession(user);
  redirect(next.startsWith("/") ? next : "/");
}
