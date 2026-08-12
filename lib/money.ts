/** Money is stored everywhere as integer cents. */

export function toCents(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === "") return 0;
  const normalized =
    typeof input === "number"
      ? String(input)
      : input.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatMoney(cents: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("et-EE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${fromCents(cents)} ${currency}`;
  }
}

export type LineInput = {
  quantity: number;
  amount: number; // cents per unit, as entered
  amountMode: "NET" | "INCL";
  taxRate: number; // percent
};

export type LineTotals = { net: number; tax: number; gross: number };

export function computeLine(line: LineInput): LineTotals {
  const qty = Number.isFinite(line.quantity) ? line.quantity : 1;
  const rate = Number.isFinite(line.taxRate) ? line.taxRate : 0;
  const raw = Math.round(line.amount * qty);

  if (line.amountMode === "INCL") {
    const gross = raw;
    const net = Math.round(gross / (1 + rate / 100));
    return { net, tax: gross - net, gross };
  }

  const net = raw;
  const tax = Math.round((net * rate) / 100);
  return { net, tax, gross: net + tax };
}

export function sumLines(lines: LineTotals[]) {
  return lines.reduce(
    (acc, l) => ({
      subtotal: acc.subtotal + l.net,
      taxTotal: acc.taxTotal + l.tax,
      total: acc.total + l.gross,
    }),
    { subtotal: 0, taxTotal: 0, total: 0 },
  );
}

/** Groups line taxes by rate — used for the tax breakdown on the document. */
export function taxBreakdown(
  lines: (LineTotals & { taxRate: number })[],
): { rate: number; net: number; tax: number }[] {
  const map = new Map<number, { rate: number; net: number; tax: number }>();
  for (const l of lines) {
    const bucket = map.get(l.taxRate) ?? { rate: l.taxRate, net: 0, tax: 0 };
    bucket.net += l.net;
    bucket.tax += l.tax;
    map.set(l.taxRate, bucket);
  }
  return [...map.values()].sort((a, b) => a.rate - b.rate);
}

export function formatRate(rate: number): string {
  return `${Number.isInteger(rate) ? rate : rate.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}%`;
}
