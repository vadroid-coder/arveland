import Link from "next/link";
import BusinessForm from "@/components/BusinessForm";
import { getT } from "@/lib/ui-language";
import { createBusiness } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewBusinessPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/businesses" className="text-sm text-ink-500 hover:underline">
          {t.business.back}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
          {t.business.newTitle}
        </h1>
      </div>
      <BusinessForm action={createBusiness} submitLabel={t.business.create} />
    </div>
  );
}
