import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Streak, StreakAchievement, STREAK_ACHIEVEMENTS } from '../types/streak';
import { calculateStreak, updateStreakAchievements } from '../utils/streakUtils';

interface StreakContextType {
  streak: Streak | null;
  achievements: StreakAchievement[];
  updateStreak: (activity: string) => Promise<void>;
  isLoading: boolean;
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
        setIsLoading(false);
        return;
      }

      try {
        const streakRef = doc(db, 'streaks', user.uid);
        const streakDoc = await getDoc(streakRef);

        if (streakDoc.exists()) {
          const streakData = streakDoc.data() as Streak;
          setStreak(streakData);
          setAchievements(updateStreakAchievements(streakData.currentStreak, achievements));
        } else {
          // Initialize new streak
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

  const updateStreak = async (activity: string) => {
    if (!user || !streak) return;

    try {
      const streakRef = doc(db, 'streaks', user.uid);
      const streakCount = calculateStreak(streak.lastActivityDate);
      
      const updatedStreak = {
        ...streak,
        currentStreak: streakCount === 0 ? 1 : streak.currentStreak + 1,
        longestStreak: Math.max(streak.longestStreak, streak.currentStreak + 1),
        lastActivityDate: new Date().toISOString(),
        streakHistory: [
          ...streak.streakHistory,
          { date: new Date().toISOString(), activity }
        ]
      };

      await updateDoc(streakRef, updatedStreak as any);
      setStreak(updatedStreak);
      setAchievements(updateStreakAchievements(updatedStreak.currentStreak, achievements));
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  return (
    <StreakContext.Provider value={{ streak, achievements, updateStreak, isLoading }}>
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