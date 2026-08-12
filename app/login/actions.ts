"use server";

import { redirect } from "next/navigation";
import { authenticate, startSession } from "@/lib/auth";
import { getT } from "@/lib/ui-language";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const t = await getT();
  if (!email || !password) return { error: t.auth.missingCredentials };

  const user = await authenticate(email, password);
  if (!user) return { error: t.auth.badCredentials };

  await startSession(user);
  redirect(next.startsWith("/") ? next : "/");
}
