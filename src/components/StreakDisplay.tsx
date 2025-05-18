import React from 'react';
import { useStreak } from '../contexts/StreakContext';
import { formatStreakMessage } from '../utils/streakUtils';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  // Get the last 7 days of activity
  const lastWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  // Check if each day had activity
  const weeklyActivity = lastWeek.map(date => {
    const hasActivity = streak.streakHistory.some(
      activity => activity.date.startsWith(date)
    );
    return { date, hasActivity };
  });

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
      
      <div className="weekly-calendar">
        {weeklyActivity.map(({ date, hasActivity }) => {
          const dayOfWeek = DAYS_OF_WEEK[new Date(date).getDay()];
          const isToday = new Date(date).toDateString() === new Date().toDateString();
          
          return (
            <div 
              key={date} 
              className={`calendar-day ${hasActivity ? 'active' : ''} ${isToday ? 'today' : ''}`}
              title={`${dayOfWeek}: ${hasActivity ? 'Completed' : 'No activity'}`}
            >
              <span className="day-label">{dayOfWeek}</span>
              <div className={`day-indicator ${hasActivity ? 'completed' : ''}`}>
                {hasActivity ? '✓' : ''}
              </div>
            </div>
          );
        })}
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