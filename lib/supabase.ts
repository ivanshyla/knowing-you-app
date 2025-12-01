import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

// Create Supabase client (will only be used when real credentials are configured)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export type Session = {
  id: string
  code: string
  status: 'lobby' | 'live' | 'done'
  question_pack: string
  created_at: string
}

export type Participant = {
  id: string
  session_id: string
  role: 'A' | 'B'
  name: string | null
  emoji: string | null
  joined_at: string
}

export type Question = {
  id: string
  session_id: string
  idx: number
  text: string
  icon: string | null
}

export type Rating = {
  id: string
  session_id: string
  question_id: string
  rater_role: 'A' | 'B'
  target_role: 'A' | 'B'
  value: number
  created_at: string
}

