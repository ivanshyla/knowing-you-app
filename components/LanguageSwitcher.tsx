'use client'

import { useLocale } from 'next-intl'
import { locales, localeLabels, setLocaleCookie, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => locale !== currentLocale && setLocaleCookie(locale)}
          className={`px-2 py-1 rounded text-xs font-bold transition-all ${
            currentLocale === locale
              ? 'bg-white/20 text-white'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          {localeLabels[locale]}
        </button>
      ))}
    </div>
  )
}
