const MAP: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Mustand", className: "bg-ink-100 text-ink-600" },
  SENT: { label: "Saadetud", className: "bg-blue-50 text-blue-700" },
  PAID: { label: "Makstud", className: "bg-emerald-50 text-emerald-700" },
  OVERDUE: { label: "Tähtaeg ületatud", className: "bg-red-50 text-red-700" },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? MAP.DRAFT;
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}
