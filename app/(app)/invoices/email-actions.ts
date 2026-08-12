"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getT } from "@/lib/ui-language";
import {
  invoiceFileName,
  loadOwnedInvoices,
  renderInvoicePdf,
  renderInvoicesZip,
  zipFileName,
} from "@/lib/pdf/render";
import {
  mailerConfigured,
  monthInvoicesMail,
  sendMail,
  singleInvoiceMail,
} from "@/lib/email";

export type MailResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Invoices are only ever mailed back to their own company address — the one on
 * the business record. Nothing here takes a recipient from the client, so this
 * cannot be pointed at a third party.
 */
function recipientOf(business: { email: string | null }) {
  const email = business.email?.trim() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function emailInvoice(id: string): Promise<MailResult> {
  const session = await getSession();
  const t = await getT();
  if (!session) return { ok: false, error: t.mail.errAuth };
  if (!mailerConfigured()) return { ok: false, error: t.mail.errNotConfigured };

  const [invoice] = await loadOwnedInvoices({ id });
  if (!invoice) return { ok: false, error: t.invoice.errInvoice };

  const to = recipientOf(invoice.business);
  if (!to) return { ok: false, error: t.mail.errNoCompanyEmail };

  const pdf = await renderInvoicePdf(invoice);
  const { subject, html } = singleInvoiceMail(invoice);

  const result = await sendMail({
    to,
    subject,
    html,
    attachments: [{ filename: invoiceFileName(invoice), content: pdf }],
  });

  return result.ok
    ? { ok: true, message: t.mail.sentTo(to) }
    : { ok: false, error: result.error };
}

export async function emailMonth(
  businessId: string,
  year: number,
  month: number,
): Promise<MailResult> {
  const session = await getSession();
  const t = await getT();
  if (!session) return { ok: false, error: t.mail.errAuth };
  if (!mailerConfigured()) return { ok: false, error: t.mail.errNotConfigured };

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.uid },
  });
  if (!business) return { ok: false, error: t.invoice.errBusiness };

  const to = recipientOf(business);
  if (!to) return { ok: false, error: t.mail.errNoCompanyEmail };

  const invoices = await loadOwnedInvoices({ businessId, year, month });
  if (invoices.length === 0) return { ok: false, error: t.mail.errNothing };

  const zip = await renderInvoicesZip(invoices);
  const { subject, html } = monthInvoicesMail({
    language: business.defaultLanguage,
    period: `${t.months[month - 1]} ${year}`,
    count: invoices.length,
    businessName: business.name,
  });

  const result = await sendMail({
    to,
    subject,
    html,
    attachments: [
      {
        filename: zipFileName(business.invoicePrefix, year, month),
        content: zip,
      },
    ],
  });

  return result.ok
    ? { ok: true, message: t.mail.sentTo(to) }
    : { ok: false, error: result.error };
}
