"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "./I18nProvider";
import EmailDialog from "./EmailDialog";
import { deleteInvoice, duplicateInvoice } from "@/app/(app)/invoices/actions";

export default function InvoiceRowMenu({
  id,
  number,
  clientEmail,
  quick,
}: {
  id: string;
  number: string;
  clientEmail: string | null;
  /** Also surface download and email as their own buttons (mobile cards). */
  quick?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mailing, setMailing] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const item =
    "block w-full px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-ink-50";

  return (
    <>
      {quick && (
        <>
          <a
            href={`/api/invoices/${id}/pdf`}
            className="btn btn-ghost h-8 px-2.5 text-xs"
          >
            {t.invoice.downloadPdf}
          </a>
          <button
            type="button"
            className="btn btn-ghost h-8 px-2.5 text-xs"
            onClick={() => setMailing(true)}
          >
            {t.invoice.sendEmail}
          </button>
        </>
      )}

      <div className="relative" ref={box}>
        <button
          type="button"
          aria-label={t.invoice.actions}
          onClick={() => setOpen((v) => !v)}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 text-left shadow-lg">
            <Link
              href={`/invoices/${id}/edit`}
              className={item}
              onClick={() => setOpen(false)}
            >
              {t.common.edit}
            </Link>

            <form action={duplicateInvoice.bind(null, id)}>
              <button type="submit" className={item}>
                {t.invoice.duplicate}
              </button>
            </form>

            <a
              href={`/api/invoices/${id}/pdf`}
              className={item}
              onClick={() => setOpen(false)}
            >
              {t.invoice.downloadPdf}
            </a>

            <button
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                setMailing(true);
              }}
            >
              {t.invoice.sendEmail}
            </button>

            <div className="my-1 border-t border-ink-100" />

            <form
              action={deleteInvoice.bind(null, id)}
              onSubmit={(e) => {
                if (!window.confirm(t.invoice.confirmDelete(number)))
                  e.preventDefault();
              }}
            >
              <button
                type="submit"
                className={`${item} text-red-600 hover:bg-red-50`}
              >
                {t.common.delete}
              </button>
            </form>
          </div>
        )}
      </div>

      {mailing && (
        <EmailDialog
          target={{ kind: "invoice", id }}
          defaultTo={clientEmail ?? ""}
          attachmentName={`${number}.pdf`}
          onClose={() => setMailing(false)}
        />
      )}
    </>
  );
}
