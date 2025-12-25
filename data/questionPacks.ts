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
    name: 'Романтика',
    emoji: '💕',
    subtitle: 'Для пар',
    description: 'Узнайте, как вы видите друг друга в отношениях',
    questions: [
      { text: 'Романтичность', icon: '💘', category: 'relationship' },
      { text: 'Страстность', icon: '🔥', category: 'relationship' },
      { text: 'Внимательность', icon: '👀', category: 'relationship' },
      { text: 'Нежность', icon: '🤗', category: 'relationship' },
      { text: 'Доверие', icon: '🤝', category: 'relationship' },
      { text: 'Ревнивость', icon: '👁️', category: 'relationship' },
      { text: 'Спонтанность', icon: '🎲', category: 'relationship' },
      { text: 'Эмоциональность', icon: '💭', category: 'relationship' },
    ],
  },
  
  everyday: {
    id: 'everyday',
    name: 'Бытовуха',
    emoji: '🏠',
    subtitle: 'Совместная жизнь',
    description: 'Как вы справляетесь с повседневностью',
    questions: [
      { text: 'Чистоплотность', icon: '🧹', category: 'relationship' },
      { text: 'Готовка', icon: '👨‍🍳', category: 'relationship' },
      { text: 'Пунктуальность', icon: '⏰', category: 'relationship' },
      { text: 'Организованность', icon: '📋', category: 'relationship' },
      { text: 'Лень', icon: '😴', category: 'relationship' },
      { text: 'Экономность', icon: '💰', category: 'relationship' },
      { text: 'Щедрость', icon: '🎁', category: 'relationship' },
      { text: 'Упрямство', icon: '🐂', category: 'relationship' },
    ],
  },

  intimacy: {
    id: 'intimacy',
    name: 'Страсть',
    emoji: '🫦',
    subtitle: 'Близость',
    description: 'Насколько вы чувствуете друг друга',
    questions: [
      { text: 'Инициатива', icon: '🔥', category: 'intimacy' },
      { text: 'Фантазия', icon: '💭', category: 'intimacy' },
      { text: 'Чувственность', icon: '💋', category: 'intimacy' },
      { text: 'Эксперименты', icon: '🧪', category: 'intimacy' },
      { text: 'Темп', icon: '🎚️', category: 'intimacy' },
      { text: 'Коммуникация', icon: '🗣️', category: 'intimacy' },
      { text: 'Уверенность', icon: '💪', category: 'intimacy' },
      { text: 'Забота после', icon: '🫶', category: 'intimacy' },
    ],
  },

  character: {
    id: 'character',
    name: 'Характер',
    emoji: '🎭',
    subtitle: 'Личность',
    description: 'Какой ты человек на самом деле',
    questions: [
      { text: 'Чувство юмора', icon: '😄', category: 'friendship' },
      { text: 'Уверенность', icon: '💪', category: 'friendship' },
      { text: 'Доброта', icon: '😇', category: 'friendship' },
      { text: 'Честность', icon: '🤐', category: 'friendship' },
      { text: 'Амбициозность', icon: '🚀', category: 'friendship' },
      { text: 'Общительность', icon: '💬', category: 'friendship' },
      { text: 'Терпеливость', icon: '🧘', category: 'friendship' },
      { text: 'Креативность', icon: '🎨', category: 'friendship' },
    ],
  },

  friends: {
    id: 'friends',
    name: 'Дружба',
    emoji: '👥',
    subtitle: 'Для друзей',
    description: 'Насколько хорошо вы знаете друг друга',
    questions: [
      { text: 'Надёжность', icon: '🛡️', category: 'friendship' },
      { text: 'Веселье', icon: '🎉', category: 'friendship' },
      { text: 'Поддержка', icon: '🤝', category: 'friendship' },
      { text: 'Откровенность', icon: '💬', category: 'friendship' },
      { text: 'Активность', icon: '⚡', category: 'friendship' },
      { text: 'Заботливость', icon: '💝', category: 'friendship' },
      { text: 'Авантюризм', icon: '🎢', category: 'friendship' },
      { text: 'Мудрость', icon: '🦉', category: 'friendship' },
    ],
  },

  office: {
    id: 'office',
    name: 'Коллеги',
    emoji: '💼',
    subtitle: 'В офисе',
    description: 'Как вы видите друг друга на работе',
    questions: [
      { text: 'Дедлайны', icon: '⏱️', category: 'work' },
      { text: 'Командность', icon: '🤝', category: 'work' },
      { text: 'Инициативность', icon: '🚀', category: 'work' },
      { text: 'Прозрачность', icon: '💬', category: 'work' },
      { text: 'Ответственность', icon: '🛡️', category: 'work' },
      { text: 'Стрессоустойчивость', icon: '🧊', category: 'work' },
      { text: 'Креативность', icon: '🎨', category: 'work' },
      { text: 'Наставничество', icon: '🧭', category: 'work' },
    ],
  },

  sport: {
    id: 'sport',
    name: 'Спорт',
    emoji: '⚽',
    subtitle: 'Для команды',
    description: 'Оцените навыки друг друга',
    questions: [
      { text: 'Скорость', icon: '⚡', category: 'sport' },
      { text: 'Сила', icon: '💪', category: 'sport' },
      { text: 'Выносливость', icon: '🔋', category: 'sport' },
      { text: 'Техника', icon: '🎯', category: 'sport' },
      { text: 'Командность', icon: '🤝', category: 'sport' },
      { text: 'Лидерство', icon: '👑', category: 'sport' },
      { text: 'Мотивация', icon: '🔥', category: 'sport' },
      { text: 'Конкурентность', icon: '🏆', category: 'sport' },
    ],
  },

  club: {
    id: 'club',
    name: 'Одноклубники',
    emoji: '🎯',
    subtitle: 'Комьюнити',
    description: 'Как вы представляете друг друга в клубе или хобби',
    questions: [
      { text: 'Энергия на встречах', icon: '⚡', category: 'community' },
      { text: 'Вовлечённость', icon: '📍', category: 'community' },
      { text: 'Поддержка', icon: '🙌', category: 'community' },
      { text: 'Организация', icon: '📅', category: 'community' },
      { text: 'Идеи для клуба', icon: '💡', category: 'community' },
      { text: 'Чувство юмора', icon: '😄', category: 'community' },
      { text: 'Эксперименты', icon: '🧪', category: 'community' },
      { text: 'Надёжность', icon: '🛡️', category: 'community' },
    ],
  },
}

export const getQuestionPack = (packId: string): QuestionPack | null => {
  return QUESTION_PACKS[packId] || null
}

export const getAllPackIds = (): string[] => {
  return Object.keys(QUESTION_PACKS)
}
