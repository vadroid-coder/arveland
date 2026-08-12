import { getT } from "@/lib/ui-language";

const TONE: Record<string, string> = {
  DRAFT: "bg-ink-100 text-ink-600",
  SENT: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
  OVERDUE: "bg-red-50 text-red-700",
};

export default async function StatusBadge({ status }: { status: string }) {
  const t = await getT();
  const LABEL: Record<string, string> = {
    DRAFT: t.dashboard.statusDraft,
    SENT: t.dashboard.statusSent,
    PAID: t.dashboard.statusPaid,
    OVERDUE: t.dashboard.statusOverdue,
  };
  return (
    <span className={`badge ${TONE[status] ?? TONE.DRAFT}`}>
      {LABEL[status] ?? LABEL.DRAFT}
    </span>
  );
}
