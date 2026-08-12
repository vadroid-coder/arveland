import { formatMoney, formatRate, taxBreakdown } from "@/lib/money";
import { formatDate } from "@/lib/invoice";
import { docStrings } from "@/lib/doc-language";

type Business = {
  name: string;
  regNumber: string | null;
  vatNumber: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankSwift: string | null;
  footerNote: string | null;
};

type Invoice = {
  number: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  language: string;
  notes: string | null;
  subtotal: number;
  taxTotal: number;
  total: number;
  clientName: string;
  clientRegNumber: string;
  clientVatNumber: string | null;
  clientAddress: string | null;
  clientEmail: string | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    taxRate: number;
    net: number;
    tax: number;
    gross: number;
  }[];
};

export default function InvoiceDocument({
  business,
  invoice,
}: {
  business: Business;
  invoice: Invoice;
}) {
  const t = docStrings(invoice.language);
  const breakdown = taxBreakdown(invoice.items);
  const money = (c: number) => formatMoney(c, invoice.currency, t.locale);
  const date = (d: Date) => formatDate(d, t.locale);

  return (
    <article className="doc mx-auto shadow-sm print:shadow-none">
      {/* ---------- header ---------- */}
      <header className="flex items-start justify-between gap-8">
        <div className="max-w-[55%]">
          {business.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logo}
              alt={business.name}
              className="mb-4 max-h-16 max-w-[52mm] object-contain"
            />
          ) : null}
          <p className="text-[13pt] leading-tight font-bold">{business.name}</p>
          <div className="mt-1 space-y-0.5 text-[9pt] text-[#4b5265]">
            {business.regNumber && (
              <p>
                {t.regNumber}: {business.regNumber}
              </p>
            )}
            {business.vatNumber && (
              <p>
                {t.vatNumber}: {business.vatNumber}
              </p>
            )}
            {business.address && (
              <p className="whitespace-pre-line">{business.address}</p>
            )}
            {business.email && <p>{business.email}</p>}
            {business.phone && <p>{business.phone}</p>}
            {business.website && <p>{business.website}</p>}
          </div>
        </div>

        <div className="text-right">
          <p className="text-[20pt] leading-none font-bold tracking-tight">
            {t.title}
          </p>
          <p className="mt-1 text-[12pt] font-semibold">{invoice.number}</p>
          <table className="mt-4 ml-auto text-[9.5pt]">
            <tbody>
              <tr>
                <td className="pr-3 text-right text-[#666e82]">{t.issueDate}</td>
                <td className="text-right font-medium">
                  {date(invoice.issueDate)}
                </td>
              </tr>
              <tr>
                <td className="pr-3 text-right text-[#666e82]">{t.dueDate}</td>
                <td className="text-right font-medium">
                  {date(invoice.dueDate)}
                </td>
              </tr>
              <tr>
                <td className="pr-3 text-right text-[#666e82]">{t.amountDue}</td>
                <td className="text-right font-bold">{money(invoice.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </header>

      {/* ---------- buyer ---------- */}
      <section className="mt-10 border-t border-[#dcdfe6] pt-4">
        <p className="text-[8pt] font-semibold tracking-[0.08em] text-[#8d94a5] uppercase">
          {t.payer}
        </p>
        <p className="mt-1 text-[11pt] font-semibold">{invoice.clientName}</p>
        <div className="mt-0.5 space-y-0.5 text-[9pt] text-[#4b5265]">
          <p>
            {t.regNumber}: {invoice.clientRegNumber}
          </p>
          {invoice.clientVatNumber && (
            <p>
              {t.vatNumber}: {invoice.clientVatNumber}
            </p>
          )}
          {invoice.clientAddress && (
            <p className="whitespace-pre-line">{invoice.clientAddress}</p>
          )}
          {invoice.clientEmail && <p>{invoice.clientEmail}</p>}
        </div>
      </section>

      {/* ---------- items ---------- */}
      <table className="mt-8 w-full border-collapse text-[9.5pt]">
        <thead>
          <tr className="border-b-2 border-[#14171f] text-left text-[8pt] tracking-[0.06em] text-[#4b5265] uppercase">
            <th className="py-1.5 pr-2 font-semibold">{t.description}</th>
            <th className="w-16 px-2 py-1.5 text-right font-semibold">
              {t.quantity}
            </th>
            <th className="w-24 px-2 py-1.5 text-right font-semibold">
              {t.unitPrice}
            </th>
            <th className="w-14 px-2 py-1.5 text-right font-semibold">
              {t.taxRate}
            </th>
            <th className="w-24 px-2 py-1.5 text-right font-semibold">
              {t.lineNet}
            </th>
            <th className="w-28 py-1.5 pl-2 text-right font-semibold">
              {t.lineTotal}
            </th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-b border-[#eceef2] align-top">
              <td className="py-2 pr-2">{item.description}</td>
              <td className="px-2 py-2 text-right tabular-nums">
                {formatQty(item.quantity)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {money(Math.round(item.net / (item.quantity || 1)))}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {formatRate(item.taxRate)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">
                {money(item.net)}
              </td>
              <td className="py-2 pl-2 text-right font-medium tabular-nums">
                {money(item.gross)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---------- totals ---------- */}
      <div className="mt-5 flex justify-end">
        <table className="w-[75mm] text-[9.5pt]">
          <tbody>
            <tr>
              <td className="py-1 text-[#4b5265]">{t.subtotal}</td>
              <td className="py-1 text-right tabular-nums">
                {money(invoice.subtotal)}
              </td>
            </tr>
            {breakdown.map((b) => (
              <tr key={b.rate}>
                <td className="py-1 text-[#4b5265]">
                  {t.tax} {formatRate(b.rate)}
                </td>
                <td className="py-1 text-right tabular-nums">{money(b.tax)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#14171f]">
              <td className="pt-2 text-[11pt] font-bold">{t.total}</td>
              <td className="pt-2 text-right text-[11pt] font-bold tabular-nums">
                {money(invoice.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---------- payment details ---------- */}
      <section className="mt-8 rounded-md border-2 border-[#14171f] px-5 py-4">
        <p className="text-[8pt] font-semibold tracking-[0.08em] text-[#4b5265] uppercase">
          {t.paymentDetails}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1.5 text-[9.5pt]">
          <Row label={t.beneficiary} value={business.name} strong />
          <Row label={t.bank} value={business.bankName} />
          <Row label={t.account} value={business.bankAccount} strong />
          <Row label={t.swift} value={business.bankSwift} />
          <Row label={t.reference} value={invoice.number} strong />
          <Row label={t.amount} value={money(invoice.total)} strong />
        </div>
      </section>

      {/* ---------- footer ---------- */}
      {(invoice.notes || business.footerNote) && (
        <footer className="mt-6 space-y-1 text-[8.5pt] text-[#666e82]">
          {invoice.notes && (
            <p className="whitespace-pre-line">{invoice.notes}</p>
          )}
          {business.footerNote && (
            <p className="whitespace-pre-line">{business.footerNote}</p>
          )}
        </footer>
      )}
    </article>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string | null;
  strong?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3 border-b border-[#eceef2] pb-1">
      <span className="text-[#666e82]">{label}</span>
      <span className={strong ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function formatQty(q: number) {
  return Number.isInteger(q) ? String(q) : q.toFixed(2);
}
