'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on role
        if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Redirect to login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
