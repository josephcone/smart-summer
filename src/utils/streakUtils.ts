import { Streak, StreakAchievement } from '../types/streak';

export const calculateStreak = (lastActivityDate: string): number => {
  const lastDate = new Date(lastActivityDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time part for date comparison
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  // If last activity was today or yesterday, streak continues
  if (lastDate.getTime() === today.getTime() || lastDate.getTime() === yesterday.getTime()) {
    return 1; // Streak continues
  }

  // If last activity was more than 1 day ago, streak is broken
  return 0;
};

export const updateStreakAchievements = (
  currentStreak: number,
  achievements: StreakAchievement[]
): StreakAchievement[] => {
  return achievements.map(achievement => ({
    ...achievement,
    unlocked: currentStreak >= achievement.requiredStreak,
    unlockedAt: currentStreak >= achievement.requiredStreak && !achievement.unlocked
      ? new Date().toISOString()
      : achievement.unlockedAt
  }));
};

export const formatStreakMessage = (streak: number): string => {
  if (streak === 0) return 'Start your streak today!';
  if (streak === 1) return 'First day of your streak!';
  return `🔥 ${streak} day streak! Keep it up!`;
}; 