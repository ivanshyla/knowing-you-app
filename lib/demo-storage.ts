// Client-side demo mode helpers
// These functions work directly with localStorage on the client

import { generateRoomCode } from './utils'
import type { Session, Participant, Question, Rating } from './supabase'

const STORAGE_KEY = 'knowing_you_demo_data'

type DemoData = {
  sessions: Session[]
  participants: Participant[]
  questions: Question[]
  ratings: Rating[]
}

// Get all data from localStorage
export function getDemoData(): DemoData {
  if (typeof window === 'undefined') {
    return { sessions: [], participants: [], questions: [], ratings: [] }
  }
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return { sessions: [], participants: [], questions: [], ratings: [] }
  }
  
  try {
    return JSON.parse(stored)
  } catch {
    return { sessions: [], participants: [], questions: [], ratings: [] }
  }
}

// Save data to localStorage
function saveDemoData(data: DemoData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Create a new room (client-side)
export function createDemoRoom(
  questionPack: string,
  creatorName: string,
  creatorEmoji: string
): { code: string; sessionId: string; participantId: string } {
  const data = getDemoData()
  
  // Generate unique code
  let code = generateRoomCode()
  while (data.sessions.some(s => s.code === code)) {
    code = generateRoomCode()
  }
  
  // Create session
  const sessionId = Math.random().toString(36).substr(2, 9)
  const session: Session = {
    id: sessionId,
    code,
    status: 'lobby',
    question_pack: questionPack,
    created_at: new Date().toISOString(),
  }
  data.sessions.push(session)
  
  // Create participant A
  const participantId = Math.random().toString(36).substr(2, 9)
  const participant: Participant = {
    id: participantId,
    session_id: sessionId,
    role: 'A',
    name: creatorName,
    emoji: creatorEmoji,
    joined_at: new Date().toISOString(),
  }
  data.participants.push(participant)
  
  // Create questions (we'll add them when we import the pack)
  
  saveDemoData(data)
  
  return { code, sessionId, participantId }
}

// Get session by code
export function getDemoSession(code: string): Session | null {
  const data = getDemoData()
  return data.sessions.find(s => s.code === code) || null
}

// Get participants for session
export function getDemoParticipants(sessionId: string): Participant[] {
  const data = getDemoData()
  return data.participants.filter(p => p.session_id === sessionId)
}

// Join room as second player
export function joinDemoRoom(
  code: string,
  name: string,
  emoji: string
): { sessionId: string; participantId: string; role: 'A' | 'B' } | null {
  const data = getDemoData()
  
  const session = data.sessions.find(s => s.code === code)
  if (!session) return null
  
  const participants = data.participants.filter(p => p.session_id === session.id)
  
  // Check if room is full
  if (participants.length >= 2) return null
  
  // Determine role
  const hasA = participants.some(p => p.role === 'A')
  const role: 'A' | 'B' = hasA ? 'B' : 'A'
  
  // Create participant
  const participantId = Math.random().toString(36).substr(2, 9)
  const participant: Participant = {
    id: participantId,
    session_id: session.id,
    role,
    name,
    emoji,
    joined_at: new Date().toISOString(),
  }
  data.participants.push(participant)
  
  saveDemoData(data)
  
  return { sessionId: session.id, participantId, role }
}

// Add questions to session
export function addDemoQuestions(sessionId: string, questions: Array<{ text: string; icon: string }>) {
  const data = getDemoData()
  
  questions.forEach((q, idx) => {
    const question: Question = {
      id: Math.random().toString(36).substr(2, 9),
      session_id: sessionId,
      idx,
      text: q.text,
      icon: q.icon,
    }
    data.questions.push(question)
  })
  
  saveDemoData(data)
}

// Get questions for session
export function getDemoQuestions(sessionId: string): Question[] {
  const data = getDemoData()
  return data.questions
    .filter(q => q.session_id === sessionId)
    .sort((a, b) => a.idx - b.idx)
}

// Update session status
export function updateDemoSessionStatus(sessionId: string, status: 'lobby' | 'live' | 'done') {
  const data = getDemoData()
  const session = data.sessions.find(s => s.id === sessionId)
  if (session) {
    session.status = status
    saveDemoData(data)
  }
}

// Save rating
export function saveDemoRating(
  sessionId: string,
  questionId: string,
  raterRole: 'A' | 'B',
  targetRole: 'A' | 'B',
  value: number
) {
  const data = getDemoData()
  
  // Check if rating exists
  const existingIndex = data.ratings.findIndex(
    r => r.session_id === sessionId &&
         r.question_id === questionId &&
         r.rater_role === raterRole &&
         r.target_role === targetRole
  )
  
  if (existingIndex !== -1) {
    // Update existing
    data.ratings[existingIndex].value = value
  } else {
    // Create new
    const rating: Rating = {
      id: Math.random().toString(36).substr(2, 9),
      session_id: sessionId,
      question_id: questionId,
      rater_role: raterRole,
      target_role: targetRole,
      value,
      created_at: new Date().toISOString(),
    }
    data.ratings.push(rating)
  }
  
  saveDemoData(data)
}

// Get ratings for session
export function getDemoRatings(sessionId: string): Rating[] {
  const data = getDemoData()
  return data.ratings.filter(r => r.session_id === sessionId)
}

// Check if we're in demo mode
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || 
         process.env.NEXT_PUBLIC_SUPABASE_URL.includes('ваш-проект') ||
         process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost:54321'
}



