// Optional sample data: one business, two clients, a few invoices.
// Run with `npm run seed:demo`. Safe to re-run — it is a no-op if the
// demo business already exists.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PREFIX = "ARV";
const existing = await prisma.business.findFirst({
  where: { invoicePrefix: PREFIX },
});

if (existing) {
  console.log("[demo] sample business already present — nothing to do");
  await prisma.$disconnect();
  process.exit(0);
}

const business = await prisma.business.create({
  data: {
    name: "ArveMaa OÜ",
    regNumber: "16123456",
    vatNumber: "EE102345678",
    address: "Pärnu mnt 141\n11314 Tallinn\nEesti",
    email: "arved@arvemaa.ee",
    phone: "+372 5555 1234",
    website: "arvemaa.ee",
    invoicePrefix: PREFIX,
    paymentTermDays: 7,
    currency: "EUR",
    bankName: "LHV Pank",
    bankAccount: "EE95 7700 7710 0123 4567",
    bankSwift: "LHVBEE22",
    footerNote: "Viivis tasumisega viivitamisel 0,05% päevas.",
  },
});

await prisma.taxRate.createMany({
  data: [
    { businessId: business.id, rate: 24, label: "Standardmäär" },
    { businessId: business.id, rate: 9, label: "Vähendatud määr" },
    { businessId: business.id, rate: 0, label: "Maksuvaba" },
  ],
});

const clients = await Promise.all([
  prisma.client.create({
    data: {
      businessId: business.id,
      name: "Põhjala Ehitus OÜ",
      regNumber: "12345678",
      vatNumber: "EE101234567",
      address: "Tartu mnt 12\n10145 Tallinn",
      email: "raamatupidamine@pohjalaehitus.ee",
    },
  }),
  prisma.client.create({
    data: {
      businessId: business.id,
      name: "Nordic Design AS",
      regNumber: "87654321",
      vatNumber: "EE100765432",
      address: "Riia 8\n51004 Tartu",
      email: "info@nordicdesign.ee",
    },
  }),
]);

const now = new Date();

const samples = [
  {
    client: clients[0],
    monthOffset: -1,
    status: "PAID",
    items: [
      { description: "Konsultatsiooniteenus, august", quantity: 12, amount: 8500, amountMode: "NET", taxRate: 24 },
      { description: "Projektijuhtimine", quantity: 1, amount: 120000, amountMode: "NET", taxRate: 24 },
    ],
  },
  {
    client: clients[1],
    monthOffset: 0,
    status: "SENT",
    items: [
      { description: "Veebilehe kujundus", quantity: 1, amount: 246000, amountMode: "INCL", taxRate: 24 },
      { description: "Hostimine, 1 kuu", quantity: 1, amount: 2900, amountMode: "NET", taxRate: 9 },
    ],
  },
  {
    client: clients[0],
    monthOffset: 0,
    status: "DRAFT",
    items: [
      { description: "Täiendavad arendustööd", quantity: 6.5, amount: 9000, amountMode: "NET", taxRate: 24 },
    ],
  },
];

function computeLine({ quantity, amount, amountMode, taxRate }) {
  const raw = Math.round(amount * quantity);
  if (amountMode === "INCL") {
    const net = Math.round(raw / (1 + taxRate / 100));
    return { net, tax: raw - net, gross: raw };
  }
  const tax = Math.round((raw * taxRate) / 100);
  return { net: raw, tax, gross: raw + tax };
}

for (const sample of samples) {
  const issueDate = new Date(
    Date.UTC(now.getFullYear(), now.getMonth() + sample.monthOffset, 14, 12),
  );
  const dueDate = new Date(issueDate);
  dueDate.setUTCDate(dueDate.getUTCDate() + business.paymentTermDays);

  const year = issueDate.getUTCFullYear();
  const month = issueDate.getUTCMonth() + 1;
  const last = await prisma.invoice.findFirst({
    where: { businessId: business.id, year, month },
    orderBy: { seq: "desc" },
  });
  const seq = (last?.seq ?? 0) + 1;

  const lines = sample.items.map((item, index) => ({
    ...item,
    ...computeLine(item),
    sortNo: index,
  }));
  const subtotal = lines.reduce((s, l) => s + l.net, 0);
  const taxTotal = lines.reduce((s, l) => s + l.tax, 0);

  await prisma.invoice.create({
    data: {
      businessId: business.id,
      clientId: sample.client.id,
      clientName: sample.client.name,
      clientRegNumber: sample.client.regNumber,
      clientVatNumber: sample.client.vatNumber,
      clientAddress: sample.client.address,
      clientEmail: sample.client.email,
      number: `${PREFIX}-${String(year).slice(-2)}-${month}-${seq}`,
      seq,
      year,
      month,
      issueDate,
      dueDate,
      status: sample.status,
      paidAt: sample.status === "PAID" ? dueDate : null,
      currency: business.currency,
      subtotal,
      taxTotal,
      total: subtotal + taxTotal,
      items: { create: lines },
    },
  });
}

console.log("[demo] created sample business, clients and invoices");
await prisma.$disconnect();
