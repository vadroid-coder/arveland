import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getT, getUiLanguage } from "@/lib/ui-language";
import { UI_LANGUAGES } from "@/lib/i18n";
import SubmitButton from "@/components/SubmitButton";
import { changePassword, updateProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; password?: string }>;
}) {
  const session = await requireUser();
  const t = await getT();
  const language = await getUiLanguage();
  const { error, saved, password } = await searchParams;

  const user = await prisma.user.findUnique({ where: { id: session.uid } });
  if (!user) notFound();

  const errors: Record<string, string> = {
    email: t.settings.errEmailInvalid,
    taken: t.settings.errEmailTaken,
    wrong: t.settings.errWrongPassword,
    short: t.settings.errPasswordShort,
    mismatch: t.settings.errPasswordMismatch,
  };
  const errorText = error ? errors[error] : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {t.settings.title}
        </h1>
        <p className="text-sm text-ink-500">{t.settings.subtitle}</p>
      </div>

      {errorText && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorText}
        </p>
      )}
      {(saved || password) && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {password ? t.settings.passwordChanged : t.settings.saved}
        </p>
      )}

      <form action={updateProfile} className="card space-y-5 p-5">
        <h2 className="text-sm font-semibold text-ink-700">
          {t.settings.accountSection}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t.common.name}</label>
            <input name="name" className="field" defaultValue={user.name ?? ""} />
          </div>
          <div>
            <label className="label">{t.common.email}</label>
            <input
              name="email"
              type="email"
              className="field"
              defaultValue={user.email}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t.settings.uiLanguage}</label>
            <select
              name="uiLanguage"
              className="field"
              defaultValue={language}
            >
              {UI_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-400">
              {t.settings.uiLanguageHint}
            </p>
          </div>
        </div>

        <dl className="grid gap-2 border-t border-ink-100 pt-4 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="text-ink-400">{t.settings.roleLabel}:</dt>
            <dd className="text-ink-700">
              {user.role === "ADMIN" ? t.nav.admin : t.nav.user}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-ink-400">{t.settings.memberSince}:</dt>
            <dd className="text-ink-700">
              {user.createdAt.toLocaleDateString(t.locale)}
            </dd>
          </div>
        </dl>

        <SubmitButton className="btn btn-primary" pendingLabel={t.common.saving}>
          {t.common.save}
        </SubmitButton>
      </form>

      <form action={changePassword} className="card space-y-5 p-5">
        <h2 className="text-sm font-semibold text-ink-700">
          {t.settings.passwordSection}
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t.settings.currentPassword}</label>
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className="field"
              required
            />
          </div>
          <div>
            <label className="label">{t.settings.newPassword}</label>
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className="field"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">{t.settings.repeatPassword}</label>
            <input
              name="repeatPassword"
              type="password"
              autoComplete="new-password"
              className="field"
              minLength={6}
              required
            />
          </div>
        </div>

        <SubmitButton className="btn btn-primary" pendingLabel={t.common.saving}>
          {t.settings.changePassword}
        </SubmitButton>
      </form>
    </div>
  );
}
