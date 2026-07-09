import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Replace these configurations with your Firebase Project keys from the Firebase Console
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || "AIzaSyChNQLp-aopp_GUisWjmsqW3C0GDVFJXPs",
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || "tallybird-e6c76.firebaseapp.com",
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || "tallybird-e6c76",
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || "tallybird-e6c76.firebasestorage.app",
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || "383550693411",
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || "1:383550693411:web:26b1cf21f7c99a400e9196"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
