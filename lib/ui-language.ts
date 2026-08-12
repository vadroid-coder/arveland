import "server-only";
import { cookies } from "next/headers";
import { getDictionary, asUiLanguage, type UiLanguage } from "./i18n";

export const UI_LANGUAGE_COOKIE = "arvemaa_ui_lang";

export const uiLanguageCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
};

/**
 * The panel language lives in a cookie so the sign-in screen can be localised
 * before there is a session. The User record holds the durable preference and
 * refreshes the cookie on every sign-in.
 */
export async function getUiLanguage(): Promise<UiLanguage> {
  const jar = await cookies();
  return asUiLanguage(jar.get(UI_LANGUAGE_COOKIE)?.value);
}

/** Translations for the current request. */
export async function getT() {
  return getDictionary(await getUiLanguage());
}
