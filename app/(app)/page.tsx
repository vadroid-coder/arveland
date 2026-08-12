import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveBusiness } from "@/lib/business";
import { formatMoney } from "@/lib/money";
import {
  effectiveStatus,
  formatDate,
  monthLabel,
  zipFileName,
} from "@/lib/invoice";
import { getT } from "@/lib/ui-language";
import StatusBadge from "@/components/StatusBadge";
import EmptyBusiness from "@/components/EmptyBusiness";
import InvoiceRowMenu from "@/components/InvoiceRowMenu";
import MonthDownload from "@/components/MonthDownload";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; status?: string; q?: string }>;
}) {
  const { active } = await getActiveBusiness();
  if (!active) return <EmptyBusiness />;

  const t = await getT();
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

  const money = (cents: number, currency = active.currency) =>
    formatMoney(cents, currency, t.locale);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {t.dashboard.title}
          </h1>
          <p className="text-sm text-ink-500">
            {active.name} · {t.dashboard.countForYear(invoices.length, year)}
          </p>
        </div>
        <Link href="/invoices/new" className="btn btn-primary">
          {t.dashboard.newInvoice}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label={t.dashboard.statTotal} value={money(totals.total)} />
        <Stat
          label={t.dashboard.statPaid}
          value={money(totals.paid)}
          tone="text-emerald-600"
        />
        <Stat
          label={t.dashboard.statUnpaid}
          value={money(totals.open)}
          tone="text-amber-600"
        />
      </div>

      <form className="card grid grid-cols-2 items-end gap-3 p-3 sm:flex sm:flex-wrap">
        <div className="col-span-2 min-w-[10rem] sm:flex-1">
          <label className="label">{t.common.search}</label>
          <input
            name="q"
            defaultValue={q}
            className="field"
            placeholder={t.dashboard.searchPlaceholder}
          />
        </div>
        <div>
          <label className="label">{t.common.year}</label>
          <select name="year" defaultValue={year} className="field sm:w-28">
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t.common.status}</label>
          <select name="status" defaultValue={status} className="field sm:w-40">
            <option value="">{t.common.all}</option>
            <option value="DRAFT">{t.dashboard.statusDraft}</option>
            <option value="SENT">{t.dashboard.statusSent}</option>
            <option value="PAID">{t.dashboard.statusPaid}</option>
            <option value="UNPAID">{t.dashboard.statusUnpaid}</option>
          </select>
        </div>
        <button className="btn btn-ghost col-span-2 sm:col-span-1">
          {t.common.filter}
        </button>
      </form>

      {invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm text-ink-500">{t.dashboard.empty}</p>
          <Link href="/invoices/new" className="btn btn-primary mt-4">
            {t.dashboard.createFirst}
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([month, list]) => {
            const monthTotal = list.reduce((s, i) => s + i.total, 0);
            const period = monthLabel(year, month, t.months);
            return (
              <section key={month} className="card overflow-visible">
                <header className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
                  <h2 className="text-sm font-semibold text-ink-700">{period}</h2>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-ink-500">
                      {t.dashboard.invoiceCount(list.length)} ·{" "}
                      <span className="font-semibold text-ink-800">
                        {money(monthTotal)}
                      </span>
                    </p>
                    <MonthDownload
                      businessId={active.id}
                      year={year}
                      month={month}
                      period={period}
                      zipName={zipFileName(active.invoicePrefix, year, month)}
                      invoices={list.map((i) => ({
                        id: i.id,
                        number: i.number,
                        clientName: i.clientName,
                        total: money(i.total, i.currency),
                      }))}
                    />
                  </div>
                </header>

                {/* desktop */}
                <table className="hidden w-full text-sm md:table">
                  <thead>
                    <tr className="border-b border-ink-100 text-left text-xs tracking-wide text-ink-400 uppercase">
                      <th className="px-4 py-2 font-medium">
                        {t.dashboard.colNumber}
                      </th>
                      <th className="px-4 py-2 font-medium">
                        {t.dashboard.colClient}
                      </th>
                      <th className="px-4 py-2 font-medium">
                        {t.dashboard.colDate}
                      </th>
                      <th className="px-4 py-2 font-medium">
                        {t.dashboard.colDue}
                      </th>
                      <th className="px-4 py-2 font-medium">
                        {t.dashboard.colStatus}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        {t.dashboard.colAmount}
                      </th>
                      <th className="w-12 px-2 py-2" />
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
                          {formatDate(inv.issueDate, t.locale)}
                        </td>
                        <td className="px-4 py-2.5 text-ink-600">
                          {formatDate(inv.dueDate, t.locale)}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={effectiveStatus(inv)} />
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                          {money(inv.total, inv.currency)}
                        </td>
                        <td className="px-2 py-2.5">
                          <InvoiceRowMenu
                            id={inv.id}
                            number={inv.number}
                            clientEmail={inv.clientEmail}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* mobile */}
                <ul className="divide-y divide-ink-100 md:hidden">
                  {list.map((inv) => (
                    <li key={inv.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink-900">
                            {inv.clientName}
                          </p>
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="text-sm font-medium text-brand-600"
                          >
                            {inv.number}
                          </Link>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold tabular-nums text-ink-900">
                            {money(inv.total, inv.currency)}
                          </p>
                          <StatusBadge status={effectiveStatus(inv)} />
                        </div>
                      </div>

                      <dl className="mt-2 flex gap-4 text-xs text-ink-500">
                        <div className="flex gap-1">
                          <dt>{t.dashboard.colDate}:</dt>
                          <dd className="text-ink-700">
                            {formatDate(inv.issueDate, t.locale)}
                          </dd>
                        </div>
                        <div className="flex gap-1">
                          <dt>{t.dashboard.colDue}:</dt>
                          <dd className="text-ink-700">
                            {formatDate(inv.dueDate, t.locale)}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <InvoiceRowMenu
                          id={inv.id}
                          number={inv.number}
                          clientEmail={inv.clientEmail}
                          quick
                        />
                      </div>
                    </li>
                  ))}
                </ul>
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
    <div className="card px-3 py-2.5 sm:px-4 sm:py-3">
      <p className="text-[10px] tracking-wide text-ink-400 uppercase sm:text-xs">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold tabular-nums sm:text-xl ${tone}`}>
        {value}
      </p>
    </div>
  );
}
