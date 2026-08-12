import "server-only";
import { Resend } from "resend";
import { docStrings } from "./doc-language";
import { formatMoney } from "./money";
import { formatDate } from "./invoice";

export type MailAttachment = { filename: string; content: Buffer };

export function mailerConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.SENDER_EMAIL);
}

function sender() {
  const email = process.env.SENDER_EMAIL!;
  const name = process.env.SENDER_NAME?.trim();
  return name ? `${name} <${email}>` : email;
}

export async function sendMail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments: MailAttachment[];
}) {
  if (!mailerConfigured())
    return { ok: false as const, error: "RESEND_API_KEY / SENDER_EMAIL not set" };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: sender(),
    to,
    subject,
    html,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
    })),
  });

  if (error) {
    console.error("[sendMail]", error);
    return { ok: false as const, error: error.message ?? "Send failed" };
  }
  return { ok: true as const };
}

const wrap = (lines: string[]) =>
  `<div style="font-family:ui-sans-serif,system-ui,Arial,sans-serif;font-size:14px;line-height:1.6;color:#232833">${lines
    .map((l) => `<p style="margin:0 0 12px">${l}</p>`)
    .join("")}</div>`;

/** Body text follows the invoice's own language — it is read by the client. */
export function singleInvoiceMail(invoice: {
  number: string;
  language: string;
  currency: string;
  total: number;
  dueDate: Date;
  business: { name: string };
}) {
  const t = docStrings(invoice.language);
  return {
    subject: t.emailSubject(invoice.number, invoice.business.name),
    html: wrap([
      t.emailGreeting,
      t.emailIntro(invoice.business.name),
      `<strong>${t.number}:</strong> ${invoice.number}<br>` +
        `<strong>${t.dueDate}:</strong> ${formatDate(invoice.dueDate, t.locale)}<br>` +
        `<strong>${t.total}:</strong> ${formatMoney(invoice.total, invoice.currency, t.locale)}`,
      `${t.emailRegards},<br>${invoice.business.name}`,
    ]),
  };
}

export function monthInvoicesMail(options: {
  language: string;
  period: string;
  count: number;
  businessName: string;
}) {
  const t = docStrings(options.language);
  return {
    subject: t.emailMonthSubject(options.period, options.businessName),
    html: wrap([
      t.emailGreeting,
      t.emailMonthIntro(options.businessName, options.count),
      `${t.emailRegards},<br>${options.businessName}`,
    ]),
  };
}
