'use client'

import { useMemo, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { isCapacitor } from '@/lib/capacitor'

type AccountClientProps = {
  user: {
    userId: string | null
    email: string | null
    isPro: boolean
    gamesPlayed: number
    avgMatch: number
    stripeStatus: string | null
  }
}

export default function AccountClient({ user }: AccountClientProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const canShowAuth = useMemo(() => !user.email, [user.email])

  const submit = async () => {
    setMessage(null)
    setLoading(true)
    try {
      const res = await apiFetch(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Ошибка')
      window.location.reload()
    } catch (e: any) {
      setMessage(e?.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  const startCheckout = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await apiFetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Не удалось открыть оплату')
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('Missing checkout url')
      }
    } catch (e: any) {
      setMessage(e?.message || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleAppleLogin = () => {
    alert('Sign in with Apple будет доступен в релизной версии App Store.')
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gray-500">Подписка</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">
            {user.isPro ? 'PRO активен ✅' : 'Free'}
          </p>
          {!user.isPro && (
            <p className="text-sm text-gray-600">1 игра бесплатно, дальше нужен PRO за $9.</p>
          )}
          {user.stripeStatus && (
            <p className="text-xs text-gray-500">Stripe: {user.stripeStatus}</p>
          )}
        </div>

        {!user.isPro && (
          <button
            onClick={startCheckout}
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow disabled:opacity-50"
          >
            Оформить PRO ($9) →
          </button>
        )}
      </div>

      {user.email && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="text-sm text-gray-700">
            Вошли как <span className="font-semibold">{user.email}</span>
          </div>
          <button
            onClick={logout}
            disabled={loading}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 disabled:opacity-50"
          >
            Выйти
          </button>
        </div>
      )}

      {canShowAuth && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === 'signup' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Создать аккаунт
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                mode === 'login' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              Войти
            </button>
          </div>

          <div className="grid gap-2">
            {isCapacitor() && (
              <button
                onClick={handleAppleLogin}
                className="flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-semibold text-white shadow-lg"
              >
                <span className="text-lg"></span> Sign in with Apple
              </button>
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500"
              autoComplete="email"
              inputMode="email"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="пароль (мин. 6 символов)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              type="password"
            />
            <button
              onClick={submit}
              disabled={loading || !email.trim() || password.length < 6}
              className="rounded-full bg-gray-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? '...' : mode === 'signup' ? 'Создать аккаунт' : 'Войти'}
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  )
}




