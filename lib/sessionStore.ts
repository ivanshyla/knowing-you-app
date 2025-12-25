import { randomUUID } from 'crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  BatchWriteCommand,
  type BatchWriteCommandInput,
  type BatchWriteCommandOutput,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb'
import { QUESTION_PACKS } from '@/data/questionPacks'
import { generateRoomCode } from './utils'
import type {
  ParticipantRecord,
  QuestionRecord,
  RatingRecord,
  RoomState,
  SessionRecord,
  SessionStatus,
  UserRecord,
  UserSessionRecord
} from './models'
import { buildQuestionResults, computeMatchPercentage, pickTopMatches } from './results'

const REGION =
  process.env.AWS_REGION ||
  process.env.KYKM_AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  'eu-north-1'

const TABLES = {
  sessions: process.env.AWS_DDB_SESSIONS_TABLE || 'kykm_sessions',
  participants: process.env.AWS_DDB_PARTICIPANTS_TABLE || 'kykm_participants',
  questions: process.env.AWS_DDB_QUESTIONS_TABLE || 'kykm_questions',
  ratings: process.env.AWS_DDB_RATINGS_TABLE || 'kykm_ratings',
  users: process.env.AWS_DDB_USERS_TABLE || 'kykm_users',
  userSessions: process.env.AWS_DDB_USER_SESSIONS_TABLE || 'kykm_user_sessions',
  userEmails: process.env.AWS_DDB_USER_EMAILS_TABLE || 'kykm_user_emails'
}

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true }
})

const NOW = () => new Date().toISOString()

export async function createSessionRecord(params: {
  questionPack: string
  creatorName: string
  creatorEmoji: string
  creatorUserId?: string
}): Promise<{ sessionId: string; code: string; participantId: string }> {
  const pack = QUESTION_PACKS[params.questionPack]
  if (!pack) {
    throw new Error('Unknown question pack')
  }

  const code = await reserveUniqueCode()
  const sessionId = randomUUID()

  const session: SessionRecord = {
    id: sessionId,
    code,
    status: 'lobby',
    questionPack: params.questionPack,
    createdAt: NOW()
  }

  await dynamo.send(
    new PutCommand({
      TableName: TABLES.sessions,
      Item: session
    })
  )

  const participantId = randomUUID()
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.participants,
      Item: {
        sessionId,
        role: 'A',
        participantId,
        name: params.creatorName,
        emoji: params.creatorEmoji,
        joinedAt: NOW(),
        userId: params.creatorUserId
      }
    })
  )

  await writeQuestions(sessionId, pack.questions)

  return { sessionId, code, participantId }
}

export async function fetchSessionByCode(code: string): Promise<SessionRecord | null> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.sessions,
      IndexName: 'code-index',
      KeyConditionExpression: '#code = :code',
      ExpressionAttributeNames: { '#code': 'code' },
      ExpressionAttributeValues: { ':code': code }
    })
  )

  return (result.Items?.[0] as SessionRecord) ?? null
}

export async function fetchSessionById(sessionId: string): Promise<SessionRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLES.sessions,
      Key: { id: sessionId }
    })
  )

  return (result.Item as SessionRecord) ?? null
}

export async function fetchParticipants(sessionId: string): Promise<ParticipantRecord[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.participants,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: { ':sessionId': sessionId }
    })
  )
  return (result.Items as ParticipantRecord[]) ?? []
}

export async function addParticipantRecord(params: {
  sessionId: string
  role: 'A' | 'B'
  name: string
  emoji: string
  userId?: string
}): Promise<ParticipantRecord> {
  const participant: ParticipantRecord = {
    sessionId: params.sessionId,
    role: params.role,
    participantId: randomUUID(),
    name: params.name,
    emoji: params.emoji,
    joinedAt: NOW(),
    userId: params.userId
  }

  await dynamo.send(
    new PutCommand({
      TableName: TABLES.participants,
      Item: participant,
      ConditionExpression: 'attribute_not_exists(#role)',
      ExpressionAttributeNames: { '#role': 'role' }
    })
  )

  return participant
}

export async function fetchQuestions(sessionId: string): Promise<QuestionRecord[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.questions,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: { ':sessionId': sessionId }
    })
  )
  return (result.Items as QuestionRecord[]) ?? []
}

export async function saveRatingRecord(params: {
  sessionId: string
  questionId: string
  raterRole: 'A' | 'B'
  targetRole: 'A' | 'B'
  value: number
}): Promise<void> {
  const ratingKey = `${params.questionId}#${params.raterRole}#${params.targetRole}`

  const rating: RatingRecord = {
    sessionId: params.sessionId,
    ratingKey,
    questionId: params.questionId,
    raterRole: params.raterRole,
    targetRole: params.targetRole,
    value: params.value,
    createdAt: NOW()
  }

  await dynamo.send(
    new PutCommand({
      TableName: TABLES.ratings,
      Item: rating
    })
  )
}

