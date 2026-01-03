

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authService, dbService } from '../services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string, role: UserRole, address: string, location?: {lat: number, lng: number}, govtIdFile?: File | null, ngoLicense?: string, vehicleNumber?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await dbService.getUser(firebaseUser.uid);
          if (userData) {
            // Check active status on auto-login too
            if (userData.is_active) {
                setUser(userData);
            } else {
                // If inactive, don't set global user state, forcing them to login screen or public area
                // We don't force logout here to allow the signup flow to complete and then redirect
                console.log("User is pending approval");
                setUser(null);
            }
          }
        } catch (e) {
          console.error("Error fetching user profile", e);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedUser = await authService.login(email, password);
    setUser(loggedUser);
  };

  const signup = async (name: string, email: string, phone: string, password: string, role: UserRole, address: string, location?: {lat: number, lng: number}, govtIdFile?: File | null, ngoLicense?: string, vehicleNumber?: string) => {
    const newUser = await authService.signup(name, email, phone, password, role, address, location, govtIdFile, ngoLicense, vehicleNumber);
    // Do NOT set user state here. We want them to remain "logged out" in the context
    // until approved, but the signup success needs to trigger the redirect to pending page.
    // However, firebase auto-logs in on create. We should sign them out immediately in the service or here.
    await authService.logout();
    setUser(null);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (user) {
      const updatedUser = await dbService.getUser(user.uid);
      if (updatedUser) {
        setUser(updatedUser);
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};