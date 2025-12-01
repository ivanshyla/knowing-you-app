export type SkillCategory = 'football' | 'basketball' | 'volleyball' | 'general'

export type Skill = {
  id: string
  name: string
  icon: string
  category: SkillCategory
  description: string
}

export type SkillPack = {
  id: string
  name: string
  sport: string
  emoji: string
  description: string
  skills: Skill[]
}

export const SKILL_PACKS: Record<string, SkillPack> = {
  football: {
    id: 'football',
    name: 'Футбол',
    sport: 'Футбол',
    emoji: '⚽',
    description: 'Оцени навыки игроков твоей команды',
    skills: [
      { id: 'speed', name: 'Скорость', icon: '⚡', category: 'football', description: 'Насколько быстро бегает' },
      { id: 'technique', name: 'Техника', icon: '🎯', category: 'football', description: 'Владение мячом' },
      { id: 'pass', name: 'Пас', icon: '🎪', category: 'football', description: 'Точность передач' },
      { id: 'shot', name: 'Удар', icon: '💥', category: 'football', description: 'Сила и точность удара' },
      { id: 'defense', name: 'Защита', icon: '🛡️', category: 'football', description: 'Умение отбирать мяч' },
      { id: 'stamina', name: 'Выносливость', icon: '💪', category: 'football', description: 'Может играть долго' },
      { id: 'positioning', name: 'Позиционка', icon: '🎲', category: 'football', description: 'Выбор позиции на поле' },
      { id: 'leadership', name: 'Лидерство', icon: '👑', category: 'football', description: 'Ведет команду за собой' },
    ],
  },
  basketball: {
    id: 'basketball',
    name: 'Баскетбол',
    sport: 'Баскетбол',
    emoji: '🏀',
    description: 'Оцени навыки игроков на площадке',
    skills: [
      { id: 'shooting', name: 'Бросок', icon: '🎯', category: 'basketball', description: 'Точность бросков' },
      { id: 'dribbling', name: 'Дриблинг', icon: '🏃', category: 'basketball', description: 'Ведение мяча' },
      { id: 'defense_b', name: 'Защита', icon: '🛡️', category: 'basketball', description: 'Игра в защите' },
      { id: 'rebound', name: 'Подбор', icon: '🔄', category: 'basketball', description: 'Подбор мяча' },
      { id: 'pass_b', name: 'Передача', icon: '🤝', category: 'basketball', description: 'Точность пасов' },
      { id: 'athleticism', name: 'Атлетизм', icon: '💪', category: 'basketball', description: 'Прыжок и сила' },
      { id: 'iq', name: 'IQ игры', icon: '🧠', category: 'basketball', description: 'Понимание игры' },
      { id: 'clutch', name: 'Клатч', icon: '🔥', category: 'basketball', description: 'Игра в решающие моменты' },
    ],
  },
  volleyball: {
    id: 'volleyball',
    name: 'Волейбол',
    sport: 'Волейбол',
    emoji: '🏐',
    description: 'Оцени команду на волейбольной площадке',
    skills: [
      { id: 'serve', name: 'Подача', icon: '💨', category: 'volleyball', description: 'Сила и точность подачи' },
      { id: 'spike', name: 'Нападающий удар', icon: '💥', category: 'volleyball', description: 'Атакующий удар' },
      { id: 'block', name: 'Блок', icon: '🙌', category: 'volleyball', description: 'Блокирование' },
      { id: 'receive', name: 'Прием', icon: '🤲', category: 'volleyball', description: 'Прием подачи' },
      { id: 'set', name: 'Пас (передача)', icon: '🎯', category: 'volleyball', description: 'Точность паса' },
      { id: 'jump', name: 'Прыжок', icon: '🦘', category: 'volleyball', description: 'Высота прыжка' },
      { id: 'reaction', name: 'Реакция', icon: '⚡', category: 'volleyball', description: 'Скорость реакции' },
      { id: 'teamwork_v', name: 'Командная игра', icon: '🤝', category: 'volleyball', description: 'Взаимодействие с командой' },
    ],
  },
  general: {
    id: 'general',
    name: 'Универсальный',
    sport: 'Любой спорт',
    emoji: '🏆',
    description: 'Общие спортивные навыки',
    skills: [
      { id: 'speed_g', name: 'Скорость', icon: '⚡', category: 'general', description: 'Общая скорость' },
      { id: 'strength', name: 'Сила', icon: '💪', category: 'general', description: 'Физическая сила' },
      { id: 'endurance', name: 'Выносливость', icon: '🔋', category: 'general', description: 'Стойкость' },
      { id: 'agility', name: 'Ловкость', icon: '🤸', category: 'general', description: 'Координация' },
      { id: 'teamwork', name: 'Командность', icon: '🤝', category: 'general', description: 'Игра в команде' },
      { id: 'motivation', name: 'Мотивация', icon: '🔥', category: 'general', description: 'Желание побеждать' },
      { id: 'discipline', name: 'Дисциплина', icon: '📋', category: 'general', description: 'Следование правилам' },
      { id: 'competitive', name: 'Конкурентность', icon: '🏆', category: 'general', description: 'Дух соперничества' },
    ],
  },
}

export const getSkillPack = (packId: string): SkillPack | null => {
  return SKILL_PACKS[packId] || null
}

export const getAllPackIds = (): string[] => {
  return Object.keys(SKILL_PACKS)
}



