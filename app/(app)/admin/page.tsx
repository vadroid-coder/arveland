import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import SubmitButton from "@/components/SubmitButton";
import { createUser, deleteUser, updateUser } from "./actions";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, { text: string; tone: string }> = {
  invalid: {
    text: "E-mail обязателен, пароль — минимум 6 символов.",
    tone: "bg-red-50 text-red-700",
  },
  duplicate: {
    text: "Пользователь с таким e-mail уже существует.",
    tone: "bg-red-50 text-red-700",
  },
  self: {
    text: "Себя удалить нельзя.",
    tone: "bg-red-50 text-red-700",
  },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; saved?: string }>;
}) {
  const admin = await requireAdmin();
  const { error, created, saved } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { businesses: true } } },
  });
  const notice = error ? NOTICES[error] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Пользователи
        </h1>
        <p className="text-sm text-ink-500">
          Каждый аккаунт полностью отдельный: свои компании, клиенты и счета.
          Администратор тоже видит только свои данные — права администратора
          касаются только управления пользователями.
        </p>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.tone}`}>
          {notice.text}
        </p>
      )}
      {(created || saved) && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {created ? "Пользователь создан." : "Изменения сохранены."}
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
                      Создан {u.createdAt.toLocaleDateString("ru-RU")} ·{" "}
                      компаний: {u._count.businesses}
                      {u.id === admin.uid ? " · это вы" : ""}
                    </p>
                  </div>
                  {!u.active && (
                    <span className="badge bg-ink-100 text-ink-500">
                      Деактивирован
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label">Имя</label>
                    <input
                      name="name"
                      className="field"
                      defaultValue={u.name ?? ""}
                    />
                  </div>
                  <div>
                    <label className="label">Роль</label>
                    <select name="role" className="field" defaultValue={u.role}>
                      <option value="USER">Пользователь</option>
                      <option value="ADMIN">Администратор</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Новый пароль</label>
                    <input
                      name="password"
                      type="password"
                      className="field"
                      placeholder="Оставьте пустым"
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
                    Активен
                  </label>
                  <SubmitButton className="btn btn-primary ml-auto">
                    Сохранить
                  </SubmitButton>
                  {u.id !== admin.uid && (
                    <SubmitButton
                      className="btn btn-danger"
                      formAction={remove}
                      confirm={`Удалить пользователя ${u.email}? Вместе с ним будут удалены его компании (${u._count.businesses}), клиенты и счета. Это необратимо.`}
                    >
                      Удалить
                    </SubmitButton>
                  )}
                </div>
              </form>
            );
          })}
        </div>

        <form action={createUser} className="card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold text-ink-700">Новый пользователь</h2>
          <div>
            <label className="label">Имя</label>
            <input name="name" className="field" />
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input name="email" type="email" className="field" required />
          </div>
          <div>
            <label className="label">Пароль * (минимум 6)</label>
            <input
              name="password"
              type="password"
              className="field"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">Роль</label>
            <select name="role" className="field" defaultValue="USER">
              <option value="USER">Пользователь</option>
              <option value="ADMIN">Администратор</option>
            </select>
          </div>
          <SubmitButton className="btn btn-primary w-full">
            Создать пользователя
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
