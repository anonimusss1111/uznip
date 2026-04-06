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
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('demo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [profile, setProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('demo_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem('is_demo') === 'true');

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [isDemo]);

  useEffect(() => {
    if (isDemo || !user) return;

    setLoading(true);
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
  }, [user, isDemo]);

  const signOut = async () => {
    if (isDemo) {
      setIsDemo(false);
      setProfile(null);
      setUser(null);
      localStorage.removeItem('is_demo');
      localStorage.removeItem('demo_user');
      localStorage.removeItem('demo_profile');
    } else {
      await firebaseSignOut(auth);
    }
  };

  const setDemoProfile = (role: 'worker' | 'employer' | 'admin' | 'super_admin') => {
    const demoUser = {
      uid: `demo_${role}`,
      email: `demo_${role}@example.com`,
      displayName: `Demo ${role.replace('_', ' ')}`,
    } as any;
    
    const demoProfile = {
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
    } as Profile;

    setIsDemo(true);
    setUser(demoUser);
    setProfile(demoProfile);
    setLoading(false);

    localStorage.setItem('is_demo', 'true');
    localStorage.setItem('demo_user', JSON.stringify(demoUser));
    localStorage.setItem('demo_profile', JSON.stringify(demoProfile));
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
