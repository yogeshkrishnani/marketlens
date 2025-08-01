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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
