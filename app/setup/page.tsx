import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, startSession } from "@/lib/auth";
import Logo from "@/components/Logo";
import SubmitButton from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

async function createFirstAdmin(formData: FormData) {
  "use server";

  // Guard: this route only works while the instance has no users at all.
  if ((await prisma.user.count()) > 0) redirect("/login");

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 6) redirect("/setup?error=1");

  const user = await prisma.user.create({
    data: {
      email,
      name: name || "Administrator",
      role: "ADMIN",
      passwordHash: await hashPassword(password),
    },
  });

  await startSession(user);
  redirect("/");
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if ((await prisma.user.count()) > 0) redirect("/login");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo className="h-11 w-11" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-ink-900">
              Первичная настройка
            </h1>
            <p className="text-sm text-ink-500">Создайте аккаунт администратора</p>
          </div>
        </div>

        <form action={createFirstAdmin} className="card space-y-4 p-6">
          <div>
            <label className="label">Имя</label>
            <input name="name" className="field" placeholder="Administrator" />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              name="email"
              type="email"
              className="field"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Пароль (минимум 6 символов)</label>
            <input
              name="password"
              type="password"
              className="field"
              minLength={6}
              required
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Проверьте данные и попробуйте ещё раз.
            </p>
          ) : null}
          <SubmitButton className="btn btn-primary w-full py-2.5">
            Создать аккаунт
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
