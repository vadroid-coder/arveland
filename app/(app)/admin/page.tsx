import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import SubmitButton from "@/components/SubmitButton";
import { createUser, deleteUser, updateUser } from "./actions";

export const dynamic = "force-dynamic";

const NOTICES: Record<string, { text: string; tone: string }> = {
  invalid: {
    text: "E-post on kohustuslik ja parool peab olema vähemalt 6 tähemärki.",
    tone: "bg-red-50 text-red-700",
  },
  duplicate: {
    text: "Selle e-postiga kasutaja on juba olemas.",
    tone: "bg-red-50 text-red-700",
  },
  self: {
    text: "Iseennast ei saa kustutada.",
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

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const notice = error ? NOTICES[error] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Kasutajad
        </h1>
        <p className="text-sm text-ink-500">
          Halda ligipääsu ArveMaa administreerimispaneelile.
        </p>
      </div>

      {notice && (
        <p className={`rounded-lg px-3 py-2 text-sm ${notice.tone}`}>
          {notice.text}
        </p>
      )}
      {(created || saved) && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {created ? "Kasutaja loodud." : "Muudatused salvestatud."}
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
                      Loodud {u.createdAt.toLocaleDateString("et-EE")}
                      {u.id === admin.uid ? " · see oled sina" : ""}
                    </p>
                  </div>
                  {!u.active && (
                    <span className="badge bg-ink-100 text-ink-500">
                      Deaktiveeritud
                    </span>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label">Nimi</label>
                    <input
                      name="name"
                      className="field"
                      defaultValue={u.name ?? ""}
                    />
                  </div>
                  <div>
                    <label className="label">Roll</label>
                    <select name="role" className="field" defaultValue={u.role}>
                      <option value="USER">Kasutaja</option>
                      <option value="ADMIN">Administraator</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Uus parool</label>
                    <input
                      name="password"
                      type="password"
                      className="field"
                      placeholder="Jäta tühjaks"
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
                    Aktiivne
                  </label>
                  <SubmitButton className="btn btn-primary ml-auto">
                    Salvesta
                  </SubmitButton>
                  {u.id !== admin.uid && (
                    <SubmitButton
                      className="btn btn-danger"
                      formAction={remove}
                      confirm={`Kustutada kasutaja ${u.email}?`}
                    >
                      Kustuta
                    </SubmitButton>
                  )}
                </div>
              </form>
            );
          })}
        </div>

        <form action={createUser} className="card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold text-ink-700">Uus kasutaja</h2>
          <div>
            <label className="label">Nimi</label>
            <input name="name" className="field" />
          </div>
          <div>
            <label className="label">E-post *</label>
            <input name="email" type="email" className="field" required />
          </div>
          <div>
            <label className="label">Parool * (min 6)</label>
            <input
              name="password"
              type="password"
              className="field"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">Roll</label>
            <select name="role" className="field" defaultValue="USER">
              <option value="USER">Kasutaja</option>
              <option value="ADMIN">Administraator</option>
            </select>
          </div>
          <SubmitButton className="btn btn-primary w-full">
            Loo kasutaja
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
