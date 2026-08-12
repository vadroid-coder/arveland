import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getT } from "@/lib/ui-language";
import SubmitButton from "@/components/SubmitButton";
import { createUser, deleteUser, updateUser } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; saved?: string }>;
}) {
  const admin = await requireAdmin();
  const t = await getT();
  const { error, created, saved } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { businesses: true } } },
  });
  const notices: Record<string, string> = {
    invalid: t.admin.errInvalid,
    duplicate: t.admin.errDuplicate,
    self: t.admin.errSelf,
  };
  const notice = error ? notices[error] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {t.admin.title}
        </h1>
        <p className="text-sm text-ink-500">
          {t.admin.subtitle}
        </p>
      </div>

      {notice && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {notice}
        </p>
      )}
      {(created || saved) && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {created ? t.admin.userCreated : t.admin.changesSaved}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {users.map((u) => {
            const update = updateUser.bind(null, u.id);
            const remove = deleteUser.bind(null, u.id);
            return (
              <form key={u.id} action={update} className="card p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink-900">{u.email}</p>
                    <p className="text-xs text-ink-400">
                      {t.admin.created(u.createdAt.toLocaleDateString(t.locale))}{" "}
                      · {t.admin.businessCount(u._count.businesses)}
                      {u.id === admin.uid ? ` · ${t.admin.itsYou}` : ""}
                    </p>
                  </div>
                  {!u.active && (
                    <span className="badge bg-ink-100 text-ink-500">
                      {t.admin.deactivated}
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label">{t.common.name}</label>
                    <input
                      name="name"
                      className="field"
                      defaultValue={u.name ?? ""}
                    />
                  </div>
                  <div>
                    <label className="label">{t.common.role}</label>
                    <select name="role" className="field" defaultValue={u.role}>
                      <option value="USER">{t.nav.user}</option>
                      <option value="ADMIN">{t.nav.admin}</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{t.admin.newPassword}</label>
                    <input
                      name="password"
                      type="password"
                      className="field"
                      placeholder={t.admin.leaveEmpty}
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink-600">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={u.active}
                      className="h-4 w-4 rounded border-ink-300"
                    />
                    {t.admin.activeLabel}
                  </label>
                  <SubmitButton className="btn btn-primary ml-auto">
                    {t.common.save}
                  </SubmitButton>
                  {u.id !== admin.uid && (
                    <SubmitButton
                      className="btn btn-danger"
                      formAction={remove}
                      confirm={t.admin.confirmDelete(u.email, u._count.businesses)}
                    >
                      {t.common.delete}
                    </SubmitButton>
                  )}
                </div>
              </form>
            );
          })}
        </div>

        <form action={createUser} className="card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold text-ink-700">{t.admin.newUser}</h2>
          <div>
            <label className="label">{t.common.name}</label>
            <input name="name" className="field" />
          </div>
          <div>
            <label className="label">{t.common.email} *</label>
            <input name="email" type="email" className="field" required />
          </div>
          <div>
            <label className="label">{t.admin.passwordMin}</label>
            <input
              name="password"
              type="password"
              className="field"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">{t.common.role}</label>
            <select name="role" className="field" defaultValue="USER">
              <option value="USER">{t.nav.user}</option>
              <option value="ADMIN">{t.nav.admin}</option>
            </select>
          </div>
          <SubmitButton className="btn btn-primary w-full">
            {t.admin.createUser}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
