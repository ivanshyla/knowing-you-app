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
  SessionStatus
} from './models'

const REGION =
  process.env.AWS_REGION ||
  process.env.KYKM_AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  'eu-north-1'

const TABLES = {
  sessions: process.env.AWS_DDB_SESSIONS_TABLE || 'kykm_sessions',
  participants: process.env.AWS_DDB_PARTICIPANTS_TABLE || 'kykm_participants',
  questions: process.env.AWS_DDB_QUESTIONS_TABLE || 'kykm_questions',
  ratings: process.env.AWS_DDB_RATINGS_TABLE || 'kykm_ratings'
}

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true }
})

const NOW = () => new Date().toISOString()

export async function createSessionRecord(params: {
  questionPack: string
  creatorName: string
  creatorEmoji: string
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
        joinedAt: NOW()
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
}): Promise<ParticipantRecord> {
  const participant: ParticipantRecord = {
    sessionId: params.sessionId,
    role: params.role,
    participantId: randomUUID(),
    name: params.name,
    emoji: params.emoji,
    joinedAt: NOW()
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

