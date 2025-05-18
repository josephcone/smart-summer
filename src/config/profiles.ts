interface UserProfile {
  id: 'dorian' | 'elsa';
  name: string;
  grade: string;
  interests: string[];
  description: string;
}

export const userProfiles: Record<string, UserProfile> = {
  'dorianconedarnell@gmail.com': {
    id: 'dorian',
    name: 'Dorian',
    grade: '7th Grade',
    interests: ['Reading Comprehension', 'Achievement', 'Learning'],
    description: 'Works hard and achievement-motivated. Focus on building reading confidence.'
  },
  'meridaelsadarnell@gmail.com': {
    id: 'elsa',
    name: 'Elsa',
    grade: '6th Grade',
    interests: ['Science', 'Nature', 'Art'],
    description: 'Avid reader who loves science, nature, and art. Enjoys exploring beyond grade level.'
  }
}; 