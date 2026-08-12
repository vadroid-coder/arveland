import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getActiveBusiness } from "@/lib/business";
import BusinessSwitcher from "@/components/BusinessSwitcher";
import NavLink from "@/components/NavLink";
import Logo from "@/components/Logo";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const { businesses, active } = await getActiveBusiness();

  return (
    <div className="min-h-screen">
      <header className="no-print bg-ink-900 text-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Logo className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight">
              ArveMaa
            </span>
          </Link>

          <span className="h-5 w-px bg-white/15" />

          <BusinessSwitcher
            businesses={businesses.map((b) => ({
              id: b.id,
              name: b.name,
              invoicePrefix: b.invoicePrefix,
              logo: b.logo,
            }))}
            activeId={active?.id ?? null}
          />

          <div className="flex-1" />

          <div className="hidden text-right sm:block">
            <p className="text-[13px] leading-tight font-medium">{user.name}</p>
            <p className="text-[11px] leading-tight text-white/50">
              {user.role === "ADMIN" ? "Administraator" : "Kasutaja"}
            </p>
          </div>
          <form action={logout}>
            <button className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 transition hover:bg-white/10">
              Logi välja
            </button>
          </form>
        </div>

        <nav className="mx-auto flex max-w-7xl items-end gap-6 px-5">
          <NavLink href="/" exact>
            Arved
          </NavLink>
          <NavLink href="/clients">Kliendid</NavLink>
          <NavLink href="/businesses">Ettevõtted</NavLink>
          {user.role === "ADMIN" && <NavLink href="/admin">Kasutajad</NavLink>}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
