import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveBusiness } from "@/lib/business";
import { formatMoney } from "@/lib/money";
import { effectiveStatus, formatDate, monthLabel } from "@/lib/invoice";
import StatusBadge from "@/components/StatusBadge";
import EmptyBusiness from "@/components/EmptyBusiness";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string; q?: string }>;
}) {
  const { active } = await getActiveBusiness();
  if (!active) return <EmptyBusiness />;

  const sp = await searchParams;
  const year = Number(sp.year) || new Date().getFullYear();
  const status = sp.status ?? "";
  const q = (sp.q ?? "").trim();

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId: active.id,
      year,
      ...(status === "UNPAID"
        ? { status: { not: "PAID" } }
        : status
          ? { status }
          : {}),
      ...(q
        ? {
            OR: [
              { number: { contains: q } },
              { clientName: { contains: q } },
              { clientRegNumber: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { seq: "desc" }],
  });

  const years = await prisma.invoice.findMany({
    where: { businessId: active.id },
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "desc" },
  });
  const yearOptions = [
    ...new Set([new Date().getFullYear(), ...years.map((y) => y.year)]),
  ].sort((a, b) => b - a);

  // group by month
  const groups = new Map<number, typeof invoices>();
  for (const inv of invoices) {
    const list = groups.get(inv.month) ?? [];
    list.push(inv);
    groups.set(inv.month, list);
  }

  const totals = invoices.reduce(
    (acc, i) => {
      acc.total += i.total;
      if (i.status === "PAID") acc.paid += i.total;
      else acc.open += i.total;
      return acc;
    },
    { total: 0, paid: 0, open: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Счета
          </h1>
          <p className="text-sm text-ink-500">
            {active.name} · счетов за {year}: {invoices.length}
          </p>
        </div>
        <Link href="/invoices/new" className="btn btn-primary">
          + Новый счёт
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Всего" value={formatMoney(totals.total, active.currency)} />
        <Stat
          label="Оплачено"
          value={formatMoney(totals.paid, active.currency)}
          tone="text-emerald-600"
        />
        <Stat
          label="Не оплачено"
          value={formatMoney(totals.open, active.currency)}
          tone="text-amber-600"
        />
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-3">
        <div className="min-w-[10rem] flex-1">
          <label className="label">Поиск</label>
          <input
            name="q"
            defaultValue={q}
            className="field"
            placeholder="Номер счёта, клиент, рег. код"
          />
        </div>
        <div>
          <label className="label">Год</label>
          <select name="year" defaultValue={year} className="field w-28">
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Статус</label>
          <select name="status" defaultValue={status} className="field w-40">
            <option value="">Все</option>
            <option value="DRAFT">Черновик</option>
            <option value="SENT">Отправлен</option>
            <option value="PAID">Оплачен</option>
            <option value="UNPAID">Не оплачен</option>
          </select>
        </div>
        <button className="btn btn-ghost">Фильтр</button>
      </form>

      {invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-ink-500">Счета не найдены.</p>
          <Link href="/invoices/new" className="btn btn-primary mt-4">
            Создать первый счёт
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([month, list]) => {
            const monthTotal = list.reduce((s, i) => s + i.total, 0);
            return (
              <section key={month} className="card overflow-hidden">
                <header className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
                  <h2 className="text-sm font-semibold text-ink-700">
                    {monthLabel(year, month)}
                  </h2>
                  <p className="text-sm text-ink-500">
                    счетов: {list.length} ·{" "}
                    <span className="font-semibold text-ink-800">
                      {formatMoney(monthTotal, active.currency)}
                    </span>
                  </p>
                </header>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-left text-xs tracking-wide text-ink-400 uppercase">
                      <th className="px-4 py-2 font-medium">Номер</th>
                      <th className="px-4 py-2 font-medium">Клиент</th>
                      <th className="px-4 py-2 font-medium">Дата</th>
                      <th className="px-4 py-2 font-medium">Срок оплаты</th>
                      <th className="px-4 py-2 font-medium">Статус</th>
                      <th className="px-4 py-2 text-right font-medium">
                        Сумма
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="font-medium text-brand-600 hover:underline"
                          >
                            {inv.number}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="block text-ink-800">
                            {inv.clientName}
                          </span>
                          <span className="block text-xs text-ink-400">
                            {inv.clientRegNumber}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-ink-600">
                          {formatDate(inv.issueDate)}
                        </td>
                        <td className="px-4 py-2.5 text-ink-600">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={effectiveStatus(inv)} />
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                          {formatMoney(inv.total, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-ink-900",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs tracking-wide text-ink-400 uppercase">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>
        {value}
      </p>
    </div>
  );
}
