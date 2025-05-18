import { AuthProvider, useAuth } from './contexts/AuthContext'
import { StreakProvider } from './contexts/StreakContext'
import Login from './pages/Login'
import { userProfiles } from './config/profiles'
import AIConversation from './components/AIConversation'

function AppContent() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Login />;
  }

  const userProfile = userProfiles[user.email || ''];
  
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This email is not authorized to use SmartSummer.
            </p>
            <button
              onClick={logout}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              SmartSummer
            </h1>
            <p className="text-sm text-gray-500">
              Welcome, {userProfile.name}!
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-12rem)]">
            <AIConversation />
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <StreakProvider>
        <AppContent />
      </StreakProvider>
    </AuthProvider>
  )
}

export default App 