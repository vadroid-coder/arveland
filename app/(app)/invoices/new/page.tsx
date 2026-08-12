import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveBusiness } from "@/lib/business";
import InvoiceEditor from "@/components/InvoiceEditor";
import EmptyBusiness from "@/components/EmptyBusiness";
import {
  addDays,
  buildInvoiceNumber,
  nextSequence,
  startOfDayUTC,
  toDateInput,
} from "@/lib/invoice";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const { active } = await getActiveBusiness();
  if (!active) return <EmptyBusiness />;

  const [clients, taxRates] = await Promise.all([
    prisma.client.findMany({
      where: { businessId: active.id },
      orderBy: { name: "asc" },
    }),
    prisma.taxRate.findMany({
      where: { businessId: active.id },
      orderBy: { rate: "asc" },
    }),
  ]);

  const today = startOfDayUTC(new Date());
  const seq = await nextSequence(
    active.id,
    today.getUTCFullYear(),
    today.getUTCMonth() + 1,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/" className="text-sm text-ink-500 hover:underline">
          ← Arved
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
          Uus arve
        </h1>
        <p className="text-sm text-ink-500">{active.name}</p>
      </div>

      <InvoiceEditor
        business={{
          id: active.id,
          name: active.name,
          currency: active.currency,
          paymentTermDays: active.paymentTermDays,
          invoicePrefix: active.invoicePrefix,
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
        defaultDueDate={toDateInput(addDays(today, active.paymentTermDays))}
        numberPreview={buildInvoiceNumber(
          active.invoicePrefix,
          today.getUTCFullYear(),
          today.getUTCMonth() + 1,
          seq,
        )}
      />
    </div>
  );
}
