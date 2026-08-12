/**
 * The admin panel is in Russian; the invoice document itself is never. Each
 * invoice carries the language it is printed in, so a document can be handed
 * to an Estonian or an international client without changing anything else.
 */

export type DocLanguage = "ET" | "EN";

export const DOC_LANGUAGES: { value: DocLanguage; label: string }[] = [
  { value: "ET", label: "Эстонский" },
  { value: "EN", label: "Английский" },
];

export function asDocLanguage(value: string | null | undefined): DocLanguage {
  return value === "EN" ? "EN" : "ET";
}

type Strings = {
  locale: string;
  title: string;
  number: string;
  issueDate: string;
  dueDate: string;
  amountDue: string;
  payer: string;
  regNumber: string;
  vatNumber: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  lineNet: string;
  lineTotal: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentDetails: string;
  beneficiary: string;
  bank: string;
  account: string;
  swift: string;
  reference: string;
  amount: string;
  emailSubject: (number: string, company: string) => string;
  emailMonthSubject: (period: string, company: string) => string;
  emailGreeting: string;
  emailIntro: (company: string) => string;
  emailMonthIntro: (company: string, count: number) => string;
  emailRegards: string;
};

const ET: Strings = {
  locale: "et-EE",
  title: "ARVE",
  number: "Arve nr",
  issueDate: "Kuupäev",
  dueDate: "Maksetähtaeg",
  amountDue: "Tasuda",
  payer: "Maksja",
  regNumber: "Registrikood",
  vatNumber: "KMKR nr",
  description: "Kirjeldus",
  quantity: "Kogus",
  unitPrice: "Hind",
  taxRate: "KM %",
  lineNet: "Summa",
  lineTotal: "Kokku",
  subtotal: "Summa ilma käibemaksuta",
  tax: "Käibemaks",
  total: "Kokku tasuda",
  paymentDetails: "Makse rekvisiidid",
  beneficiary: "Saaja",
  bank: "Pank",
  account: "Arvelduskonto (IBAN)",
  swift: "SWIFT / BIC",
  reference: "Selgitus",
  amount: "Summa",
  emailSubject: (number, company) => `Arve ${number} — ${company}`,
  emailMonthSubject: (period, company) => `Arved ${period} — ${company}`,
  emailGreeting: "Tere!",
  emailIntro: (company) => `Manuses on arve ettevõttelt ${company}.`,
  emailMonthIntro: (company, count) =>
    `Manuses on ${count} arvet ettevõttelt ${company}.`,
  emailRegards: "Parimate soovidega",
};

const EN: Strings = {
  locale: "en-GB",
  title: "INVOICE",
  number: "Invoice no.",
  issueDate: "Date",
  dueDate: "Due date",
  amountDue: "Amount due",
  payer: "Bill to",
  regNumber: "Reg. no.",
  vatNumber: "VAT no.",
  description: "Description",
  quantity: "Qty",
  unitPrice: "Price",
  taxRate: "VAT %",
  lineNet: "Net",
  lineTotal: "Total",
  subtotal: "Subtotal excl. VAT",
  tax: "VAT",
  total: "Total due",
  paymentDetails: "Payment details",
  beneficiary: "Beneficiary",
  bank: "Bank",
  account: "Account (IBAN)",
  swift: "SWIFT / BIC",
  reference: "Reference",
  amount: "Amount",
  emailSubject: (number, company) => `Invoice ${number} from ${company}`,
  emailMonthSubject: (period, company) => `Invoices ${period} from ${company}`,
  emailGreeting: "Hello,",
  emailIntro: (company) => `Please find attached your invoice from ${company}.`,
  emailMonthIntro: (company, count) =>
    `Please find attached ${count} invoices from ${company}.`,
  emailRegards: "Kind regards",
};

export function docStrings(language: string | null | undefined): Strings {
  return asDocLanguage(language) === "EN" ? EN : ET;
}
