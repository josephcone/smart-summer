import React, { createContext, useContext, useState } from 'react';

type ProfileId = 'dorian' | 'elsa';

interface ProfileContextType {
  selectedProfile: ProfileId | null;
  setSelectedProfile: (profileId: ProfileId) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [selectedProfile, setSelectedProfile] = useState<ProfileId | null>(null);

  return (
    <ProfileContext.Provider value={{ selectedProfile, setSelectedProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
} 