// Utility functions

// Generate a random 6-digit room code
export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check if two numbers are close (for detecting matches)
export function areClose(a: number, b: number, threshold: number = 2): boolean {
  return Math.abs(a - b) <= threshold
}

// Calculate gap between two ratings
export function calculateGap(rating1: number, rating2: number): number {
  return Math.abs(rating1 - rating2)
}

// Get a fun message based on gap size
export function getGapMessage(gap: number): string {
  if (gap === 0) return 'Идеальное совпадение! 💯'
  if (gap <= 1) return 'Почти одинаково! 🎯'
  if (gap <= 2) return 'Близко к истине 👍'
  if (gap <= 3) return 'Небольшое расхождение 🤔'
  if (gap <= 5) return 'Заметная разница 😅'
  return 'Совсем разные взгляды! 😱'
}

// Get motivational messages for results
export const RESULT_MESSAGES = {
  highMatch: [
    'You two are surprisingly in sync 💞',
    'Вы отлично понимаете друг друга! 🌟',
    'Настоящая гармония! ✨',
  ],
  mediumMatch: [
    'Есть над чем поработать, но вы на правильном пути 🎯',
    'Интересный результат! 🧐',
    'У вас свои особенности 🌈',
  ],
  lowMatch: [
    'Противоположности притягиваются! 🧲',
    'Вы очень разные, и это здорово! 🎨',
    'Каждый видит мир по-своему 🌍',
  ],
  funnyGap: [
    'Funny gap: кто-то переоценивает свою пунктуальность 😅',
    'Интересно, кто тут врёт? 🤥',
    'Мнения разошлись! 🎭',
  ],
}

// Get random message from array
export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

// Format session code for display
export function formatCode(code: string): string {
  return code.match(/.{1,3}/g)?.join('-') || code
}