export async function fetchRatings(sessionId: string): Promise<RatingRecord[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.ratings,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: { ':sessionId': sessionId }
    })
  )
  return (result.Items as RatingRecord[]) ?? []
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.sessions,
      Key: { id: sessionId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status }
    })
  )
}

export async function ensureUserRecord(userId: string): Promise<UserRecord> {
  const existing = await dynamo.send(
    new GetCommand({
      TableName: TABLES.users,
      Key: { userId }
    })
  )
  const found = existing.Item as UserRecord | undefined
  if (found) return found

  const created: UserRecord = {
    userId,
    createdAt: NOW(),
    isPro: false,
    gamesPlayed: 0,
    gamesPurchased: 0,
    matchSum: 0
  }

  await dynamo.send(
    new PutCommand({
      TableName: TABLES.users,
      Item: created
    })
  )

  return created
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLES.userEmails,
      Key: { email: normalized }
    })
  )
  return (result.Item as { userId?: string } | undefined)?.userId ?? null
}

export async function attachEmailAndPasswordToUser(params: {
  userId: string
  email: string
  passwordSalt: string
  passwordHash: string
}): Promise<void> {
  const normalized = params.email.trim().toLowerCase()
  if (!normalized) throw new Error('Invalid email')

  // 1) Ensure email is unique (email table condition)
  await dynamo.send(
    new PutCommand({
      TableName: TABLES.userEmails,
      Item: { email: normalized, userId: params.userId, createdAt: NOW() },
      ConditionExpression: 'attribute_not_exists(email)'
    })
  )

  // 2) Update user record
  await ensureUserRecord(params.userId)
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { userId: params.userId },
      UpdateExpression: 'SET email = :email, passwordSalt = :salt, passwordHash = :hash',
      ExpressionAttributeValues: {
        ':email': normalized,
        ':salt': params.passwordSalt,
        ':hash': params.passwordHash
      }
    })
  )
}

export async function getUserRecord(userId: string): Promise<UserRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLES.users,
      Key: { userId }
    })
  )
  return (result.Item as UserRecord) ?? null
}

export async function setUserStripeStatus(params: {
  userId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripeStatus?: string
  isPro?: boolean
}): Promise<void> {
  await ensureUserRecord(params.userId)

  const updates: string[] = []
  const values: Record<string, unknown> = {}

  if (params.stripeCustomerId !== undefined) {
    updates.push('stripeCustomerId = :cust')
    values[':cust'] = params.stripeCustomerId
  }
  if (params.stripeSubscriptionId !== undefined) {
    updates.push('stripeSubscriptionId = :sub')
    values[':sub'] = params.stripeSubscriptionId
  }
  if (params.stripeStatus !== undefined) {
    updates.push('stripeStatus = :status')
    values[':status'] = params.stripeStatus
  }
  if (params.isPro !== undefined) {
    updates.push('isPro = :isPro')
    values[':isPro'] = params.isPro
  }

  if (updates.length === 0) return

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { userId: params.userId },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeValues: values
    })
  )
}

export async function listUserSessions(userId: string): Promise<UserSessionRecord[]> {
  const result = await dynamo.send(
    new QueryCommand({
      TableName: TABLES.userSessions,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false
    })
  )
  return (result.Items as UserSessionRecord[]) ?? []
}

export async function createUserSessionLink(params: {
  sessionId: string
  userId: string
  createdAt: string
  code?: string
  role?: 'A' | 'B'
  participantName?: string
  participantEmoji?: string
  partnerName?: string
  partnerEmoji?: string
}): Promise<void> {
  const item: UserSessionRecord = {
    userId: params.userId,
    sessionId: params.sessionId,
    createdAt: params.createdAt,
    code: params.code,
    role: params.role,
    participantName: params.participantName,
    participantEmoji: params.participantEmoji,
    partnerName: params.partnerName,
    partnerEmoji: params.partnerEmoji
  }

  await dynamo.send(
    new PutCommand({
      TableName: TABLES.userSessions,
      Item: item
    })
  )
}

export async function syncUserSessionPartnerInfo(sessionId: string): Promise<void> {
  const participants = await fetchParticipants(sessionId)
  const a = participants.find((p) => p.role === 'A')
  const b = participants.find((p) => p.role === 'B')
  if (!a || !b) return

  const updates = [
    a.userId
      ? dynamo.send(
          new UpdateCommand({
            TableName: TABLES.userSessions,
            Key: { userId: a.userId, sessionId },
            UpdateExpression: 'SET partnerName = :name, partnerEmoji = :emoji',
            ExpressionAttributeValues: { ':name': b.name, ':emoji': b.emoji }
          })
        )
      : Promise.resolve(),
    b.userId
      ? dynamo.send(
          new UpdateCommand({
            TableName: TABLES.userSessions,
            Key: { userId: b.userId, sessionId },
            UpdateExpression: 'SET partnerName = :name, partnerEmoji = :emoji',
            ExpressionAttributeValues: { ':name': a.name, ':emoji': a.emoji }
          })
        )
      : Promise.resolve()
  ]

  await Promise.all(updates)
}

