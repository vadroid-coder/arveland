"use client";

import { useEffect, useRef, useState } from "react";
import { formatRate } from "@/lib/money";

/**
 * Combobox over the saved tax rates. Typing a rate that does not exist yet
 * offers "create" — which adds it to the list (duplicates are impossible,
 * the list is keyed by the numeric rate).
 */
export default function TaxRateSelect({
  value,
  rates,
  onChange,
  onCreate,
}: {
  value: string;
  rates: number[];
  onChange: (value: string) => void;
  onCreate: (rate: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) {
        setOpen(false);
        setDraft(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const text = draft ?? value;
  const parsed = Number(String(text).replace(",", "."));
  const isNumber = text.trim() !== "" && Number.isFinite(parsed);
  const exists = isNumber && rates.some((r) => r === parsed);

  const visible =
    draft === null || draft.trim() === ""
      ? rates
      : rates.filter((r) => formatRate(r).includes(draft.trim()));

  function pick(rate: number) {
    onChange(String(rate));
    setDraft(null);
    setOpen(false);
  }

  function create() {
    if (!isNumber || parsed < 0) return;
    onCreate(parsed);
    pick(parsed);
  }

  return (
    <div className="relative" ref={box}>
      <input
        value={text}
        inputMode="decimal"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
          const n = Number(e.target.value.replace(",", "."));
          if (Number.isFinite(n)) onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (isNumber && !exists) create();
            else {
              setDraft(null);
              setOpen(false);
            }
          }
          if (e.key === "Escape") {
            setDraft(null);
            setOpen(false);
          }
        }}
        className="field pr-7 text-right tabular-nums"
        placeholder="0"
        aria-label="Maksumäär protsentides"
      />
      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-ink-400">
        %
      </span>

      {open && (
        <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-lg">
          {visible.length > 0 && (
            <>
              <p className="px-3 py-1 text-[10px] font-semibold tracking-wide text-ink-400 uppercase">
                Salvestatud määrad
              </p>
              {visible.map((r) => (
                <button
                  key={r}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(r)}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-ink-50 ${
                    r === parsed ? "font-semibold text-brand-600" : "text-ink-700"
                  }`}
                >
                  {formatRate(r)}
                </button>
              ))}
            </>
          )}

          {isNumber && !exists && parsed >= 0 && (
            <>
              {visible.length > 0 && (
                <div className="my-1 border-t border-ink-100" />
              )}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={create}
                className="block w-full px-3 py-1.5 text-left text-sm font-medium text-brand-600 hover:bg-brand-50"
              >
                + Loo maksumäär {formatRate(parsed)}
              </button>
            </>
          )}

          {visible.length === 0 && !isNumber && (
            <p className="px-3 py-2 text-xs text-ink-400">
              Sisesta määr, nt 22
            </p>
          )}
        </div>
      )}
    </div>
  );
}
