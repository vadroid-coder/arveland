import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LoginForm from "./LoginForm";
import { I18nProvider } from "@/components/I18nProvider";
import { getT, getUiLanguage } from "@/lib/ui-language";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const users = await prisma.user.count();
  if (users === 0) redirect("/setup");

  const { next } = await searchParams;
  const t = await getT();
  const language = await getUiLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo className="h-11 w-11" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-ink-900">ArveMaa</h1>
            <p className="text-sm text-ink-500">{t.auth.subtitle}</p>
          </div>
        </div>

        <div className="card p-6">
          <I18nProvider language={language}>
            <LoginForm next={next ?? "/"} />
          </I18nProvider>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} ArveMaa
        </p>
      </div>
    </main>
  );
}
