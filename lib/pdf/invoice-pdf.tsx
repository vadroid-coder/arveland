import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatMoney, formatRate, taxBreakdown } from "@/lib/money";
import { formatDate } from "@/lib/invoice";
import { docStrings } from "@/lib/doc-language";

// Noto Sans covers Estonian (š, ž, õ, ä, ö, ü) and Cyrillic, so a note typed in
// Russian on an Estonian invoice still renders instead of turning into boxes.
const fontDir = path.join(process.cwd(), "assets", "fonts");
Font.register({
  family: "NotoSans",
  fonts: [
    { src: path.join(fontDir, "NotoSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(fontDir, "NotoSans-Bold.ttf"), fontWeight: 700 },
  ],
});
// Without this react-pdf hyphenates aggressively mid-word.
Font.registerHyphenationCallback((word) => [word]);

const INK = "#14171f";
const MUTED = "#4b5265";
const FAINT = "#666e82";
const LINE = "#eceef2";

const s = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 9.5,
    lineHeight: 1.5,
    color: INK,
    paddingTop: 45,
    paddingBottom: 45,
    paddingHorizontal: 42,
  },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 24 },
  sellerBlock: { width: "55%" },
  logo: { maxHeight: 46, maxWidth: 150, marginBottom: 12, objectFit: "contain" },
  sellerName: { fontSize: 13, fontWeight: 700, marginBottom: 3 },
  muted: { fontSize: 8.5, color: MUTED },
  headRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 20, fontWeight: 700, lineHeight: 1.15 },
  docNumber: { fontSize: 12, fontWeight: 700, lineHeight: 1.2, marginTop: 5 },
  metaRow: { flexDirection: "row", marginTop: 3 },
  metaLabel: { fontSize: 9, color: FAINT, textAlign: "right", marginRight: 10 },
  metaValue: { fontSize: 9, fontWeight: 700, textAlign: "right", minWidth: 70 },
  sectionLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: "#8d94a5",
    textTransform: "uppercase",
  },
  buyer: { marginTop: 28, borderTopWidth: 1, borderTopColor: "#dcdfe6", paddingTop: 12 },
  buyerName: { fontSize: 11, fontWeight: 700, marginTop: 3 },
  table: { marginTop: 24 },
  th: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: INK,
    paddingBottom: 4,
  },
  thText: {
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: MUTED,
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
    paddingVertical: 6,
  },
  cDesc: { flex: 1, paddingRight: 6 },
  cQty: { width: 42, textAlign: "right", paddingHorizontal: 4 },
  cPrice: { width: 66, textAlign: "right", paddingHorizontal: 4 },
  cRate: { width: 40, textAlign: "right", paddingHorizontal: 4 },
  cNet: { width: 66, textAlign: "right", paddingHorizontal: 4 },
  cTotal: { width: 76, textAlign: "right", paddingLeft: 6 },
  totals: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  totalsTable: { width: 215 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderTopColor: INK,
    paddingTop: 6,
    marginTop: 3,
  },
  grandText: { fontSize: 11, fontWeight: 700 },
  payment: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: INK,
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  payGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  payCell: {
    width: "50%",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
    paddingBottom: 3,
    paddingRight: 14,
    marginBottom: 5,
  },
  footer: { marginTop: 20, fontSize: 8, color: FAINT },
});

export type PdfBusiness = {
  name: string;
  regNumber: string | null;
  vatNumber: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo: string | null;
  bankName: string | null;
  bankAccount: string | null;
  bankSwift: string | null;
  footerNote: string | null;
};

export type PdfInvoice = {
  number: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  language: string;
  notes: string | null;
  subtotal: number;
  total: number;
  clientName: string;
  clientRegNumber: string;
  clientVatNumber: string | null;
  clientAddress: string | null;
  clientEmail: string | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    taxRate: number;
    net: number;
    gross: number;
    tax: number;
  }[];
};

