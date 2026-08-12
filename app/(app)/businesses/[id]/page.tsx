import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/ui-language";
import { ownedBusinessOrNotFound } from "@/lib/guard";
import BusinessForm from "@/components/BusinessForm";
import SubmitButton from "@/components/SubmitButton";
import { formatRate } from "@/lib/money";
import {
  addTaxRate,
  archiveBusiness,
  deleteTaxRate,
  updateBusiness,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT();
  const { id } = await params;
  await ownedBusinessOrNotFound(id);
  const business = await prisma.business.findUniqueOrThrow({
    where: { id },
    include: { taxRates: { orderBy: { rate: "asc" } } },
  });

  const update = updateBusiness.bind(null, id);
  const archive = archiveBusiness.bind(null, id);
  const addRate = addTaxRate.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/businesses" className="text-sm text-ink-500 hover:underline">
          {t.business.back}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
          {business.name}
        </h1>
      </div>

      <BusinessForm
        action={update}
        business={business}
        submitLabel={t.common.saveChanges}
      />

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-700">
          {t.business.taxTitle}
        </h2>
        <p className="mb-4 text-xs text-ink-400">
          {t.business.taxHint}
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {business.taxRates.length === 0 && (
            <p className="text-sm text-ink-400">{t.business.taxEmpty}</p>
          )}
          {business.taxRates.map((taxRate) => (
            <span
              key={taxRate.id}
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 py-1 pr-1 pl-3 text-sm"
            >
              <span className="font-medium text-ink-800">
                {formatRate(taxRate.rate)}
              </span>
              {taxRate.label && (
                <span className="text-ink-400">{taxRate.label}</span>
              )}
              <form action={deleteTaxRate.bind(null, taxRate.id, business.id)}>
                <button
                  className="grid h-6 w-6 place-items-center rounded text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                  title={t.common.delete}
                >
                  ×
                </button>
              </form>
            </span>
          ))}
        </div>

        <form action={addRate} className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <label className="label">{t.business.taxRate}</label>
            <input
              name="rate"
              className="field"
              placeholder="22"
              inputMode="decimal"
              required
            />
          </div>
          <div className="w-48">
            <label className="label">{t.business.taxLabel}</label>
            <input name="label" className="field" placeholder={t.business.taxLabelPlaceholder} />
          </div>
          <SubmitButton className="btn btn-ghost">{t.business.taxAdd}</SubmitButton>
        </form>
      </section>

      <section className="card border-red-200 p-5">
        <h2 className="text-sm font-semibold text-red-700">{t.business.dangerZone}</h2>
        <p className="mt-1 mb-4 text-xs text-ink-500">
          {t.business.archiveHint}
        </p>
        <form action={archive}>
          <SubmitButton
            className="btn btn-danger"
            confirm={t.business.confirmArchive(business.name)}
          >
            {t.business.archive}
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
