"use client";

import Link from "next/link";
import LogoUpload from "./LogoUpload";
import { DOC_LANGUAGES } from "@/lib/doc-language";
import { useT } from "./I18nProvider";
import SubmitButton from "./SubmitButton";

type BusinessLike = {
  name?: string;
  regNumber?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logo?: string | null;
  invoicePrefix?: string;
  paymentTermDays?: number;
  currency?: string;
  defaultLanguage?: string;
  bankName?: string | null;
  bankAccount?: string | null;
  bankSwift?: string | null;
  footerNote?: string | null;
};

export default function BusinessForm({
  action,
  business,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<void>;
  business?: BusinessLike;
  submitLabel: string;
}) {
  const t = useT();
  const b = business ?? {};

  return (
    <form action={action} className="space-y-5">
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">
          {t.business.detailsSection}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${t.common.companyName} *`} className="sm:col-span-2">
            <input
              name="name"
              className="field"
              defaultValue={b.name ?? ""}
              required
            />
          </Field>
          <Field label={t.common.regNumber}>
            <input
              name="regNumber"
              className="field"
              defaultValue={b.regNumber ?? ""}
            />
          </Field>
          <Field label={t.common.vatNumber}>
            <input
              name="vatNumber"
              className="field"
              defaultValue={b.vatNumber ?? ""}
            />
          </Field>
          <Field label={t.common.address} className="sm:col-span-2">
            <textarea
              name="address"
              rows={2}
              className="field"
              defaultValue={b.address ?? ""}
            />
          </Field>
          <Field label={t.common.email}>
            <input
              name="email"
              type="email"
              className="field"
              defaultValue={b.email ?? ""}
            />
          </Field>
          <Field label={t.common.phone}>
            <input name="phone" className="field" defaultValue={b.phone ?? ""} />
          </Field>
          <Field label={t.common.website} className="sm:col-span-2">
            <input
              name="website"
              className="field"
              defaultValue={b.website ?? ""}
            />
          </Field>
          <div className="sm:col-span-2">
            <LogoUpload initial={b.logo} />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">
          {t.business.invoiceSection}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={`${t.business.prefix} *`}>
            <input
              name="invoicePrefix"
              className="field uppercase"
              defaultValue={b.invoicePrefix ?? "INV"}
              placeholder="ARV"
              required
            />
            <p className="mt-1 text-xs text-ink-400">
              {t.business.prefixHint}
            </p>
          </Field>
          <Field label={t.business.paymentTerm}>
            <input
              name="paymentTermDays"
              type="number"
              min={0}
              className="field"
              defaultValue={b.paymentTermDays ?? 7}
            />
          </Field>
          <Field label={t.business.currency}>
            <select
              name="currency"
              className="field"
              defaultValue={b.currency ?? "EUR"}
            >
              {["EUR", "USD", "GBP", "SEK", "PLN"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label={t.business.docLanguage}>
            <select
              name="defaultLanguage"
              className="field"
              defaultValue={b.defaultLanguage ?? "ET"}
            >
              {DOC_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-400">
              {t.business.docLanguageHint}
            </p>
          </Field>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-700">
          {t.business.bankSection}
        </h2>
        <p className="mb-4 text-xs text-ink-400">
          {t.business.bankHint}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.business.bankName}>
            <input
              name="bankName"
              className="field"
              defaultValue={b.bankName ?? ""}
              placeholder="LHV Pank"
            />
          </Field>
          <Field label={t.business.bankAccount}>
            <input
              name="bankAccount"
              className="field"
              defaultValue={b.bankAccount ?? ""}
              placeholder="EE00 0000 0000 0000 0000"
            />
          </Field>
          <Field label={t.business.bankSwift}>
            <input
              name="bankSwift"
              className="field"
              defaultValue={b.bankSwift ?? ""}
            />
          </Field>
          <Field label={t.business.footerNote} className="sm:col-span-3">
            <textarea
              name="footerNote"
              rows={2}
              className="field"
              defaultValue={b.footerNote ?? ""}
              placeholder={t.business.footerPlaceholder}
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton className="btn btn-primary" pendingLabel={t.common.saving}>
          {submitLabel}
        </SubmitButton>
        <Link href="/businesses" className="btn btn-ghost">
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