export async function finalizeSessionAndUpdateStats(sessionId: string): Promise<void> {
  const session = await fetchSessionById(sessionId)
  if (!session || session.status !== 'done') return

  const [participants, questions, ratings] = await Promise.all([
    fetchParticipants(sessionId),
    fetchQuestions(sessionId),
    fetchRatings(sessionId)
  ])

  const a = participants.find((p) => p.role === 'A')
  const b = participants.find((p) => p.role === 'B')
  if (!a || !b) return

  const questionResults = buildQuestionResults(questions, ratings)
  const matchPercentage = computeMatchPercentage(questionResults)
  const topMatch = pickTopMatches(questionResults, 1)[0]

  const finishedAt = NOW()
  const sessionLinks = participants
    .filter((p) => p.userId)
    .map((p) => ({ userId: p.userId as string, role: p.role as 'A' | 'B' }))

  // Update session link rows (one per user)
  await Promise.all(
    sessionLinks.map(async ({ userId }) => {
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLES.userSessions,
          Key: { userId, sessionId },
          UpdateExpression:
            'SET finishedAt = :finishedAt, matchPercentage = :matchPercentage, topMatchText = :topMatchText, topMatchIcon = :topMatchIcon',
          ExpressionAttributeValues: {
            ':finishedAt': finishedAt,
            ':matchPercentage': matchPercentage,
            ':topMatchText': topMatch?.question.text ?? '',
            ':topMatchIcon': topMatch?.question.icon ?? ''
          }
        })
      )
    })
  )

  // Update aggregate stats per user (idempotency: naive, increments can double if finish called multiple times)
  // We rely on session.status being done already; still possible multiple calls => acceptable for MVP, can harden with conditional writes later.
  await Promise.all(
    sessionLinks.map(async ({ userId }) => {
      await ensureUserRecord(userId)
      await dynamo.send(
        new UpdateCommand({
          TableName: TABLES.users,
          Key: { userId },
          UpdateExpression: 'SET gamesPlayed = if_not_exists(gamesPlayed, :zero) + :one, matchSum = if_not_exists(matchSum, :zero) + :matchSum',
          ExpressionAttributeValues: {
            ':zero': 0,
            ':one': 1,
            ':matchSum': matchPercentage
          }
        })
      )
    })
  )
}

export async function getRoomStateByCode(
  code: string,
  include?: { questions?: boolean; ratings?: boolean }
): Promise<RoomState | null> {
  const session = await fetchSessionByCode(code)
  if (!session) {
    return null
  }

  const [participants, questions, ratings] = await Promise.all([
    fetchParticipants(session.id),
    include?.questions ? fetchQuestions(session.id) : Promise.resolve(undefined),
    include?.ratings ? fetchRatings(session.id) : Promise.resolve(undefined)
  ])

  return {
    session,
    participants,
    questions,
    ratings
  }
}

async function reserveUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateRoomCode()
    const existing = await fetchSessionByCode(candidate)
    if (!existing) {
      return candidate
    }
  }
  throw new Error('Unable to reserve unique code')
}

async function writeQuestions(
  sessionId: string,
  questions: Array<{ text: string; icon: string }>
): Promise<void> {
  const items: QuestionRecord[] = questions.map((q, idx) => ({
    sessionId,
    idx,
    questionId: randomUUID(),
    text: q.text,
    icon: q.icon
  }))

  const chunks = chunk(items, 25)
  for (const batch of chunks) {
    let requestItems: BatchWriteCommandInput['RequestItems'] = {
      [TABLES.questions]: batch.map((item) => ({
        PutRequest: { Item: item }
      }))
    }

    // Retry unprocessed items if DynamoDB throttles
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response: BatchWriteCommandOutput = await dynamo.send(
        new BatchWriteCommand({
          RequestItems: requestItems
        })
      )
      const unprocessed = response.UnprocessedItems?.[TABLES.questions]
      if (!unprocessed || unprocessed.length === 0) {
        break
      }
      requestItems = { [TABLES.questions]: unprocessed }
    }
  }
}

function chunk<T>(list: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < list.length; i += size) {
    result.push(list.slice(i, i + size))
  }
  return result
}


// Add purchased games to user balance
export async function addGamesToUser(userId: string, count: number): Promise<void> {
  await ensureUserRecord(userId)
  await dynamo.send(
    new UpdateCommand({
      TableName: TABLES.users,
      Key: { userId },
      UpdateExpression: 'SET gamesPurchased = if_not_exists(gamesPurchased, :zero) + :count',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':count': count
      }
    })
  )
  console.log(`[addGamesToUser] Added ${count} games to user ${userId}`)
}
