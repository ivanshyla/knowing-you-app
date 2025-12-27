export type SessionStatus = 'lobby' | 'live' | 'done'

export type SessionRecord = {
  id: string
  code: string
  questionPack: string
  status: SessionStatus
  createdAt: string
}

export type ParticipantRecord = {
  sessionId: string
  participantId: string
  role: 'A' | 'B'
  name: string
  emoji: string
  joinedAt: string
  userId?: string
}

export type QuestionRecord = {
  sessionId: string
  idx: number
  questionId: string
  text: string
  icon: string
}

export type RatingRecord = {
  sessionId: string
  ratingKey: string
  questionId: string
  raterRole: 'A' | 'B'
  targetRole: 'A' | 'B'
  value: number
  createdAt: string
}

export type RoomState = {
  session: SessionRecord
  participants: ParticipantRecord[]
  questions?: QuestionRecord[]
  ratings?: RatingRecord[]
}

export type UserRecord = {
  userId: string
  createdAt: string
  email?: string
  passwordSalt?: string
  passwordHash?: string
  isPro: boolean
  gamesPlayed: number
  matchSum: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripeStatus?: string
}

export type UserSessionRecord = {
  userId: string
  sessionId: string
  createdAt: string
  code?: string
  role?: 'A' | 'B'
  participantName?: string
  participantEmoji?: string
  partnerName?: string
  partnerEmoji?: string
  matchPercentage?: number
  topMatchText?: string
  topMatchIcon?: string
  finishedAt?: string
}
