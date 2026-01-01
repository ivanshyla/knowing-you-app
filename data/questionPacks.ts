export type QuestionCategory = 'relationship' | 'friendship' | 'work' | 'sport' | 'intimacy' | 'community'

export type QuestionItem = {
  text: string
  icon: string
  category: QuestionCategory
}

export type QuestionPack = {
  id: string
  name: string
  emoji: string
  description: string
  subtitle: string
  questions: QuestionItem[]
}

export const QUESTION_PACKS: Record<string, QuestionPack> = {
  romantic: {
    id: 'romantic',
    name: 'Romance',
    emoji: '💕',
    subtitle: 'For Couples',
    description: 'Discover how you see each other in love',
    questions: [
      { text: 'Romantic', icon: '💘', category: 'relationship' },
      { text: 'Passionate', icon: '🔥', category: 'relationship' },
      { text: 'Attentive', icon: '👀', category: 'relationship' },
      { text: 'Tender', icon: '🤗', category: 'relationship' },
      { text: 'Trustworthy', icon: '🤝', category: 'relationship' },
      { text: 'Jealous', icon: '👁️', category: 'relationship' },
      { text: 'Spontaneous', icon: '🎲', category: 'relationship' },
      { text: 'Emotional', icon: '💭', category: 'relationship' },
    ],
  },
  
  everyday: {
    id: 'everyday',
    name: 'Everyday',
    emoji: '🏠',
    subtitle: 'Daily Life',
    description: 'How you handle everyday life together',
    questions: [
      { text: 'Tidy', icon: '🧹', category: 'relationship' },
      { text: 'Cooking skills', icon: '👨‍🍳', category: 'relationship' },
      { text: 'Punctual', icon: '⏰', category: 'relationship' },
      { text: 'Organized', icon: '📋', category: 'relationship' },
      { text: 'Lazy', icon: '😴', category: 'relationship' },
      { text: 'Thrifty', icon: '💰', category: 'relationship' },
      { text: 'Generous', icon: '🎁', category: 'relationship' },
      { text: 'Stubborn', icon: '🐂', category: 'relationship' },
    ],
  },

  intimacy: {
    id: 'intimacy',
    name: 'Passion',
    emoji: '🫦',
    subtitle: 'Intimacy',
    description: 'How you imagine each other in bed',
    questions: [
      { text: 'Initiative', icon: '🔥', category: 'intimacy' },
      { text: 'Fantasy', icon: '💭', category: 'intimacy' },
      { text: 'Sensual', icon: '💋', category: 'intimacy' },
      { text: 'Experimental', icon: '🧪', category: 'intimacy' },
      { text: 'Tempo', icon: '🎚️', category: 'intimacy' },
      { text: 'Communication', icon: '🗣️', category: 'intimacy' },
      { text: 'Confident', icon: '💪', category: 'intimacy' },
      { text: 'Aftercare', icon: '🫶', category: 'intimacy' },
    ],
  },

  character: {
    id: 'character',
    name: 'Character',
    emoji: '🎭',
    subtitle: 'Personality',
    description: 'Who you really are inside',
    questions: [
      { text: 'Sense of humor', icon: '😄', category: 'friendship' },
      { text: 'Confident', icon: '💪', category: 'friendship' },
      { text: 'Kind', icon: '😇', category: 'friendship' },
      { text: 'Honest', icon: '🤐', category: 'friendship' },
      { text: 'Ambitious', icon: '🚀', category: 'friendship' },
      { text: 'Social', icon: '💬', category: 'friendship' },
      { text: 'Patient', icon: '🧘', category: 'friendship' },
      { text: 'Creative', icon: '🎨', category: 'friendship' },
    ],
  },

  friends: {
    id: 'friends',
    name: 'Friends',
    emoji: '👥',
    subtitle: 'Friendship',
    description: 'How well do you really know each other',
    questions: [
      { text: 'Reliable', icon: '🛡️', category: 'friendship' },
      { text: 'Fun', icon: '🎉', category: 'friendship' },
      { text: 'Supportive', icon: '🤝', category: 'friendship' },
      { text: 'Open', icon: '💬', category: 'friendship' },
      { text: 'Active', icon: '⚡', category: 'friendship' },
      { text: 'Caring', icon: '💝', category: 'friendship' },
      { text: 'Adventurous', icon: '🎢', category: 'friendship' },
      { text: 'Wise', icon: '🦉', category: 'friendship' },
    ],
  },

  office: {
    id: 'office',
    name: 'Office',
    emoji: '💼',
    subtitle: 'Work',
    description: 'How you see each other at work',
    questions: [
      { text: 'Meets deadlines', icon: '⏱️', category: 'work' },
      { text: 'Team player', icon: '🤝', category: 'work' },
      { text: 'Proactive', icon: '🚀', category: 'work' },
      { text: 'Transparent', icon: '💬', category: 'work' },
      { text: 'Responsible', icon: '🛡️', category: 'work' },
      { text: 'Stress-resistant', icon: '🧊', category: 'work' },
      { text: 'Creative', icon: '🎨', category: 'work' },
      { text: 'Mentoring', icon: '🧭', category: 'work' },
    ],
  },

  sport: {
    id: 'sport',
    name: 'Sport',
    emoji: '⚽',
    subtitle: 'Active Life',
    description: 'Rate each others athletic abilities',
    questions: [
      { text: 'Speed', icon: '⚡', category: 'sport' },
      { text: 'Strength', icon: '💪', category: 'sport' },
      { text: 'Endurance', icon: '🔋', category: 'sport' },
      { text: 'Technique', icon: '🎯', category: 'sport' },
      { text: 'Team spirit', icon: '🤝', category: 'sport' },
      { text: 'Leadership', icon: '👑', category: 'sport' },
      { text: 'Motivation', icon: '🔥', category: 'sport' },
      { text: 'Competitive', icon: '🏆', category: 'sport' },
    ],
  },

  parents: {
    id: 'parents',
    name: 'Parents',
    emoji: '👨‍👩‍👧',
    subtitle: 'Family',
    description: 'Play with mom or dad - see how they perceive you',
    questions: [
      { text: 'Caring', icon: '💕', category: 'community' },
      { text: 'Independent', icon: '🦋', category: 'community' },
      { text: 'Grateful', icon: '🙏', category: 'community' },
      { text: 'Honest', icon: '💎', category: 'community' },
      { text: 'Ambitious', icon: '🚀', category: 'community' },
      { text: 'Patient', icon: '🧘', category: 'community' },
      { text: 'Funny', icon: '😄', category: 'community' },
      { text: 'Responsible', icon: '⚖️', category: 'community' },
    ],
  },
}

export const getQuestionPack = (packId: string): QuestionPack | null => {
  return QUESTION_PACKS[packId] || null
}

export const getAllPackIds = (): string[] => {
  return Object.keys(QUESTION_PACKS)
}
