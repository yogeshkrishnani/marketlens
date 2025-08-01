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

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  createdAt?: any;
  updatedAt?: any;
  settings?: {
    themeSyncWithSystem: boolean;
    defaultChartPeriod: string;
    defaultDataRefreshInterval: number;
    showAdvancedMetrics: boolean;
    emailNotifications: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
  };
  lastLogin?: any;
}

export const defaultUserSettings = {
  themeSyncWithSystem: true,
  defaultChartPeriod: '1M',
  defaultDataRefreshInterval: 60,
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
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
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

    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data() as UserProfile;
    const currentSettings = userData.settings || defaultUserSettings;

    const updatedSettings = {
      ...currentSettings,
      ...settings,
    };

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
