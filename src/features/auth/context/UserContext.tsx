import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  createUserProfile,
  subscribeToUserProfile,
  UserProfile,
} from '../services/userProfileService';

import { useAuth } from './AuthContext';

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUserProfile = async () => {
    if (!currentUser) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      await createUserProfile(currentUser);
    } catch (err: any) {
      console.error('Error refreshing user profile:', err);
      setError(err.message || 'Failed to refresh user profile');
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const subscribeToProfile = () => {
      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      createUserProfile(currentUser).catch(err => {
        console.error('Error creating/updating user profile:', err);
      });

      unsubscribe = subscribeToUserProfile(currentUser.uid, profile => {
        setUserProfile(profile);
        setLoading(false);
      });
    };

    subscribeToProfile();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const value: UserContextType = {
    userProfile,
    loading,
    error,
    refreshUserProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
