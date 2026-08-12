"use client";

import { useState } from "react";
import EmailDialog, { type MailTarget } from "./EmailDialog";
import { useT } from "./I18nProvider";

export default function EmailButton({
  target,
  companyEmail,
  attachmentName,
  className = "btn btn-ghost",
}: {
  target: MailTarget;
  companyEmail: string | null;
  attachmentName: string;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {t.invoice.sendEmail}
      </button>
      {open && (
        <EmailDialog
          target={target}
          companyEmail={companyEmail}
          attachmentName={attachmentName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
