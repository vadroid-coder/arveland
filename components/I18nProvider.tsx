"use client";

import { createContext, useContext } from "react";
import { getDictionary, type Translations } from "@/lib/i18n";

const I18nContext = createContext<Translations>(getDictionary("RU"));

export function I18nProvider({
  language,
  children,
}: {
  language: string;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={getDictionary(language)}>
      {children}
    </I18nContext.Provider>
  );
}

/** Translations inside client components. */
export function useT(): Translations {
  return useContext(I18nContext);
}
