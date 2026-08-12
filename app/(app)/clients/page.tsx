import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveBusiness } from "@/lib/business";
import ClientFields from "@/components/ClientFields";
import SubmitButton from "@/components/SubmitButton";
import EmptyBusiness from "@/components/EmptyBusiness";
import { createClient } from "./actions";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { active } = await getActiveBusiness();
  if (!active) return <EmptyBusiness />;

  const { q = "", error } = await searchParams;
  const search = q.trim();

  const clients = await prisma.client.findMany({
    where: {
      businessId: active.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { regNumber: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { invoices: true } } },
  });

  const create = createClient.bind(null, active.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Клиенты
        </h1>
        <p className="text-sm text-ink-500">{active.name}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <form className="card flex items-end gap-3 p-3">
            <div className="flex-1">
              <label className="label">Поиск по названию или рег. коду</label>
              <input name="q" defaultValue={search} className="field" />
            </div>
            <button className="btn btn-ghost">Найти</button>
          </form>

          <div className="card overflow-hidden">
            {clients.length === 0 ? (
              <p className="p-10 text-center text-sm text-ink-500">
                Клиенты не найдены.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs tracking-wide text-ink-400 uppercase">
                    <th className="px-4 py-2 font-medium">Название</th>
                    <th className="px-4 py-2 font-medium">Рег. код</th>
                    <th className="px-4 py-2 font-medium">НДС</th>
                    <th className="px-4 py-2 text-right font-medium">Счетов</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/clients/${c.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {c.name}
                        </Link>
                        {c.email && (
                          <span className="block text-xs text-ink-400">
                            {c.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-ink-600">{c.regNumber}</td>
                      <td className="px-4 py-2.5 text-ink-600">
                        {c.vatNumber ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ink-600">
                        {c._count.invoices}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <form action={create} className="card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold text-ink-700">Новый клиент</h2>
          {error === "required" && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              Название и регистрационный код обязательны.
            </p>
          )}
          <ClientFields />
          <SubmitButton className="btn btn-primary w-full">
            Добавить клиента
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
