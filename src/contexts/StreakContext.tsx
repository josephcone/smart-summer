import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
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
    if (!user) {
      console.log('No user, setting streak to null');
      setStreak(null);
      setIsLoading(false);
      return;
    }

    console.log('Setting up streak listener for user:', user.uid);
    const streakRef = doc(db, 'streaks', user.uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      streakRef,
      (doc) => {
        console.log('Streak snapshot received');
        if (doc.exists()) {
          const data = doc.data();
          console.log('Found existing streak:', data);
          
          // Ensure the data matches our Streak type
          const streakData: Streak = {
            userId: user.uid,
            currentStreak: data.currentStreak || 0,
            longestStreak: data.longestStreak || 0,
            lastActivityDate: data.lastActivityDate || new Date().toISOString(),
            streakHistory: Array.isArray(data.streakHistory) ? data.streakHistory : []
          };
          
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
          
          setDoc(streakRef, newStreak)
            .then(() => {
              console.log('Successfully created new streak');
              setStreak(newStreak);
            })
            .catch((error) => {
              console.error('Error creating new streak:', error);
            });
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error in streak listener:', error);
        setIsLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('Cleaning up streak listener');
      unsubscribe();
    };
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
        try {
          // Convert to plain object for Firestore
          const streakData = {
            userId: updatedStreak.userId,
            currentStreak: updatedStreak.currentStreak,
            longestStreak: updatedStreak.longestStreak,
            lastActivityDate: updatedStreak.lastActivityDate,
            streakHistory: updatedStreak.streakHistory
          };
          await updateDoc(streakRef, streakData);
          console.log('Successfully updated streak in Firestore');
          setStreak(updatedStreak);
          setAchievements(prevAchievements => 
            updateStreakAchievements(prevAchievements, updatedStreak.currentStreak)
          );
        } catch (error) {
          console.error('Error saving streak to Firestore:', error);
        }
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