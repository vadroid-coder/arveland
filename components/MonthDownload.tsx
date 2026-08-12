"use client";

import { useState } from "react";
import Modal from "./Modal";
import EmailDialog from "./EmailDialog";
import { useT } from "./I18nProvider";

export type MonthInvoice = {
  id: string;
  number: string;
  clientName: string;
  total: string;
};

export default function MonthDownload({
  businessId,
  year,
  month,
  period,
  invoices,
  zipName,
  companyEmail,
}: {
  businessId: string;
  year: number;
  month: number;
  period: string;
  invoices: MonthInvoice[];
  zipName: string;
  companyEmail: string | null;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mailing, setMailing] = useState(false);

  const zipHref = `/api/invoices/zip?businessId=${businessId}&year=${year}&month=${month}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
      >
        <DownloadIcon />
        {t.invoice.download}
      </button>

      {open && (
        <Modal title={t.invoice.monthTitle(period)} onClose={() => setOpen(false)} wide>
          <div className="space-y-4">
            <a href={zipHref} className="btn btn-primary w-full">
              <DownloadIcon />
              {t.invoice.downloadZipAll(invoices.length)}
            </a>

            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={() => {
                setOpen(false);
                setMailing(true);
              }}
            >
              {t.invoice.sendEmail}
            </button>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-ink-400 uppercase">
                {t.invoice.downloadEach}
              </p>
              <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
                {invoices.map((inv) => (
                  <li key={inv.id}>
                    <a
                      href={`/api/invoices/${inv.id}/pdf`}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm transition hover:bg-ink-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink-800">
                          {inv.number}
                        </span>
                        <span className="block truncate text-xs text-ink-400">
                          {inv.clientName}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-ink-600">
                        {inv.total}
                      </span>
                      <DownloadIcon />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {mailing && (
        <EmailDialog
          target={{ kind: "month", businessId, year, month }}
          companyEmail={companyEmail}
          attachmentName={zipName}
          onClose={() => setMailing(false)}
        />
      )}
    </>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className="shrink-0"
      aria-hidden
    >
      <path
        d="M8 2v8m0 0L5 7m3 3l3-3M2.5 12.5h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
