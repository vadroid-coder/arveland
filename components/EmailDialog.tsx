"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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

/**
 * Confirmation only — there is no recipient field. The server sends to the
 * company's own address, so an invoice can never be mailed to a third party
 * from here.
 */
export default function EmailDialog({
  target,
  companyEmail,
  attachmentName,
  onClose,
}: {
  target: MailTarget;
  companyEmail: string | null;
  attachmentName: string;
  onClose: () => void;
}) {
  const t = useT();
  const [result, setResult] = useState<MailResult | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setResult(null);
    startTransition(async () => {
      setResult(
        target.kind === "invoice"
          ? await emailInvoice(target.id)
          : await emailMonth(target.businessId, target.year, target.month),
      );
    });
  }

  return (
    <Modal title={t.mail.title} onClose={onClose}>
      <div className="space-y-4">
        {companyEmail ? (
          <div className="rounded-lg bg-ink-50 px-3 py-2.5 text-sm">
            <p className="text-xs text-ink-500">{t.mail.toCompany}</p>
            <p className="mt-0.5 font-medium break-all text-ink-900">
              {companyEmail}
            </p>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-2.5">
            <p className="text-sm text-amber-800">{t.mail.errNoCompanyEmail}</p>
            <Link
              href="/businesses"
              className="inline-block text-sm font-medium text-brand-700 underline"
            >
              {t.mail.openBusiness}
            </Link>
          </div>
        )}

        <p className="text-xs break-all text-ink-500">
          {t.mail.attachment(attachmentName)}
        </p>

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
            disabled={pending || !companyEmail}
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
