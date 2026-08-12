"use client";

import { useEffect, useState } from "react";
import { useT } from "./I18nProvider";

/**
 * Hands the rendered PDF to the OS share sheet, which on a phone is how an
 * invoice reaches mail, messengers or Files. Renders nothing where file
 * sharing is unsupported (most desktops) rather than offering a dead button.
 */
export default function SharePdfButton({
  id,
  fileName,
  title,
  className = "btn btn-ghost",
}: {
  id: string;
  fileName: string;
  title: string;
  className?: string;
}) {
  const t = useT();
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const probe = new File([new Blob(["."])], "probe.pdf", {
        type: "application/pdf",
      });
      setSupported(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setSupported(false);
    }
  }, []);

  if (!supported) return null;

  async function share() {
    setBusy(true);
    try {
      const res = await fetch(`/api/invoices/${id}/pdf`);
      if (!res.ok) throw new Error(String(res.status));
      const file = new File([await res.blob()], fileName, {
        type: "application/pdf",
      });
      await navigator.share({ files: [file], title });
    } catch (err) {
      // Dismissing the share sheet is a normal outcome, not a failure.
      if ((err as Error)?.name !== "AbortError") console.error("[share]", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={className} onClick={share} disabled={busy}>
      {t.invoice.sharePdf}
    </button>
  );
}
