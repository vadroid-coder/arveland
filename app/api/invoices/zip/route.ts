import { getSession } from "@/lib/auth";
import { loadOwnedInvoices, renderInvoicesZip, zipFileName } from "@/lib/pdf/render";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** All invoices of one month of one business, zipped. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const businessId = url.searchParams.get("businessId") ?? "";
  const year = Number(url.searchParams.get("year"));
  const month = Number(url.searchParams.get("month"));

  if (!businessId || !year || !month)
    return new Response("Bad request", { status: 400 });

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.uid },
  });
  if (!business) return new Response("Not found", { status: 404 });

  const invoices = await loadOwnedInvoices({ businessId, year, month });
  if (invoices.length === 0) return new Response("Not found", { status: 404 });

  const zip = await renderInvoicesZip(invoices);
  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFileName(business.invoicePrefix, year, month)}"`,
      "Cache-Control": "no-store",
    },
  });
}
