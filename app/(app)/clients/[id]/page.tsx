import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ClientFields from "@/components/ClientFields";
import SubmitButton from "@/components/SubmitButton";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/invoice";
import { deleteClient, updateClient } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      invoices: { orderBy: { issueDate: "desc" }, take: 10 },
    },
  });
  if (!client) notFound();

  const update = updateClient.bind(null, id);
  const remove = deleteClient.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/clients" className="text-sm text-ink-500 hover:underline">
          ← Kliendid
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
          {client.name}
        </h1>
      </div>

      {error === "duplicate" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Selle registrikoodiga klient on juba olemas — avasin olemasoleva.
        </p>
      )}

      <form action={update} className="card space-y-5 p-5">
        <ClientFields client={client} />
        <div className="flex items-center gap-3">
          <SubmitButton className="btn btn-primary" pendingLabel="Salvestan…">
            Salvesta
          </SubmitButton>
          <Link href="/clients" className="btn btn-ghost">
            Katkesta
          </Link>
        </div>
      </form>

      <section className="card overflow-hidden">
        <h2 className="border-b border-ink-100 px-5 py-3 text-sm font-semibold text-ink-700">
          Viimased arved
        </h2>
        {client.invoices.length === 0 ? (
          <p className="p-6 text-sm text-ink-400">Arveid pole.</p>
        ) : (
          <ul className="divide-y divide-ink-50">
            {client.invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-5 py-2.5">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {inv.number}
                </Link>
                <span className="text-sm text-ink-500">
                  {formatDate(inv.issueDate)}
                </span>
                <span className="ml-auto text-sm font-medium tabular-nums">
                  {formatMoney(inv.total, inv.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card border-red-200 p-5">
        <form action={remove}>
          <SubmitButton
            className="btn btn-danger"
            confirm={`Kustutada klient "${client.name}"? Arved jäävad alles.`}
          >
            Kustuta klient
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
