import React from 'react';
import { useStreak } from '../contexts/StreakContext';
import { formatStreakMessage } from '../utils/streakUtils';

export const StreakDisplay: React.FC = () => {
  const { streak, achievements, isLoading } = useStreak();

  if (isLoading) {
    return <div className="streak-display loading">Loading streak...</div>;
  }

  if (!streak) {
    return <div className="streak-display">Start your streak today!</div>;
  }

  const latestAchievement = achievements
    .filter(a => a.unlocked)
    .sort((a, b) => b.requiredStreak - a.requiredStreak)[0];

  return (
    <div className="streak-display">
      <div className="streak-info">
        <div className="streak-count">
          {streak.currentStreak > 0 && '🔥'.repeat(Math.min(streak.currentStreak, 3))}
          <span className="streak-number">{streak.currentStreak}</span>
        </div>
        <div className="streak-message">
          {formatStreakMessage(streak.currentStreak)}
        </div>
      </div>
      
      {latestAchievement && (
        <div className="achievement-badge">
          <span className="achievement-icon">{latestAchievement.icon}</span>
          <span className="achievement-name">{latestAchievement.name}</span>
        </div>
      )}
      
      <div className="streak-stats">
        <div className="longest-streak">
          Longest streak: {streak.longestStreak} days
        </div>
      </div>
    </div>
  );
}; 