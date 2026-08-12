"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import { useT } from "./I18nProvider";
import {
  emailInvoice,
  emailMonth,
  type MailResult,
} from "@/app/(app)/invoices/email-actions";

export type MailTarget =
  | { kind: "invoice"; id: string }
  | { kind: "month"; businessId: string; year: number; month: number };

export default function EmailDialog({
  target,
  defaultTo = "",
  attachmentName,
  onClose,
}: {
  target: MailTarget;
  defaultTo?: string;
  attachmentName: string;
  onClose: () => void;
}) {
  const t = useT();
  const [to, setTo] = useState(defaultTo);
  const [result, setResult] = useState<MailResult | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setResult(null);
    startTransition(async () => {
      const r =
        target.kind === "invoice"
          ? await emailInvoice(target.id, to)
          : await emailMonth(target.businessId, target.year, target.month, to);
      setResult(r);
    });
  }

  return (
    <Modal title={t.mail.title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-ink-500">{t.mail.attachment(attachmentName)}</p>

        <div>
          <label className="label">{t.mail.recipient}</label>
          <input
            type="email"
            className="field"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="klient@example.com"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && !pending && send()}
          />
        </div>

        {result && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              result.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {result.ok ? result.message : result.error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={send}
            disabled={pending || to.trim() === ""}
          >
            {pending ? t.mail.sending : t.mail.send}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t.invoice.close}
          </button>
        </div>
      </div>
    </Modal>
  );
}
