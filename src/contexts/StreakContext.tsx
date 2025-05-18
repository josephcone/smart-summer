import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Streak, StreakAchievement, STREAK_ACHIEVEMENTS } from '../types/streak';
import { calculateStreak, updateStreakAchievements } from '../utils/streakUtils';

interface StreakContextType {
  streak: Streak | null;
  achievements: StreakAchievement[];
  isLoading: boolean;
  updateStreak: (action: string) => Promise<void>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [achievements, setAchievements] = useState<StreakAchievement[]>(STREAK_ACHIEVEMENTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStreak = async () => {
      if (!user) {
        console.log('No user, setting streak to null');
        setStreak(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Loading streak for user:', user.uid);
        const streakRef = doc(db, 'streaks', user.uid);
        const streakDoc = await getDoc(streakRef);

        if (streakDoc.exists()) {
          console.log('Found existing streak:', streakDoc.data());
          const streakData = streakDoc.data() as Streak;
          setStreak(streakData);
          setAchievements(prevAchievements => 
            updateStreakAchievements(prevAchievements, streakData.currentStreak)
          );
        } else {
          console.log('No streak found, creating new one');
          const newStreak: Streak = {
            userId: user.uid,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: new Date().toISOString(),
            streakHistory: []
          };
          await setDoc(streakRef, newStreak);
          setStreak(newStreak);
        }
      } catch (error) {
        console.error('Error loading streak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [user]);

  const updateStreak = async (action: string) => {
    if (!user || !streak) {
      console.log('Cannot update streak: no user or streak data');
      return;
    }

    try {
      console.log('Updating streak for action:', action);
      const streakRef = doc(db, 'streaks', user.uid);
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have activity for today
      const hasActivityToday = streak.streakHistory.some(
        activity => activity.date.startsWith(today)
      );

      if (!hasActivityToday) {
        console.log('No activity today, updating streak');
        const newStreak = calculateStreak(streak.lastActivityDate);
        const updatedStreak: Streak = {
          ...streak,
          currentStreak: newStreak,
          longestStreak: Math.max(streak.longestStreak, newStreak),
          lastActivityDate: new Date().toISOString(),
          streakHistory: [
            ...streak.streakHistory,
            { date: new Date().toISOString(), action }
          ]
        };

        console.log('Saving updated streak:', updatedStreak);
        await updateDoc(streakRef, updatedStreak);
        setStreak(updatedStreak);
        setAchievements(prevAchievements => 
          updateStreakAchievements(prevAchievements, updatedStreak.currentStreak)
        );
      } else {
        console.log('Already have activity today, not updating streak');
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  return (
    <StreakContext.Provider value={{ streak, achievements, isLoading, updateStreak }}>
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}; 