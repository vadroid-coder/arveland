import Link from "next/link";
import { ownedInvoiceOrNotFound } from "@/lib/guard";
import InvoiceDocument from "@/components/InvoiceDocument";
import PrintButton from "@/components/PrintButton";
import StatusBadge from "@/components/StatusBadge";
import SubmitButton from "@/components/SubmitButton";
import { effectiveStatus, invoiceFileName } from "@/lib/invoice";
import EmailButton from "@/components/EmailButton";
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
      <div className="no-print flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <Link href="/" className="text-sm text-ink-500 hover:underline">
            {t.invoice.backToList}
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              {invoice.number}
            </h1>
            <StatusBadge status={effectiveStatus(invoice)} />
          </div>
        </div>

        {invoice.status !== "PAID" ? (
          <form action={markPaid}>
            <SubmitButton className="btn btn-ghost">{t.invoice.markPaid}</SubmitButton>
          </form>
        ) : (
          <form action={markSent}>
            <SubmitButton className="btn btn-ghost">
              {t.invoice.unmarkPaid}
            </SubmitButton>
          </form>
        )}
        {invoice.status === "DRAFT" && (
          <form action={markSent}>
            <SubmitButton className="btn btn-ghost">
              {t.invoice.markSent}
            </SubmitButton>
          </form>
        )}
        {invoice.status === "SENT" && (
          <form action={markDraft}>
            <SubmitButton className="btn btn-ghost">{t.invoice.backToDraft}</SubmitButton>
          </form>
        )}
        <form action={duplicate}>
          <SubmitButton className="btn btn-ghost">{t.invoice.duplicate}</SubmitButton>
        </form>
        <form action={remove}>
          <SubmitButton
            className="btn btn-danger"
            confirm={t.invoice.confirmDelete(invoice.number)}
          >
            {t.common.delete}
          </SubmitButton>
        </form>
        <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-ghost">
          {t.common.edit}
        </Link>
        <a href={`/api/invoices/${invoice.id}/pdf`} className="btn btn-ghost">
          {t.invoice.downloadPdf}
        </a>
        <EmailButton
          target={{ kind: "invoice", id: invoice.id }}
          defaultTo={invoice.clientEmail ?? ""}
          attachmentName={invoiceFileName(invoice)}
        />
        <PrintButton />
      </div>

      <div className="overflow-x-auto">
        <InvoiceDocument business={invoice.business} invoice={invoice} />
      </div>
    </div>
  );
}
