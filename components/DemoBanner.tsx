'use client'

import { useEffect, useState } from 'react'

export default function DemoBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check demo mode only on client side
    const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('ваш-проект') ||
                   process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost:54321'
    setIsDemoMode(isDemo)
  }, [])

  if (!isDemoMode) return null

  return (
    <div className="bg-yellow-400 text-black py-2 px-4 text-center text-sm font-medium sticky top-0 z-50 shadow-md">
      🎮 <strong>DEMO-РЕЖИМ:</strong> Данные хранятся в памяти браузера. 
      При обновлении страницы всё сбросится.
    </div>
  )
}
