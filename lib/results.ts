import type { QuestionRecord, RatingRecord } from './models'
import { calculateGap } from './utils'

export type QuestionResult = {
  question: QuestionRecord
  ratings: {
    AtoA: number // A о себе
    AtoB: number // A о партнере B
    BtoA: number // B о партнере A
    BtoB: number // B о себе
  }
  gapA: number // Насколько A видит себя иначе, чем B видит его (|AtoA - BtoA|)
  gapB: number // Насколько B видит себя иначе, чем A видит её (|BtoB - AtoB|)
  avgGap: number // Средний разрыв восприятия по этому вопросу
}

export function buildQuestionResults(
  questions: QuestionRecord[],
  ratings: RatingRecord[]
): QuestionResult[] {
  if (!questions || !Array.isArray(questions) || questions.length === 0) return []
  if (!ratings || !Array.isArray(ratings)) return []

  return questions.map((question) => {
    const qRatings = ratings.filter((rating) => rating.questionId === question.questionId)
    const AtoA = qRatings.find((r) => r.raterRole === 'A' && r.targetRole === 'A')?.value ?? 0
    const AtoB = qRatings.find((r) => r.raterRole === 'A' && r.targetRole === 'B')?.value ?? 0
    const BtoA = qRatings.find((r) => r.raterRole === 'B' && r.targetRole === 'A')?.value ?? 0
    const BtoB = qRatings.find((r) => r.raterRole === 'B' && r.targetRole === 'B')?.value ?? 0

    const gapA = calculateGap(AtoA, BtoA)
    const gapB = calculateGap(BtoB, AtoB)

    return {
      question,
      ratings: { AtoA, AtoB, BtoA, BtoB },
      gapA,
      gapB,
      avgGap: (gapA + gapB) / 2
    }
  })
}

export function computeMatchPercentage(questionResults: QuestionResult[]): number {
  if (!questionResults || !Array.isArray(questionResults) || questionResults.length === 0) return 0
  const totalGap = questionResults.reduce((acc, item) => acc + item.avgGap, 0) / questionResults.length
  return Math.max(0, Math.round(100 - (totalGap / 10) * 100))
}

export function pickTopMatches(questionResults: QuestionResult[], limit = 3): QuestionResult[] {
  return [...questionResults].sort((a, b) => a.avgGap - b.avgGap).slice(0, limit)
}

export function pickTopDifferences(questionResults: QuestionResult[], limit = 3): QuestionResult[] {
  return [...questionResults].sort((a, b) => b.avgGap - a.avgGap).slice(0, limit)
}



