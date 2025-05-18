import { StreakAchievement } from '../types/streak';

export const calculateStreak = (lastActivityDate: string): number => {
  const lastDate = new Date(lastActivityDate);
  const today = new Date();
  
  // Reset time to midnight for accurate day comparison
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // If last activity was yesterday, increment streak
  if (diffDays === 1) {
    return 1; // Start with 1 for today's activity
  }
  // If last activity was today, maintain streak
  else if (diffDays === 0) {
    return 1;
  }
  // If more than a day has passed, streak is broken
  else {
    return 0;
  }
};

export const updateStreakAchievements = (
  achievements: StreakAchievement[],
  currentStreak: number
): StreakAchievement[] => {
  return achievements.map(achievement => ({
    ...achievement,
    unlocked: currentStreak >= achievement.requiredStreak
  }));
};

export const formatStreakMessage = (streak: number): string => {
  if (streak === 0) return 'Start your streak today!';
  if (streak === 1) return 'First day of your streak!';
  if (streak < 7) return `Keep it up! ${streak} day streak!`;
  if (streak < 14) return `Amazing! ${streak} day streak!`;
  if (streak < 30) return `Incredible! ${streak} day streak!`;
  return `Legendary! ${streak} day streak!`;
}; 