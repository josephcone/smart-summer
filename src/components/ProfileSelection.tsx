interface Profile {
  id: string;
  name: string;
  grade: string;
  interests: string[];
  description: string;
}

const profiles: Profile[] = [
  {
    id: 'dorian',
    name: 'Dorian',
    grade: '7th Grade',
    interests: ['Reading Comprehension', 'Achievement', 'Learning'],
    description: 'Works hard and achievement-motivated. Focus on building reading confidence.'
  },
  {
    id: 'elsa',
    name: 'Elsa',
    grade: '6th Grade',
    interests: ['Science', 'Nature', 'Art'],
    description: 'Avid reader who loves science, nature, and art. Enjoys exploring beyond grade level.'
  }
];

interface ProfileSelectionProps {
  onSelectProfile: (profileId: string) => void;
}

export default function ProfileSelection({ onSelectProfile }: ProfileSelectionProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Profile
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Select your profile to start your personalized learning journey
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => onSelectProfile(profile.id)}
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-2xl font-bold text-gray-900">{profile.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{profile.grade}</p>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Interests:</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">{profile.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 