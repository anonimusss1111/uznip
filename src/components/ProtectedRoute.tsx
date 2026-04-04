import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Yuklanmoqda...</div>;
  if (!user) return <Navigate to="/auth" />;

  return <>{children}</>;
}
