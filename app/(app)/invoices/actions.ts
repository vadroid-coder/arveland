"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ownedBusiness, ownedInvoice } from "@/lib/guard";
import { getT } from "@/lib/ui-language";
import { computeLine, sumLines, toCents } from "@/lib/money";
import { buildInvoiceNumber, nextSequence, parseDateInput } from "@/lib/invoice";

export type ItemPayload = {
  description: string;
  quantity: string;
  amount: string;
  amountMode: "NET" | "INCL";
  taxRate: string;
};

export type InvoicePayload = {
  id?: string;
  businessId: string;
  clientId: string | null;
  client: {
    name: string;
    regNumber: string;
    vatNumber: string;
    address: string;
    email: string;
  };
  saveClient: boolean;
  issueDate: string;
  dueDate: string;
  /** Empty means "keep generating it"; a value is an explicit override. */
  number: string;
  status: string;
  language: string;
  notes: string;
  items: ItemPayload[];
};

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

function num(value: string, fallback = 0) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export async function saveInvoice(payload: InvoicePayload): Promise<SaveResult> {
  const t = await getT();
  const business = await ownedBusiness(payload.businessId);
  if (!business) return { ok: false, error: t.invoice.errBusiness };

  if (payload.id && !(await ownedInvoice(payload.id)))
    return { ok: false, error: t.invoice.errInvoice };

  const rawItems = payload.items.filter(
    (i) => i.description.trim() !== "" || toCents(i.amount) !== 0,
  );
  if (rawItems.length === 0)
    return { ok: false, error: t.invoice.errNoLines };

  // --- client -------------------------------------------------------------
  let clientId = payload.clientId;
  let snapshot = {
    name: payload.client.name.trim(),
    regNumber: payload.client.regNumber.trim(),
    vatNumber: payload.client.vatNumber.trim() || null,
    address: payload.client.address.trim() || null,
    email: payload.client.email.trim() || null,
  };

  if (clientId) {
    const existing = await prisma.client.findFirst({
      where: { id: clientId, businessId: business.id },
    });
    if (!existing) return { ok: false, error: t.invoice.errClient };
    snapshot = {
      name: existing.name,
      regNumber: existing.regNumber,
      vatNumber: existing.vatNumber,
      address: existing.address,
      email: existing.email,
    };
  } else {
    if (!snapshot.name || !snapshot.regNumber)
      return {
        ok: false,
        error: t.invoice.errClientRequired,
      };

    if (payload.saveClient) {
      const created = await prisma.client.upsert({
        where: {
          businessId_regNumber: {
            businessId: business.id,
            regNumber: snapshot.regNumber,
          },
        },
        update: {
          name: snapshot.name,
          vatNumber: snapshot.vatNumber,
          address: snapshot.address,
          email: snapshot.email,
        },
        create: { ...snapshot, businessId: business.id },
      });
      clientId = created.id;
    }
  }

  // --- tax rates: remember every rate used, without duplicates -------------
  const usedRates = [...new Set(rawItems.map((i) => num(i.taxRate)))];
  for (const rate of usedRates) {
    if (rate < 0) continue;
    await prisma.taxRate.upsert({
      where: { businessId_rate: { businessId: business.id, rate } },
      update: {},
      create: { businessId: business.id, rate },
    });
  }

  // --- totals (always recomputed on the server) ---------------------------
  const lines = rawItems.map((i, index) => {
    const quantity = num(i.quantity, 1) || 1;
    const amount = toCents(i.amount);
    const taxRate = num(i.taxRate);
    const totals = computeLine({
      quantity,
      amount,
      amountMode: i.amountMode === "INCL" ? "INCL" : "NET",
      taxRate,
    });
    return {
      description: i.description.trim() || "—",
      quantity,
      amount,
      amountMode: i.amountMode === "INCL" ? "INCL" : "NET",
      taxRate,
      ...totals,
      sortNo: index,
    };
  });
  const { subtotal, taxTotal, total } = sumLines(lines);

  const issueDate = parseDateInput(payload.issueDate);
  const dueDate = parseDateInput(payload.dueDate);
  const year = issueDate.getUTCFullYear();
  const month = issueDate.getUTCMonth() + 1;
  const status = ["DRAFT", "SENT", "PAID"].includes(payload.status)
    ? payload.status
    : "DRAFT";
  const customNumber = payload.number.trim();

  const base = {
    clientId,
    clientName: snapshot.name,
    clientRegNumber: snapshot.regNumber,
    clientVatNumber: snapshot.vatNumber,
    clientAddress: snapshot.address,
    clientEmail: snapshot.email,
    issueDate,
    dueDate,
    status,
    paidAt: status === "PAID" ? new Date() : null,
    currency: business.currency,
    language: payload.language === "EN" ? "EN" : "ET",
    notes: payload.notes.trim() || null,
    subtotal,
    taxTotal,
    total,
  };

  try {
    if (payload.id) {
      const current = await prisma.invoice.findUnique({
        where: { id: payload.id },
      });
      if (!current) return { ok: false, error: t.invoice.errInvoice };

      // An edited number wins; otherwise a draft moved into another month gets
      // a fresh number for that month.
      let numbering = {};
      if (customNumber && customNumber !== current.number) {
        numbering = { number: customNumber };
      } else if (
        current.status === "DRAFT" &&
        (current.year !== year || current.month !== month)
      ) {
        const seq = await nextSequence(business.id, year, month);
        numbering = {
          year,
          month,
          seq,
          number: buildInvoiceNumber(business.invoicePrefix, year, month, seq),
        };
      }

      await prisma.$transaction([
        prisma.invoiceItem.deleteMany({ where: { invoiceId: payload.id } }),
        prisma.invoice.update({
          where: { id: payload.id },
          data: {
            ...base,
            ...numbering,
            paidAt:
              status === "PAID" ? (current.paidAt ?? new Date()) : null,
            items: { create: lines },
          },
        }),
      ]);

      revalidatePath("/");
      return { ok: true, id: payload.id };
    }

    const seq = await nextSequence(business.id, year, month);
    const invoice = await prisma.invoice.create({
      data: {
        ...base,
        businessId: business.id,
        year,
        month,
        seq,
        number:
          customNumber ||
          buildInvoiceNumber(business.invoicePrefix, year, month, seq),
        items: { create: lines },
      },
    });

    revalidatePath("/");
    return { ok: true, id: invoice.id };
  } catch (err) {
    // The (businessId, number) unique index is what catches a clashing manual number.
    if ((err as { code?: string })?.code === "P2002")
      return { ok: false, error: t.invoice.errNumberTaken };
    console.error("[saveInvoice]", err);
    return { ok: false, error: t.invoice.errSave };
  }
}

