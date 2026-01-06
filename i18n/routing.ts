import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'ru', 'pl', 'uk', 'be'],
  defaultLocale: 'en',
  localePrefix: 'always' // Always show prefix in URL (e.g. /en, /ru)
})

// Lightweight wrappers around Next.js navigation APIs
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
