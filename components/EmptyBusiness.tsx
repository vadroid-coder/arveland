import Link from "next/link";

export default function EmptyBusiness() {
  return (
    <div className="card mx-auto max-w-lg p-12 text-center">
      <h2 className="text-lg font-semibold text-ink-900">
        Ühtegi ettevõtet pole veel loodud
      </h2>
      <p className="mt-2 text-sm text-ink-500">
        Lisa esimene ettevõte — selle andmed lähevad arve päisesse ja ettevõtted
        ilmuvad päises lülitina.
      </p>
      <Link href="/businesses/new" className="btn btn-primary mt-6">
        + Lisa ettevõte
      </Link>
    </div>
  );
}