export function InvoicePdf({
  business,
  invoice,
}: {
  business: PdfBusiness;
  invoice: PdfInvoice;
}) {
  const t = docStrings(invoice.language);
  const money = (c: number) => formatMoney(c, invoice.currency, t.locale);
  const date = (d: Date) => formatDate(d, t.locale);
  const breakdown = taxBreakdown(invoice.items);

  return (
    <Document title={invoice.number} author={business.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.sellerBlock}>
            {business.logo ? <Image src={business.logo} style={s.logo} /> : null}
            <Text style={s.sellerName}>{business.name}</Text>
            {business.regNumber ? (
              <Text style={s.muted}>
                {t.regNumber}: {business.regNumber}
              </Text>
            ) : null}
            {business.vatNumber ? (
              <Text style={s.muted}>
                {t.vatNumber}: {business.vatNumber}
              </Text>
            ) : null}
            {business.address ? <Text style={s.muted}>{business.address}</Text> : null}
            {business.email ? <Text style={s.muted}>{business.email}</Text> : null}
            {business.phone ? <Text style={s.muted}>{business.phone}</Text> : null}
            {business.website ? <Text style={s.muted}>{business.website}</Text> : null}
          </View>

          <View style={s.headRight}>
            <Text style={s.docTitle}>{t.title}</Text>
            <Text style={s.docNumber}>{invoice.number}</Text>
            <View style={{ marginTop: 12 }}>
              <Meta label={t.issueDate} value={date(invoice.issueDate)} />
              <Meta label={t.dueDate} value={date(invoice.dueDate)} />
              <Meta label={t.amountDue} value={money(invoice.total)} />
            </View>
          </View>
        </View>

        <View style={s.buyer}>
          <Text style={s.sectionLabel}>{t.payer}</Text>
          <Text style={s.buyerName}>{invoice.clientName}</Text>
          <Text style={s.muted}>
            {t.regNumber}: {invoice.clientRegNumber}
          </Text>
          {invoice.clientVatNumber ? (
            <Text style={s.muted}>
              {t.vatNumber}: {invoice.clientVatNumber}
            </Text>
          ) : null}
          {invoice.clientAddress ? (
            <Text style={s.muted}>{invoice.clientAddress}</Text>
          ) : null}
          {invoice.clientEmail ? (
            <Text style={s.muted}>{invoice.clientEmail}</Text>
          ) : null}
        </View>

        <View style={s.table}>
          <View style={s.th} fixed>
            <Text style={[s.thText, s.cDesc]}>{t.description}</Text>
            <Text style={[s.thText, s.cQty]}>{t.quantity}</Text>
            <Text style={[s.thText, s.cPrice]}>{t.unitPrice}</Text>
            <Text style={[s.thText, s.cRate]}>{t.taxRate}</Text>
            <Text style={[s.thText, s.cNet]}>{t.lineNet}</Text>
            <Text style={[s.thText, s.cTotal]}>{t.lineTotal}</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={s.tr} wrap={false}>
              <Text style={s.cDesc}>{item.description}</Text>
              <Text style={s.cQty}>{formatQty(item.quantity)}</Text>
              <Text style={s.cPrice}>
                {money(Math.round(item.net / (item.quantity || 1)))}
              </Text>
              <Text style={s.cRate}>{formatRate(item.taxRate)}</Text>
              <Text style={s.cNet}>{money(item.net)}</Text>
              <Text style={[s.cTotal, { fontWeight: 700 }]}>
                {money(item.gross)}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalsTable}>
            <View style={s.totalsRow}>
              <Text style={{ color: MUTED }}>{t.subtotal}</Text>
              <Text>{money(invoice.subtotal)}</Text>
            </View>
            {breakdown.map((b) => (
              <View key={b.rate} style={s.totalsRow}>
                <Text style={{ color: MUTED }}>
                  {t.tax} {formatRate(b.rate)}
                </Text>
                <Text>{money(b.tax)}</Text>
              </View>
            ))}
            <View style={s.totalsGrand}>
              <Text style={s.grandText}>{t.total}</Text>
              <Text style={s.grandText}>{money(invoice.total)}</Text>
            </View>
          </View>
        </View>

        <View style={s.payment} wrap={false}>
          <Text style={[s.sectionLabel, { color: MUTED }]}>
            {t.paymentDetails}
          </Text>
          <View style={s.payGrid}>
            <PayCell label={t.beneficiary} value={business.name} strong />
            <PayCell label={t.bank} value={business.bankName} />
            <PayCell label={t.account} value={business.bankAccount} strong />
            <PayCell label={t.swift} value={business.bankSwift} />
            <PayCell label={t.reference} value={invoice.number} strong />
            <PayCell label={t.amount} value={money(invoice.total)} strong />
          </View>
        </View>

        {invoice.notes || business.footerNote ? (
          <View style={s.footer}>
            {invoice.notes ? <Text>{invoice.notes}</Text> : null}
            {business.footerNote ? <Text>{business.footerNote}</Text> : null}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

function PayCell({
  label,
  value,
  strong,
}: {
  label: string;
  value: string | null;
  strong?: boolean;
}) {
  if (!value) return null;
  return (
    <View style={s.payCell}>
      <Text style={{ color: FAINT }}>{label}</Text>
      <Text style={strong ? { fontWeight: 700 } : undefined}>{value}</Text>
    </View>
  );
}

function formatQty(q: number) {
  return Number.isInteger(q) ? String(q) : q.toFixed(2);
}
