"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientPicker, {
  emptyDraft,
  type ClientDraft,
  type ClientOption,
} from "./ClientPicker";
import TaxRateSelect from "./TaxRateSelect";
import {
  computeLine,
  formatMoney,
  formatRate,
  sumLines,
  taxBreakdown,
  toCents,
} from "@/lib/money";
import { DOC_LANGUAGES } from "@/lib/doc-language";
import { saveInvoice, type InvoicePayload } from "@/app/(app)/invoices/actions";

type Line = {
  key: string;
  description: string;
  quantity: string;
  amount: string;
  amountMode: "NET" | "INCL";
  taxRate: string;
};

export type EditorInvoice = {
  id: string;
  number: string;
  status: string;
  language: string;
  notes: string | null;
  issueDate: string;
  dueDate: string;
  clientId: string | null;
  clientName: string;
  clientRegNumber: string;
  clientVatNumber: string | null;
  clientAddress: string | null;
  clientEmail: string | null;
  items: {
    description: string;
    quantity: number;
    amount: number;
    amountMode: string;
    taxRate: number;
  }[];
};

let uid = 0;
const nextKey = () => `line-${++uid}`;

function blankLine(taxRate: string): Line {
  return {
    key: nextKey(),
    description: "",
    quantity: "1",
    amount: "",
    amountMode: "NET",
    taxRate,
  };
}

