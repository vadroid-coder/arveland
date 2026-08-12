import Link from "next/link";
import { ownedInvoiceOrNotFound } from "@/lib/guard";
import InvoiceDocument from "@/components/InvoiceDocument";
import PrintButton from "@/components/PrintButton";
import StatusBadge from "@/components/StatusBadge";
import SubmitButton from "@/components/SubmitButton";
import { effectiveStatus } from "@/lib/invoice";
import { deleteInvoice, duplicateInvoice, setInvoiceStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
            ← Счета
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
            <SubmitButton className="btn btn-ghost">Отметить оплаченным</SubmitButton>
          </form>
        ) : (
          <form action={markSent}>
            <SubmitButton className="btn btn-ghost">
              Снять отметку об оплате
            </SubmitButton>
          </form>
        )}
        {invoice.status === "DRAFT" && (
          <form action={markSent}>
            <SubmitButton className="btn btn-ghost">
              Отметить отправленным
            </SubmitButton>
          </form>
        )}
        {invoice.status === "SENT" && (
          <form action={markDraft}>
            <SubmitButton className="btn btn-ghost">Вернуть в черновик</SubmitButton>
          </form>
        )}
        <form action={duplicate}>
          <SubmitButton className="btn btn-ghost">Дублировать</SubmitButton>
        </form>
        <form action={remove}>
          <SubmitButton
            className="btn btn-danger"
            confirm={`Удалить счёт ${invoice.number}?`}
          >
            Удалить
          </SubmitButton>
        </form>
        <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-ghost">
          Изменить
        </Link>
        <PrintButton />
      </div>

      <div className="overflow-x-auto">
        <InvoiceDocument business={invoice.business} invoice={invoice} />
      </div>
    </div>
  );
}
