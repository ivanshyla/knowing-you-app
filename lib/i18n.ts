export const locales = ['en', 'ru'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский'
}

export function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale
  const match = document.cookie.match(/locale=([^;]+)/)
  return (match?.[1] as Locale) || defaultLocale
}

export function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`
  window.location.reload()
}
