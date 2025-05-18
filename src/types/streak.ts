export interface Streak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // ISO date string
  streakHistory: {
    date: string;
    action: string;
  }[];
}

export interface StreakAchievement {
  id: string;
  name: string;
  description: string;
  requiredStreak: number;
  icon: string;
  unlocked: boolean;
}

export const STREAK_ACHIEVEMENTS: StreakAchievement[] = [
  {
    id: '3-day',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    requiredStreak: 3,
    icon: '🌱',
    unlocked: false
  },
  {
    id: '7-day',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    requiredStreak: 7,
    icon: '🔥',
    unlocked: false
  },
  {
    id: '14-day',
    name: 'Fortnight Fighter',
    description: 'Maintain a 14-day streak',
    requiredStreak: 14,
    icon: '⚡',
    unlocked: false
  },
  {
    id: '30-day',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    requiredStreak: 30,
    icon: '👑',
    unlocked: false
  },
  {
    id: '100-day',
    name: 'Century Champion',
    description: 'Maintain a 100-day streak',
    requiredStreak: 100,
    icon: '🏆',
    unlocked: false
  }
]; 