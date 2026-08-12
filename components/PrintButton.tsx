"use client";

import { useT } from "./I18nProvider";

export default function PrintButton({
  className = "btn btn-primary",
}: {
  className?: string;
}) {
  const t = useT();
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {t.invoice.print}
    </button>
  );
}
