import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
// You'll need to replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyAuJFcyHKQWXFShnt9hyjX-HgtqLAyN6YA",
  authDomain: "smart-summer-darnells.firebaseapp.com",
  projectId: "smart-summer-darnells",
  storageBucket: "smart-summer-darnells.firebasestorage.app",
  messagingSenderId: "30610041985",
  appId: "1:30610041985:web:337107797fc674b30c3180",
  measurementId: "G-1GQ6CE20G5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.useDeviceLanguage();
auth.settings.appVerificationDisabledForTesting = true; // Only for development

// Configure Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
}); 