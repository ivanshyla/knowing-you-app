'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Question, type Participant, type Rating } from '@/lib/supabase'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts'
import { calculateGap, getGapMessage, getRandomMessage, RESULT_MESSAGES } from '@/lib/utils'
import ShareCard from '@/components/ShareCard'

type QuestionResult = {
  question: Question
  ratings: {
    AtoA: number
    AtoB: number
    BtoA: number
    BtoB: number
  }
  gapA: number  // |AtoA - BtoA|
  gapB: number  // |BtoB - AtoB|
  avgGap: number
}

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [results, setResults] = useState<QuestionResult[]>([])
  const [showShareCard, setShowShareCard] = useState(false)

  useEffect(() => {
    loadData()
  }, [code])

  useEffect(() => {
    if (questions.length > 0 && ratings.length > 0) {
      calculateResults()
    }
  }, [questions, ratings])

  async function loadData() {
    const { getDemoSession, getDemoQuestions, getDemoParticipants, getDemoRatings, isDemoMode } = await import('@/lib/demo-storage')
    
    if (isDemoMode()) {
      // Demo mode - load from localStorage
      const sessionData = getDemoSession(code)
      if (!sessionData) {
        router.push('/')
        return
      }

      // Load questions
      const questionsData = getDemoQuestions(sessionData.id)
      setQuestions(questionsData)

      // Load participants
      const participantsData = getDemoParticipants(sessionData.id)
      setParticipants(participantsData)

      // Load ratings
      const ratingsData = getDemoRatings(sessionData.id)
      setRatings(ratingsData)

      setLoading(false)
    } else {
      // Real Supabase mode
      // Load session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .single()

      if (!sessionData) {
        router.push('/')
        return
      }

      // Load questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('idx', { ascending: true })

      if (questionsData) {
        setQuestions(questionsData)
      }

      // Load participants
      const { data: participantsData } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionData.id)

      if (participantsData) {
        setParticipants(participantsData)
      }

      // Load ratings
      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('*')
        .eq('session_id', sessionData.id)

      if (ratingsData) {
        setRatings(ratingsData)
      }

      setLoading(false)
    }
  }

  function calculateResults() {
    const results: QuestionResult[] = questions.map(question => {
      const qRatings = ratings.filter(r => r.question_id === question.id)
      
      const AtoA = qRatings.find(r => r.rater_role === 'A' && r.target_role === 'A')?.value || 0
      const AtoB = qRatings.find(r => r.rater_role === 'A' && r.target_role === 'B')?.value || 0
      const BtoA = qRatings.find(r => r.rater_role === 'B' && r.target_role === 'A')?.value || 0
      const BtoB = qRatings.find(r => r.rater_role === 'B' && r.target_role === 'B')?.value || 0

      const gapA = calculateGap(AtoA, BtoA)
      const gapB = calculateGap(BtoB, AtoB)
      const avgGap = (gapA + gapB) / 2

      return {
        question,
        ratings: { AtoA, AtoB, BtoA, BtoB },
        gapA,
        gapB,
        avgGap,
      }
    })

    setResults(results)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-gray-600">Подсчитываем результаты...</div>
        </div>
      </div>
    )
  }

  const participantA = participants.find(p => p.role === 'A')
  const participantB = participants.find(p => p.role === 'B')

  // Calculate overall stats
  const totalAvgGap = results.reduce((sum, r) => sum + r.avgGap, 0) / results.length
  const matchPercentage = Math.max(0, Math.round(100 - (totalAvgGap / 10) * 100))

  // Top matches (lowest gaps)
  const topMatches = [...results]
    .sort((a, b) => a.avgGap - b.avgGap)
    .slice(0, 3)

  // Top differences (highest gaps)
  const topDifferences = [...results]
    .sort((a, b) => b.avgGap - a.avgGap)
    .slice(0, 3)

  // Prepare radar chart data
  const radarData = results.slice(0, 8).map(r => ({
    subject: r.question.text.slice(0, 15) + (r.question.text.length > 15 ? '...' : ''),
    [participantA?.name || 'A']: (r.ratings.AtoA + r.ratings.BtoA) / 2,
    [participantB?.name || 'B']: (r.ratings.BtoB + r.ratings.AtoB) / 2,
  }))

  // Get motivational message
  let message = ''
  if (matchPercentage >= 70) {
    message = getRandomMessage(RESULT_MESSAGES.highMatch)
  } else if (matchPercentage >= 40) {
    message = getRandomMessage(RESULT_MESSAGES.mediumMatch)
  } else {
    message = getRandomMessage(RESULT_MESSAGES.lowMatch)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Результаты 🎉
          </h1>
          <p className="text-gray-600">Узнайте, насколько вы совместимы!</p>
        </div>

        {/* Overall Match Score */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          <div className="text-6xl mb-4">
            {matchPercentage >= 70 ? '💕' : matchPercentage >= 40 ? '😊' : '🤔'}
          </div>
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-3">
            {matchPercentage}%
          </div>
          <div className="text-xl text-gray-700 mb-2">Совместимость</div>
          <div className="text-gray-600 italic">{message}</div>
        </div>

        {/* Participants */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="text-4xl mb-2">{participantA?.emoji}</div>
              <div className="font-semibold text-gray-800">{participantA?.name}</div>
            </div>
            <div className="text-3xl">💞</div>
            <div className="text-center">
              <div className="text-4xl mb-2">{participantB?.emoji}</div>
              <div className="font-semibold text-gray-800">{participantB?.name}</div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
              Сравнение профилей 📊
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} />
                <Radar
                  name={participantA?.name || 'A'}
                  dataKey={participantA?.name || 'A'}
                  stroke="#ec4899"
                  fill="#ec4899"
                  fillOpacity={0.3}
                />
                <Radar
                  name={participantB?.name || 'B'}
                  dataKey={participantB?.name || 'B'}
                  stroke="#9333ea"
                  fill="#9333ea"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Matches */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            🎯 Топ-3 совпадений
          </h2>
          <div className="space-y-3">
            {topMatches.map((result, idx) => (
              <div key={result.question.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="text-2xl">{result.question.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{result.question.text}</div>
                  <div className="text-sm text-gray-600">
                    {getGapMessage(result.avgGap)} (разница: {result.avgGap.toFixed(1)})
                  </div>
                </div>
                <div className="text-2xl">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Differences */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            🤔 Топ-3 различий
          </h2>
          <div className="space-y-3">
            {topDifferences.map((result) => (
              <div key={result.question.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl">{result.question.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{result.question.text}</div>
                  <div className="text-sm text-gray-600">
                    {getGapMessage(result.avgGap)} (разница: {result.avgGap.toFixed(1)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={() => setShowShareCard(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-4"
        >
          Создать картинку для соцсетей 📸
        </button>

        {/* Play Again */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Играть снова
          </a>
        </div>
      </div>

      {/* Share Card Modal */}
      {showShareCard && topMatches[0] && participantA && participantB && (
        <ShareCard
          participantA={participantA}
          participantB={participantB}
          matchPercentage={matchPercentage}
          topMatch={{
            question: {
              text: topMatches[0].question.text,
              icon: topMatches[0].question.icon ?? '❓'
            },
            avgGap: topMatches[0].avgGap
          }}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  )
}


