"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
  exact,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`relative -mb-px shrink-0 border-b-2 px-1 pb-2.5 text-sm font-medium whitespace-nowrap transition ${
        active
          ? "border-white text-white"
          : "border-transparent text-white/60 hover:text-white/90"
      }`}
    >
      {children}
    </Link>
  );
}
