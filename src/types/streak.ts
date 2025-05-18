export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // ISO date string
  streakHistory: {
    date: string;
    activity: string;
  }[];
}

export interface StreakAchievement {
  id: string;
  name: string;
  description: string;
  requiredStreak: number;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export const STREAK_ACHIEVEMENTS: StreakAchievement[] = [
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    requiredStreak: 3,
    icon: '🔥',
    unlocked: false
  },
  {
    id: 'streak-7',
    name: 'On Fire',
    description: 'Maintain a 7-day streak',
    requiredStreak: 7,
    icon: '🔥🔥',
    unlocked: false
  },
  {
    id: 'streak-14',
    name: 'Unstoppable',
    description: 'Maintain a 14-day streak',
    requiredStreak: 14,
    icon: '🔥🔥🔥',
    unlocked: false
  },
  {
    id: 'streak-30',
    name: 'Legend',
    description: 'Maintain a 30-day streak',
    requiredStreak: 30,
    icon: '👑',
    unlocked: false
  }
]; 