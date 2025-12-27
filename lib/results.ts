import type { QuestionRecord, RatingRecord } from './models'
import { calculateGap } from './utils'

export type QuestionResult = {
  question: QuestionRecord
  ratings: {
    AtoA: number
    AtoB: number
    BtoA: number
    BtoB: number
  }
  avgGap: number
  gapA: number
  gapB: number
}

export function buildQuestionResults(
  questions: QuestionRecord[],
  ratings: RatingRecord[]
): QuestionResult[] {
  if (!questions.length) return []

  return questions.map((question) => {
    const qRatings = ratings.filter((rating) => rating.questionId === question.questionId)
    const AtoA = qRatings.find((r) => r.raterRole === 'A' && r.targetRole === 'A')?.value ?? 0
    const AtoB = qRatings.find((r) => r.raterRole === 'A' && r.targetRole === 'B')?.value ?? 0
    const BtoA = qRatings.find((r) => r.raterRole === 'B' && r.targetRole === 'A')?.value ?? 0
    const BtoB = qRatings.find((r) => r.raterRole === 'B' && r.targetRole === 'B')?.value ?? 0

    const gapA = calculateGap(AtoA, BtoA)
    const gapB = calculateGap(BtoB, AtoB)
    const avgGap = (gapA + gapB) / 2

    return {
      question,
      ratings: { AtoA, AtoB, BtoA, BtoB },
      avgGap,
      gapA,
      gapB
    }
  })
}

export function computeMatchPercentage(questionResults: QuestionResult[]): number {
  if (!questionResults.length) return 0
  const totalGap = questionResults.reduce((acc, item) => acc + item.avgGap, 0) / questionResults.length
  return Math.max(0, Math.round(100 - (totalGap / 10) * 100))
}

export function pickTopMatches(questionResults: QuestionResult[], limit = 3): QuestionResult[] {
  return [...questionResults].sort((a, b) => a.avgGap - b.avgGap).slice(0, limit)
}

export function pickTopDifferences(questionResults: QuestionResult[], limit = 3): QuestionResult[] {
  return [...questionResults].sort((a, b) => b.avgGap - a.avgGap).slice(0, limit)
}
