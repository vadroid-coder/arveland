"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { switchBusiness } from "@/app/(app)/actions";
import { useT } from "./I18nProvider";

type Item = { id: string; name: string; invoicePrefix: string; logo: string | null };

export default function BusinessSwitcher({
  businesses,
  activeId,
}: {
  businesses: Item[];
  activeId: string | null;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const active = businesses.find((b) => b.id === activeId) ?? null;

  function select(id: string) {
    setOpen(false);
    if (id === activeId) return;
    startTransition(async () => {
      await switchBusiness(id);
      router.refresh();
    });
  }

  if (businesses.length === 0) {
    return (
      <Link href="/businesses/new" className="btn btn-primary h-9 shrink-0">
        {t.business.switcherAdd}
      </Link>
    );
  }

  return (
    <div className="relative min-w-0 flex-1 sm:flex-none" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 text-sm font-medium text-white transition hover:bg-white/15 sm:w-auto"
      >
        <Avatar item={active} />
        <span className="min-w-0 flex-1 truncate text-left sm:max-w-[13rem] sm:flex-none">
          {active?.name ?? "—"}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          className="shrink-0"
          aria-hidden
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
          <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
            {t.business.switcherTitle}
          </p>
          {businesses.map((b) => (
            <button
              key={b.id}
              onClick={() => select(b.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-ink-50 ${
                b.id === activeId ? "bg-brand-50/70" : ""
              }`}
            >
              <Avatar item={b} dark />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink-800">
                  {b.name}
                </span>
                <span className="block text-xs text-ink-400">
                  {b.invoicePrefix}
                </span>
              </span>
              {b.id === activeId && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4.5 10.5l3.5 3.5 7.5-8"
                    stroke="var(--color-brand-600)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
          <div className="my-1 border-t border-ink-100" />
          <Link
            href="/businesses/new"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-brand-600 hover:bg-ink-50"
          >
            {t.business.switcherNew}
          </Link>
          <Link
            href="/businesses"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-ink-600 hover:bg-ink-50"
          >
            {t.business.switcherManage}
          </Link>
        </div>
      )}
    </div>
  );
}

function Avatar({ item, dark }: { item: Item | null; dark?: boolean }) {
  if (item?.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={item.logo}
        alt=""
        className="h-6 w-6 shrink-0 rounded object-contain"
      />
    );
  }
  const letter = (item?.name ?? "?").charAt(0).toUpperCase();
  return (
    <span
      className={`grid h-6 w-6 shrink-0 place-items-center rounded text-[11px] font-bold ${
        dark ? "bg-ink-800 text-white" : "bg-white/20 text-white"
      }`}
    >
      {letter}
    </span>
  );
}
