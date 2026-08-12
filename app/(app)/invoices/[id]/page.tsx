import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: { orderBy: { sortNo: "asc" } }, business: true },
  });
  if (!invoice) notFound();

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
            ← Arved
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
            <SubmitButton className="btn btn-ghost">Märgi makstuks</SubmitButton>
          </form>
        ) : (
          <form action={markSent}>
            <SubmitButton className="btn btn-ghost">
              Tühista makse märge
            </SubmitButton>
          </form>
        )}
        {invoice.status === "DRAFT" && (
          <form action={markSent}>
            <SubmitButton className="btn btn-ghost">
              Märgi saadetuks
            </SubmitButton>
          </form>
        )}
        {invoice.status === "SENT" && (
          <form action={markDraft}>
            <SubmitButton className="btn btn-ghost">Tagasi mustandiks</SubmitButton>
          </form>
        )}
        <form action={duplicate}>
          <SubmitButton className="btn btn-ghost">Dubleeri</SubmitButton>
        </form>
        <form action={remove}>
          <SubmitButton
            className="btn btn-danger"
            confirm={`Kustutada arve ${invoice.number}?`}
          >
            Kustuta
          </SubmitButton>
        </form>
        <Link href={`/invoices/${invoice.id}/edit`} className="btn btn-ghost">
          Muuda
        </Link>
        <PrintButton />
      </div>

      <div className="overflow-x-auto">
        <InvoiceDocument business={invoice.business} invoice={invoice} />
      </div>
    </div>
  );
}
