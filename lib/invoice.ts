import { prisma } from "./prisma";

/** PREFIX-YY-M-NR, e.g. ARV-26-8-1 */
export function buildInvoiceNumber(
  prefix: string,
  year: number,
  month: number,
  seq: number,
) {
  const yy = String(year).slice(-2);
  return `${prefix}-${yy}-${month}-${seq}`;
}

export async function nextSequence(
  businessId: string,
  year: number,
  month: number,
) {
  const last = await prisma.invoice.findFirst({
    where: { businessId, year, month },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Parses a yyyy-mm-dd string into a UTC-noon Date so timezones never shift the day. */
export function parseDateInput(value: string | null | undefined): Date {
  if (!value) return startOfDayUTC(new Date());
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return startOfDayUTC(new Date());
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function startOfDayUTC(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0),
  );
}

export function toDateInput(date: Date) {
  return new Date(date).toISOString().slice(0, 10);
}

/** `locale` defaults to the admin panel's; the invoice document passes its own. */
export function formatDate(date: Date, locale = "ru-RU") {
  return new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function monthLabel(year: number, month: number) {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`;
}

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID";

export function effectiveStatus(invoice: {
  status: string;
  dueDate: Date;
}): "DRAFT" | "SENT" | "PAID" | "OVERDUE" {
  if (invoice.status === "PAID") return "PAID";
  if (invoice.status === "SENT" && new Date(invoice.dueDate) < new Date())
    return "OVERDUE";
  return invoice.status === "SENT" ? "SENT" : "DRAFT";
}
