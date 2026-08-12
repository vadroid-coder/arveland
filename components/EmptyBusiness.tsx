import Link from "next/link";
import { getT } from "@/lib/ui-language";

export default async function EmptyBusiness() {
  const t = await getT();
  return (
    <div className="card mx-auto max-w-lg p-12 text-center">
      <h2 className="text-lg font-semibold text-ink-900">
        {t.business.emptyTitle}
      </h2>
      <p className="mt-2 text-sm text-ink-500">{t.business.emptyText}</p>
      <Link href="/businesses/new" className="btn btn-primary mt-6">
        {t.business.switcherAdd}
      </Link>
    </div>
  );
}
