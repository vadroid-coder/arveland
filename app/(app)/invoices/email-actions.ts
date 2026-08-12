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

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** One invoice, attached as a single PDF. */
export async function emailInvoice(id: string, to: string): Promise<MailResult> {
  const session = await getSession();
  const t = await getT();
  if (!session) return { ok: false, error: t.mail.errAuth };
  if (!mailerConfigured()) return { ok: false, error: t.mail.errNotConfigured };

  const recipient = to.trim();
  if (!validEmail(recipient)) return { ok: false, error: t.mail.errRecipient };

  const [invoice] = await loadOwnedInvoices({ id });
  if (!invoice) return { ok: false, error: t.invoice.errInvoice };

  const pdf = await renderInvoicePdf(invoice);
  const { subject, html } = singleInvoiceMail(invoice);

  const result = await sendMail({
    to: recipient,
    subject,
    html,
    attachments: [{ filename: invoiceFileName(invoice), content: pdf }],
  });

  return result.ok
    ? { ok: true, message: t.mail.sentTo(recipient) }
    : { ok: false, error: result.error };
}

/** A whole month, attached as one ZIP. */
export async function emailMonth(
  businessId: string,
  year: number,
  month: number,
  to: string,
): Promise<MailResult> {
  const session = await getSession();
  const t = await getT();
  if (!session) return { ok: false, error: t.mail.errAuth };
  if (!mailerConfigured()) return { ok: false, error: t.mail.errNotConfigured };

  const recipient = to.trim();
  if (!validEmail(recipient)) return { ok: false, error: t.mail.errRecipient };

  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId: session.uid },
  });
  if (!business) return { ok: false, error: t.invoice.errBusiness };

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
    to: recipient,
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
    ? { ok: true, message: t.mail.sentTo(recipient) }
    : { ok: false, error: result.error };
}
