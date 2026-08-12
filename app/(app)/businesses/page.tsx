import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/ui-language";
import { getActiveBusiness } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function BusinessesPage() {
  const t = await getT();
  const { businesses, active, user } = await getActiveBusiness();
  const counts = await prisma.invoice.groupBy({
    by: ["businessId"],
    where: { business: { ownerId: user.uid } },
    _count: { _all: true },
  });
  const countFor = (id: string) =>
    counts.find((c) => c.businessId === id)?._count._all ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {t.business.title}
          </h1>
          <p className="text-sm text-ink-500">
            {t.business.subtitle}
          </p>
        </div>
        <Link href="/businesses/new" className="btn btn-primary">
          {t.business.new}
        </Link>
      </div>

      {businesses.length === 0 ? (
        <div className="card p-12 text-center text-sm text-ink-500">
          {t.business.empty}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <Link
              key={b.id}
              href={`/businesses/${b.id}`}
              className="card flex flex-col gap-3 p-5 transition hover:border-brand-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink-100">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.logo}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-lg font-bold text-ink-500">
                      {b.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {b.id === active?.id && (
                  <span className="badge bg-brand-50 text-brand-700">
                    {t.business.active}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-ink-900">{b.name}</p>
                <p className="text-xs text-ink-400">
                  {b.regNumber ? `${t.client.colReg} ${b.regNumber} · ` : ""}
                  {b.invoicePrefix}
                </p>
              </div>
              <p className="mt-auto text-xs text-ink-500">
                {t.business.stats(countFor(b.id), b.paymentTermDays)} ·{" "}
                {b.currency}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
