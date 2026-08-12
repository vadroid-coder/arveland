import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { invoiceFileName, zipFileName } from "@/lib/invoice";
import { InvoicePdf } from "./invoice-pdf";

/** An invoice with everything the document needs, scoped to the caller. */
export async function loadOwnedInvoices(where: {
  id?: string;
  businessId?: string;
  year?: number;
  month?: number;
}) {
  const user = await requireUser();
  return prisma.invoice.findMany({
    where: { ...where, business: { ownerId: user.uid } },
    include: { items: { orderBy: { sortNo: "asc" } }, business: true },
    orderBy: [{ year: "asc" }, { month: "asc" }, { seq: "asc" }],
  });
}

type Loaded = Awaited<ReturnType<typeof loadOwnedInvoices>>[number];

export async function renderInvoicePdf(invoice: Loaded): Promise<Buffer> {
  return renderToBuffer(
    <InvoicePdf business={invoice.business} invoice={invoice} />,
  );
}

export async function renderInvoicesZip(invoices: Loaded[]): Promise<Buffer> {
  const zip = new JSZip();
  const used = new Map<string, number>();

  for (const invoice of invoices) {
    let name = invoiceFileName(invoice);
    // Two businesses can share a number series; keep both files.
    const seen = used.get(name) ?? 0;
    used.set(name, seen + 1);
    if (seen > 0) name = name.replace(/\.pdf$/, `_${seen + 1}.pdf`);

    zip.file(name, await renderInvoicePdf(invoice));
  }

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export { invoiceFileName, zipFileName };
