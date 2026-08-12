import Link from "next/link";

export default function EmptyBusiness() {
  return (
    <div className="card mx-auto max-w-lg p-12 text-center">
      <h2 className="text-lg font-semibold text-ink-900">
        Ни одной компании ещё не создано
      </h2>
      <p className="mt-2 text-sm text-ink-500">
        Добавьте первую компанию — её реквизиты попадут в шапку счёта, а сами
        компании появятся переключателем в верхней панели.
      </p>
      <Link href="/businesses/new" className="btn btn-primary mt-6">
        + Добавить компанию
      </Link>
    </div>
  );
}
