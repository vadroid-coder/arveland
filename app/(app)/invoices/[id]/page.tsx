import Link from "next/link";
import { ownedInvoiceOrNotFound } from "@/lib/guard";
import InvoiceDocument from "@/components/InvoiceDocument";
import DocumentScaler from "@/components/DocumentScaler";
import StatusBadge from "@/components/StatusBadge";
import SubmitButton from "@/components/SubmitButton";
import EmailButton from "@/components/EmailButton";
import SharePdfButton from "@/components/SharePdfButton";
import { effectiveStatus, invoiceFileName } from "@/lib/invoice";
import { getT } from "@/lib/ui-language";
import { deleteInvoice, duplicateInvoice, setInvoiceStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getT();
  const { id } = await params;
  const invoice = await ownedInvoiceOrNotFound(id);

  const markPaid = setInvoiceStatus.bind(null, id, "PAID");
  const markSent = setInvoiceStatus.bind(null, id, "SENT");
  const markDraft = setInvoiceStatus.bind(null, id, "DRAFT");
  const duplicate = duplicateInvoice.bind(null, id);
  const remove = deleteInvoice.bind(null, id);

  return (
    <div className="space-y-5">
      <div className="no-print">
        <Link href="/" className="text-sm text-ink-500 hover:underline">
          {t.invoice.backToList}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {invoice.number}
          </h1>
          <StatusBadge status={effectiveStatus(invoice)} />
        </div>
      </div>

      {/* Three groups, each a segmented block so they stay legible when they
          wrap onto separate lines on a phone. */}
      <div className="no-print flex flex-wrap gap-2">
        {/* status as a segmented control — shorter than "mark as …" phrasing
            and it shows where the invoice currently stands */}
        <Group>
          <form action={markDraft} className="contents">
            <StatusButton current={invoice.status === "DRAFT"}>
              {t.dashboard.statusDraft}
            </StatusButton>
          </form>
          <form action={markSent} className="contents">
            <StatusButton current={invoice.status === "SENT"}>
              {t.dashboard.statusSent}
            </StatusButton>
          </form>
          <form action={markPaid} className="contents">
            <StatusButton current={invoice.status === "PAID"}>
              {t.dashboard.statusPaid}
            </StatusButton>
          </form>
        </Group>

        <Group>
          <Link
            href={`/invoices/${invoice.id}/edit`}
            className="bg-white flex-1 justify-center px-3 py-2 text-center text-sm font-medium whitespace-nowrap sm:flex-none text-ink-700 transition hover:bg-ink-50"
          >
            {t.common.edit}
          </Link>
          <form action={duplicate} className="contents">
            <GroupButton>{t.invoice.duplicate}</GroupButton>
          </form>
          <form action={remove} className="contents">
            <SubmitButton
              className="cursor-pointer bg-white flex-1 justify-center px-3 py-2 text-center text-sm font-medium whitespace-nowrap sm:flex-none text-red-600 transition hover:bg-red-50"
              confirm={t.invoice.confirmDelete(invoice.number)}
            >
              {t.common.delete}
            </SubmitButton>
          </form>
        </Group>

        <Group accent>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            className="bg-white flex-1 justify-center px-3 py-2 text-center text-sm font-medium whitespace-nowrap sm:flex-none text-brand-700 transition hover:bg-brand-50"
          >
            {t.invoice.downloadPdf}
          </a>
          <SharePdfButton
            id={invoice.id}
            fileName={invoiceFileName(invoice)}
            title={invoice.number}
            className="cursor-pointer bg-white flex-1 justify-center px-3 py-2 text-center text-sm font-medium whitespace-nowrap sm:flex-none text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
          />
          <EmailButton
            target={{ kind: "invoice", id: invoice.id }}
            companyEmail={invoice.business.email}
            attachmentName={invoiceFileName(invoice)}
            className="cursor-pointer bg-white flex-1 justify-center px-3 py-2 text-center text-sm font-medium whitespace-nowrap sm:flex-none text-brand-700 transition hover:bg-brand-50"
          />
        </Group>
      </div>

      <div className="overflow-x-auto">
        <DocumentScaler>
          <InvoiceDocument business={invoice.business} invoice={invoice} />
        </DocumentScaler>
      </div>
    </div>
  );
}

function Group({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-wrap gap-px overflow-hidden rounded-lg border sm:inline-flex sm:w-auto ${
        accent
          ? "border-brand-300 bg-brand-200"
          : "border-ink-200 bg-ink-200"
      }`}
    >
      {children}
    </div>
  );
}

function GroupButton({ children }: { children: React.ReactNode }) {
  return (
    <SubmitButton className="cursor-pointer bg-white flex-1 justify-center px-3 py-2 text-center text-sm font-medium whitespace-nowrap sm:flex-none text-ink-700 transition hover:bg-ink-50">
      {children}
    </SubmitButton>
  );
}

function StatusButton({
  children,
  current,
}: {
  children: React.ReactNode;
  current: boolean;
}) {
  return (
    <SubmitButton
      className={`cursor-pointer flex-1 justify-center px-3 py-2 text-center text-sm whitespace-nowrap transition sm:flex-none ${
        current
          ? "bg-ink-800 font-semibold text-white"
          : "bg-white font-medium text-ink-600 hover:bg-ink-50"
      }`}
    >
      {children}
    </SubmitButton>
  );
}
