import Link from "next/link";
import LogoUpload from "./LogoUpload";
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
  const b = business ?? {};

  return (
    <form action={action} className="space-y-5">
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">
          Ettevõtte andmed
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ettevõtte nimi *" className="sm:col-span-2">
            <input
              name="name"
              className="field"
              defaultValue={b.name ?? ""}
              required
            />
          </Field>
          <Field label="Registrikood">
            <input
              name="regNumber"
              className="field"
              defaultValue={b.regNumber ?? ""}
            />
          </Field>
          <Field label="KMKR / VAT number">
            <input
              name="vatNumber"
              className="field"
              defaultValue={b.vatNumber ?? ""}
            />
          </Field>
          <Field label="Aadress" className="sm:col-span-2">
            <textarea
              name="address"
              rows={2}
              className="field"
              defaultValue={b.address ?? ""}
            />
          </Field>
          <Field label="E-post">
            <input
              name="email"
              type="email"
              className="field"
              defaultValue={b.email ?? ""}
            />
          </Field>
          <Field label="Telefon">
            <input name="phone" className="field" defaultValue={b.phone ?? ""} />
          </Field>
          <Field label="Veebileht" className="sm:col-span-2">
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
          Arve seaded
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Arve numbri prefiks *">
            <input
              name="invoicePrefix"
              className="field uppercase"
              defaultValue={b.invoicePrefix ?? "INV"}
              placeholder="ARV"
              required
            />
            <p className="mt-1 text-xs text-ink-400">
              Formaat: PREFIX-YY-M-NR
            </p>
          </Field>
          <Field label="Maksetähtaeg (päeva)">
            <input
              name="paymentTermDays"
              type="number"
              min={0}
              className="field"
              defaultValue={b.paymentTermDays ?? 7}
            />
          </Field>
          <Field label="Valuuta">
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
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-700">
          Pangarekvisiidid
        </h2>
        <p className="mb-4 text-xs text-ink-400">
          Kuvatakse arvel eraldi esiletõstetud plokis — kuhu raha kanda.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Panga nimi">
            <input
              name="bankName"
              className="field"
              defaultValue={b.bankName ?? ""}
              placeholder="LHV Pank"
            />
          </Field>
          <Field label="Arvelduskonto (IBAN)">
            <input
              name="bankAccount"
              className="field"
              defaultValue={b.bankAccount ?? ""}
              placeholder="EE00 0000 0000 0000 0000"
            />
          </Field>
          <Field label="SWIFT / BIC">
            <input
              name="bankSwift"
              className="field"
              defaultValue={b.bankSwift ?? ""}
            />
          </Field>
          <Field label="Arve jalus / märkus" className="sm:col-span-3">
            <textarea
              name="footerNote"
              rows={2}
              className="field"
              defaultValue={b.footerNote ?? ""}
              placeholder="Viivis 0,05% päevas."
            />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <SubmitButton className="btn btn-primary" pendingLabel="Salvestan…">
          {submitLabel}
        </SubmitButton>
        <Link href="/businesses" className="btn btn-ghost">
          Katkesta
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
