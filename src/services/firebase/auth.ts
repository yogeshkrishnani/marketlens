import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from 'firebase/auth';

import { auth } from './config';

/**
 * Authentication service for Firebase
 */

// Register a new user with email and password
export const registerWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName?: string
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Update profile if displayName is provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
    // Send email verification
    await sendEmailVerification(userCredential.user);
  }

  return userCredential.user;
};

// Sign in with email and password
export const signInWithEmailAndPassword = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await firebaseSignInWithEmail(auth, email, password);
  return userCredential.user;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  return userCredential.user;
};

// Sign out the current user
export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(auth, email);
};

// Listen to authentication state changes
export const subscribeToAuthChanges = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get the current authenticated user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
