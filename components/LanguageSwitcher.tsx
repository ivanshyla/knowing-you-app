'use client'

import { useLocale } from 'next-intl'
import { locales, setLocaleCookie, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale

  const handleChange = (newLocale: Locale) => {
    if (newLocale !== currentLocale) {
      setLocaleCookie(newLocale)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleChange(locale)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            currentLocale === locale
              ? 'bg-white/20 text-white'
              : 'text-white/50 hover:text-white/80 hover:bg-white/10'
          }`}
        >
          {locale === 'en' ? '🇬🇧' : '🇷🇺'}
        </button>
      ))}
    </div>
  )
}
