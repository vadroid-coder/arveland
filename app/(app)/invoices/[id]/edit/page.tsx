import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ownedInvoiceOrNotFound } from "@/lib/guard";
import InvoiceEditor from "@/components/InvoiceEditor";
import { addDays, startOfDayUTC, toDateInput } from "@/lib/invoice";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await ownedInvoiceOrNotFound(id);

  const [clients, taxRates] = await Promise.all([
    prisma.client.findMany({
      where: { businessId: invoice.businessId },
      orderBy: { name: "asc" },
    }),
    prisma.taxRate.findMany({
      where: { businessId: invoice.businessId },
      orderBy: { rate: "asc" },
    }),
  ]);

  const today = startOfDayUTC(new Date());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href={`/invoices/${invoice.id}`}
          className="text-sm text-ink-500 hover:underline"
        >
          ← {invoice.number}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
          Редактирование счёта
        </h1>
        <p className="text-sm text-ink-500">{invoice.business.name}</p>
      </div>

      <InvoiceEditor
        business={{
          id: invoice.business.id,
          name: invoice.business.name,
          currency: invoice.business.currency,
          paymentTermDays: invoice.business.paymentTermDays,
          invoicePrefix: invoice.business.invoicePrefix,
          defaultLanguage: invoice.business.defaultLanguage,
        }}
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          regNumber: c.regNumber,
          vatNumber: c.vatNumber,
          address: c.address,
          email: c.email,
        }))}
        initialRates={taxRates.map((t) => t.rate)}
        today={toDateInput(today)}
        defaultDueDate={toDateInput(
          addDays(today, invoice.business.paymentTermDays),
        )}
        numberPreview={invoice.number}
        invoice={{
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          language: invoice.language,
          notes: invoice.notes,
          issueDate: toDateInput(invoice.issueDate),
          dueDate: toDateInput(invoice.dueDate),
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          clientRegNumber: invoice.clientRegNumber,
          clientVatNumber: invoice.clientVatNumber,
          clientAddress: invoice.clientAddress,
          clientEmail: invoice.clientEmail,
          items: invoice.items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            amount: i.amount,
            amountMode: i.amountMode,
            taxRate: i.taxRate,
          })),
        }}
      />
    </div>
  );
}
