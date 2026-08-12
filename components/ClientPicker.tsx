"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ClientOption = {
  id: string;
  name: string;
  regNumber: string;
  vatNumber: string | null;
  address: string | null;
  email: string | null;
};

export type ClientDraft = {
  name: string;
  regNumber: string;
  vatNumber: string;
  address: string;
  email: string;
};

export const emptyDraft: ClientDraft = {
  name: "",
  regNumber: "",
  vatNumber: "",
  address: "",
  email: "",
};

export default function ClientPicker({
  clients,
  clientId,
  draft,
  saveClient,
  onSelect,
  onDraft,
  onSaveClient,
}: {
  clients: ClientOption[];
  clientId: string | null;
  draft: ClientDraft;
  saveClient: boolean;
  onSelect: (client: ClientOption | null) => void;
  onDraft: (patch: Partial<ClientDraft>) => void;
  onSaveClient: (value: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = clients.find((c) => c.id === clientId) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.slice(0, 8);
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.regNumber.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [clients, query]);

  function startManual() {
    const q = query.trim();
    const looksNumeric = /^\d[\d\s-]*$/.test(q);
    onSelect(null);
    onDraft(
      looksNumeric
        ? { ...emptyDraft, regNumber: q }
        : { ...emptyDraft, name: q },
    );
    setManual(true);
    setOpen(false);
  }

  if (selected) {
    return (
      <div className="rounded-lg border border-ink-200 bg-ink-50/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold text-ink-900">{selected.name}</p>
            <p className="text-ink-500">Рег. код {selected.regNumber}</p>
            {selected.vatNumber && (
              <p className="text-ink-500">НДС {selected.vatNumber}</p>
            )}
            {selected.address && (
              <p className="whitespace-pre-line text-ink-500">
                {selected.address}
              </p>
            )}
            {selected.email && <p className="text-ink-500">{selected.email}</p>}
          </div>
          <button
            type="button"
            className="btn btn-ghost shrink-0 px-2.5 py-1 text-xs"
            onClick={() => {
              onSelect(null);
              setManual(false);
              setQuery("");
            }}
          >
            Сменить
          </button>
        </div>
      </div>
    );
  }

  if (manual) {
    return (
      <div className="space-y-4 rounded-lg border border-brand-200 bg-brand-50/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-800">Новый клиент</p>
          <button
            type="button"
            className="text-xs text-brand-600 hover:underline"
            onClick={() => {
              setManual(false);
              onDraft(emptyDraft);
            }}
          >
            ← Выбрать существующего
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Название компании *</label>
            <input
              className="field"
              value={draft.name}
              onChange={(e) => onDraft({ name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Регистрационный код *</label>
            <input
              className="field"
              value={draft.regNumber}
              onChange={(e) => onDraft({ regNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Номер НДС</label>
            <input
              className="field"
              value={draft.vatNumber}
              onChange={(e) => onDraft({ vatNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="field"
              value={draft.email}
              onChange={(e) => onDraft({ email: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Адрес</label>
            <textarea
              rows={2}
              className="field"
              value={draft.address}
              onChange={(e) => onDraft({ address: e.target.value })}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={saveClient}
            onChange={(e) => onSaveClient(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300"
          />
          Сохранить клиента в справочник
        </label>
      </div>
    );
  }

  return (
    <div className="relative" ref={box}>
      <input
        className="field"
        placeholder="Поиск по названию или регистрационному коду…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />

      {open && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-lg">
          {matches.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(c);
                setOpen(false);
                setQuery("");
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-ink-50"
            >
              <span className="block font-medium text-ink-800">{c.name}</span>
              <span className="block text-xs text-ink-400">
                Рег. {c.regNumber}
                {c.vatNumber ? ` · НДС ${c.vatNumber}` : ""}
              </span>
            </button>
          ))}

          {matches.length === 0 && (
            <p className="px-3 py-2 text-sm text-ink-400">
              Клиент не найден
            </p>
          )}

          <div className="my-1 border-t border-ink-100" />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={startManual}
            className="block w-full px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            + Ввести нового клиента{query.trim() ? `: «${query.trim()}»` : ""}
          </button>
        </div>
      )}
    </div>
  );
}
