import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setDemoProfile: (role: 'worker' | 'employer' | 'admin' | 'super_admin') => void;
  isDemo: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (isDemo) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        const unsubscribeProfile = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as Profile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile fetch error:", error);
          setLoading(false);
        });
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isDemo]);

  const signOut = async () => {
    if (isDemo) {
      setIsDemo(false);
      setProfile(null);
      setUser(null);
    } else {
      await firebaseSignOut(auth);
    }
  };

  const setDemoProfile = (role: 'worker' | 'employer' | 'admin' | 'super_admin') => {
    setIsDemo(true);
    setUser({
      uid: `demo_${role}`,
      email: `demo_${role}@example.com`,
      displayName: `Demo ${role.replace('_', ' ')}`,
    } as any);
    
    setProfile({
      uid: `demo_${role}`,
      fullName: `Demo ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}`,
      role: role,
      region: 'Samarqand viloyati',
      district: 'Samarqand shahar',
      phoneNumber: '+998 90 123 45 67',
      isVerified: true,
      rating: 4.8,
      reviewCount: 12,
      completedJobs: 5,
      createdAt: new Date().toISOString(),
    } as Profile);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, setDemoProfile, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
