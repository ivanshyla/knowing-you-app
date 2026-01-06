'use client'

import { useLocale } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { locales, localeLabels, type Locale } from '@/lib/i18n'

export function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale
  const [path, setPath] = useState('/')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPath(window.location.pathname || '/')
    setSearch(window.location.search || '')
  }, [])

  const basePath = useMemo(() => {
    // Strip existing locale prefix from the current path
    const re = new RegExp(`^/(${locales.join('|')})(?=/|$)`)
    const stripped = (path || '/').replace(re, '')
    return stripped.length ? stripped : '/'
  }, [path])

  return (
    <div className="flex items-center gap-1">
      {locales.map((locale) => (
        <a
          key={locale}
          href={`/${locale}${basePath === '/' ? '' : basePath}${search}`}
          className={`px-2 py-1 rounded text-xs font-bold transition-all ${
            currentLocale === locale
              ? 'bg-white/20 text-white'
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          {localeLabels[locale]}
        </a>
      ))}
    </div>
  )
}