export default function InvoiceEditor({
  business,
  clients,
  initialRates,
  today,
  defaultDueDate,
  numberPreview,
  invoice,
}: {
  business: {
    id: string;
    name: string;
    currency: string;
    paymentTermDays: number;
    invoicePrefix: string;
    defaultLanguage: string;
  };
  clients: ClientOption[];
  initialRates: number[];
  today: string;
  defaultDueDate: string;
  numberPreview: string;
  invoice?: EditorInvoice;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [rates, setRates] = useState<number[]>(() =>
    [...new Set(initialRates)].sort((a, b) => a - b),
  );
  const defaultRate = String(rates[0] ?? 0);

  const [clientId, setClientId] = useState<string | null>(
    invoice?.clientId ?? null,
  );
  const [draft, setDraft] = useState<ClientDraft>(
    invoice && !invoice.clientId
      ? {
          name: invoice.clientName,
          regNumber: invoice.clientRegNumber,
          vatNumber: invoice.clientVatNumber ?? "",
          address: invoice.clientAddress ?? "",
          email: invoice.clientEmail ?? "",
        }
      : emptyDraft,
  );
  const [saveClient, setSaveClient] = useState(true);

  const [issueDate, setIssueDate] = useState(invoice?.issueDate ?? today);
  const [dueDate, setDueDate] = useState(invoice?.dueDate ?? defaultDueDate);
  const [dueTouched, setDueTouched] = useState(Boolean(invoice));
  const [status, setStatus] = useState(invoice?.status ?? "DRAFT");
  const [language, setLanguage] = useState(
    invoice?.language ?? business.defaultLanguage ?? "ET",
  );
  const [notes, setNotes] = useState(invoice?.notes ?? "");

  const [lines, setLines] = useState<Line[]>(() =>
    invoice && invoice.items.length > 0
      ? invoice.items.map((i) => ({
          key: nextKey(),
          description: i.description,
          quantity: String(i.quantity),
          amount: (i.amount / 100).toFixed(2),
          amountMode: i.amountMode === "INCL" ? "INCL" : "NET",
          taxRate: String(i.taxRate),
        }))
      : [blankLine(String(initialRates[0] ?? 0))],
  );

  function patchLine(key: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addRate(rate: number) {
    setRates((rs) =>
      rs.includes(rate) ? rs : [...rs, rate].sort((a, b) => a - b),
    );
  }

  function onIssueDateChange(value: string) {
    setIssueDate(value);
    if (!dueTouched && value) {
      const d = new Date(value + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() + business.paymentTermDays);
      setDueDate(d.toISOString().slice(0, 10));
    }
  }

  const computed = useMemo(
    () =>
      lines.map((l) => ({
        ...computeLine({
          quantity: Number(l.quantity.replace(",", ".")) || 0,
          amount: toCents(l.amount),
          amountMode: l.amountMode,
          taxRate: Number(l.taxRate.replace(",", ".")) || 0,
        }),
        taxRate: Number(l.taxRate.replace(",", ".")) || 0,
      })),
    [lines],
  );
  const totals = sumLines(computed);
  const breakdown = taxBreakdown(computed);

  function submit() {
    setError("");
    const payload: InvoicePayload = {
      id: invoice?.id,
      businessId: business.id,
      clientId,
      client: draft,
      saveClient,
      issueDate,
      dueDate,
      status,
      language,
      notes,
      items: lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        amount: l.amount,
        amountMode: l.amountMode,
        taxRate: l.taxRate,
      })),
    };

    startTransition(async () => {
      const result = await saveInvoice(payload);
      if (result.ok) router.push(`/invoices/${result.id}`);
      else setError(result.error);
    });
  }

  const clientReady = clientId
    ? true
    : draft.name.trim() !== "" && draft.regNumber.trim() !== "";

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-700">Клиент</h2>
          <Link href="/clients" className="text-xs text-brand-600 hover:underline">
            Управление клиентами
          </Link>
        </div>
        <ClientPicker
          clients={clients}
          clientId={clientId}
          draft={draft}
          saveClient={saveClient}
          onSelect={(c) => setClientId(c?.id ?? null)}
          onDraft={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          onSaveClient={setSaveClient}
        />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">
          Данные счёта
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label">Номер счёта</label>
            <input
              className="field bg-ink-50 font-medium"
              value={invoice?.number ?? numberPreview}
              readOnly
            />
            {!invoice && (
              <p className="mt-1 text-xs text-ink-400">
                Присваивается при сохранении
              </p>
            )}
          </div>
          <div>
            <label className="label">Дата выставления</label>
            <input
              type="date"
              className="field"
              value={issueDate}
              onChange={(e) => onIssueDateChange(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Срок оплаты</label>
            <input
              type="date"
              className="field"
              value={dueDate}
              onChange={(e) => {
                setDueTouched(true);
                setDueDate(e.target.value);
              }}
            />
            {!dueTouched && (
              <p className="mt-1 text-xs text-ink-400">
                +{business.paymentTermDays} дн.
              </p>
            )}
          </div>
          <div>
            <label className="label">Язык документа</label>
            <select
              className="field"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {DOC_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-400">Только на печати</p>
          </div>
          <div>
            <label className="label">Статус</label>
            <select
              className="field"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="DRAFT">Черновик</option>
              <option value="SENT">Отправлен</option>
              <option value="PAID">Оплачен</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card overflow-visible p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-700">Позиции</h2>

        <div className="space-y-2">
          <div className="hidden gap-2 px-1 text-xs tracking-wide text-ink-400 uppercase lg:grid lg:grid-cols-[1fr_5rem_8rem_7rem_6rem_8rem_2rem]">
            <span>Наименование</span>
            <span className="text-right">Кол-во</span>
            <span className="text-right">Сумма</span>
            <span className="text-center">Режим</span>
            <span className="text-right">Налог</span>
            <span className="text-right">Итого</span>
            <span />
          </div>

          {lines.map((line, index) => {
            const c = computed[index];
            return (
              <div
                key={line.key}
                className="grid items-start gap-2 rounded-lg border border-ink-100 p-2 lg:grid-cols-[1fr_5rem_8rem_7rem_6rem_8rem_2rem] lg:border-0 lg:p-0"
              >
                <input
                  className="field"
                  placeholder="Название услуги или товара"
                  value={line.description}
                  onChange={(e) =>
                    patchLine(line.key, { description: e.target.value })
                  }
                />
                <input
                  className="field text-right tabular-nums"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(e) =>
                    patchLine(line.key, { quantity: e.target.value })
                  }
                />
                <input
                  className="field text-right tabular-nums"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={line.amount}
                  onChange={(e) =>
                    patchLine(line.key, { amount: e.target.value })
                  }
                />
                <ModeToggle
                  value={line.amountMode}
                  onChange={(m) => patchLine(line.key, { amountMode: m })}
                />
                <TaxRateSelect
                  value={line.taxRate}
                  rates={rates}
                  onChange={(v) => patchLine(line.key, { taxRate: v })}
                  onCreate={addRate}
                />
                <div className="flex h-9 items-center justify-end px-1 text-sm font-medium tabular-nums text-ink-800">
                  {formatMoney(c.gross, business.currency)}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLines((ls) =>
                      ls.length === 1
                        ? [blankLine(defaultRate)]
                        : ls.filter((l) => l.key !== line.key),
                    )
                  }
                  className="grid h-9 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Удалить строку"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn-ghost mt-3"
          onClick={() => setLines((ls) => [...ls, blankLine(defaultRate)])}
        >
          + Добавить строку
        </button>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Сумма без налога</dt>
              <dd className="tabular-nums">
                {formatMoney(totals.subtotal, business.currency)}
              </dd>
            </div>
            {breakdown.map((b) => (
              <div key={b.rate} className="flex justify-between">
                <dt className="text-ink-500">Налог {formatRate(b.rate)}</dt>
                <dd className="tabular-nums">
                  {formatMoney(b.tax, business.currency)}
                </dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-ink-200 pt-2 text-base font-semibold">
              <dt>Итого</dt>
              <dd className="tabular-nums">
                {formatMoney(totals.total, business.currency)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="card p-5">
        <label className="label">Примечание на счёте</label>
        <textarea
          rows={3}
          className="field"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Свободный текст в конце документа — печатается как есть, на языке, на котором вы его напишете"
        />
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-ink-200 bg-ink-50/90 py-3 backdrop-blur">
        <button
          type="button"
          className="btn btn-primary"
          onClick={submit}
          disabled={pending || !clientReady}
        >
          {pending
            ? "Сохраняю…"
            : invoice
              ? "Сохранить изменения"
              : "Создать счёт"}
        </button>
        <Link
          href={invoice ? `/invoices/${invoice.id}` : "/"}
          className="btn btn-ghost"
        >
          Отмена
        </Link>
        {!clientReady && (
          <span className="text-xs text-ink-400">
            Выберите клиента или введите название и рег. номер
          </span>
        )}
        <span className="ml-auto text-sm text-ink-500">
          Итого{" "}
          <span className="font-semibold text-ink-900 tabular-nums">
            {formatMoney(totals.total, business.currency)}
          </span>
        </span>
      </div>
    </div>
  );
}

function ModeToggle({
  value,
  onChange,
}: {
  value: "NET" | "INCL";
  onChange: (v: "NET" | "INCL") => void;
}) {
  return (
    <div className="flex h-9 items-center rounded-lg border border-ink-200 bg-ink-50 p-0.5 text-xs font-medium">
      {(["NET", "INCL"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          title={
            m === "NET"
              ? "Введённая сумма — без налога"
              : "Введённая сумма — включая налог"
          }
          className={`h-full flex-1 rounded-md transition ${
            value === m
              ? "bg-white text-ink-900 shadow-xs"
              : "text-ink-400 hover:text-ink-600"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
