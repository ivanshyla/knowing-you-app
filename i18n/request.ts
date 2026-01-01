import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

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

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) || defaultLocale

  return {
    locale,
    messages: messages[locale]
  }
})
