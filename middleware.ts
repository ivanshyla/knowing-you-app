import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'ru', 'pl', 'uk', 'be'],
  defaultLocale: 'en',
  localePrefix: { mode: 'as-needed' }
})

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Static files  
  // - _next internals
  // - favicon
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
