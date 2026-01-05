import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['en', 'ru', 'pl', 'uk', 'be'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // Only show prefix for non-default locales
})

// Lightweight wrappers around Next.js navigation APIs
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