export async function setInvoiceStatus(id: string, status: string) {
  if (!(await ownedInvoice(id))) redirect("/");

  await prisma.invoice.update({
    where: { id },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
  });
  revalidatePath("/");
  revalidatePath(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  if (!(await ownedInvoice(id))) redirect("/");

  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function duplicateInvoice(id: string) {
  if (!(await ownedInvoice(id))) redirect("/");

  const src = await prisma.invoice.findUniqueOrThrow({
    where: { id },
    include: { items: { orderBy: { sortNo: "asc" } }, business: true },
  });

  const issueDate = new Date();
  const year = issueDate.getFullYear();
  const month = issueDate.getMonth() + 1;
  const seq = await nextSequence(src.businessId, year, month);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + src.business.paymentTermDays);

  const copy = await prisma.invoice.create({
    data: {
      businessId: src.businessId,
      clientId: src.clientId,
      clientName: src.clientName,
      clientRegNumber: src.clientRegNumber,
      clientVatNumber: src.clientVatNumber,
      clientAddress: src.clientAddress,
      clientEmail: src.clientEmail,
      number: buildInvoiceNumber(src.business.invoicePrefix, year, month, seq),
      seq,
      year,
      month,
      issueDate,
      dueDate,
      status: "DRAFT",
      currency: src.currency,
      language: src.language,
      notes: src.notes,
      subtotal: src.subtotal,
      taxTotal: src.taxTotal,
      total: src.total,
      items: {
        create: src.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          amount: i.amount,
          amountMode: i.amountMode,
          taxRate: i.taxRate,
          net: i.net,
          tax: i.tax,
          gross: i.gross,
          sortNo: i.sortNo,
        })),
      },
    },
  });

  revalidatePath("/");
  redirect(`/invoices/${copy.id}/edit`);
}
