// src/features/auth/services/userProfileService.ts
import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/services/firebase/config';

// User profile interface
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  settings?: {
    // Theme preferences
    themeSyncWithSystem: boolean;

    // Data display preferences
    defaultChartPeriod: string;
    defaultDataRefreshInterval: number;
    showAdvancedMetrics: boolean;

    // Notification preferences
    emailNotifications: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
  };
  lastLogin?: any; // Firestore timestamp
}

// Default user settings
export const defaultUserSettings = {
  themeSyncWithSystem: true,
  defaultChartPeriod: '1M',
  defaultDataRefreshInterval: 60, // seconds
  showAdvancedMetrics: false,
  emailNotifications: true,
  priceAlerts: false,
  newsAlerts: false,
};

/**
 * Create or update a user profile document in Firestore
 */
export const createUserProfile = async (user: User): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);

  try {
    // Check if the user document already exists
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Update the existing user document
      await updateDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create a new user document
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        settings: defaultUserSettings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

/**
 * Get a user profile from Firestore
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile data in Firestore
 */
export const updateUserProfileData = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);

    // Add updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update user settings in Firestore
 */
export const updateUserSettings = async (
  userId: string,
  settings: Partial<UserProfile['settings']>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);

    // Get current settings first
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data() as UserProfile;
    const currentSettings = userData.settings || defaultUserSettings;

    // Merge current settings with new settings
    const updatedSettings = {
      ...currentSettings,
      ...settings,
    };

    // Update settings in Firestore
    await updateDoc(userRef, {
      settings: updatedSettings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

/**
 * Subscribe to user profile changes in real-time
 */
export const subscribeToUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe => {
  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    doc => {
      if (doc.exists()) {
        callback(doc.data() as UserProfile);
      } else {
        callback(null);
      }
    },
    error => {
      console.error('Error subscribing to user profile:', error);
      callback(null);
    }
  );
};
