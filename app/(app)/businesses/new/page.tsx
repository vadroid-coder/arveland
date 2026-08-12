import Link from "next/link";
import BusinessForm from "@/components/BusinessForm";
import { createBusiness } from "../actions";

export const dynamic = "force-dynamic";

export default function NewBusinessPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/businesses" className="text-sm text-ink-500 hover:underline">
          ← Компании
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
          Новая компания
        </h1>
      </div>
      <BusinessForm action={createBusiness} submitLabel="Создать компанию" />
    </div>
  );
}
