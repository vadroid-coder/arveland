import { getSession } from "@/lib/auth";
import {
  invoiceFileName,
  loadOwnedInvoices,
  renderInvoicePdf,
} from "@/lib/pdf/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getSession())) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const [invoice] = await loadOwnedInvoices({ id });
  if (!invoice) return new Response("Not found", { status: 404 });

  const pdf = await renderInvoicePdf(invoice);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceFileName(invoice)}"`,
      "Cache-Control": "no-store",
    },
  });
}
