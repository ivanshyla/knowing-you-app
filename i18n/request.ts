import { getRequestConfig } from 'next-intl/server'

import enMessages from '../messages/en.json'
import ruMessages from '../messages/ru.json'
import plMessages from '../messages/pl.json'
import ukMessages from '../messages/uk.json'
import beMessages from '../messages/be.json'

export const locales = ['en', 'ru', 'pl', 'uk', 'be'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

const messages: Record<Locale, typeof enMessages> = {
  en: enMessages,
  ru: ruMessages,
  pl: plMessages,
  uk: ukMessages,
  be: beMessages
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  
  // Validate locale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }

  return {
    locale,
    messages: messages[locale as Locale]
  }
})
