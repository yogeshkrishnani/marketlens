import {
  registerWithEmailAndPassword,
  resetPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmail,
  signInWithGoogle,
  signOut,
  subscribeToAuthChanges,
} from '@services/firebase/auth';
import { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Props for the AuthProvider component
interface AuthProviderProps {
  children: React.ReactNode;
}

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect to subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Auth functions
  const signIn = async (email: string, password: string): Promise<User> => {
    return firebaseSignInWithEmail(email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<User> => {
    return registerWithEmailAndPassword(email, password, displayName);
  };

  const googleSignIn = async (): Promise<User> => {
    return signInWithGoogle();
  };

  const logout = async (): Promise<void> => {
    return signOut();
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    return resetPassword(email);
  };

  // Value for the context provider
  const value: AuthContextType = {
    currentUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle: googleSignIn,
    logout,
    resetPassword: sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
