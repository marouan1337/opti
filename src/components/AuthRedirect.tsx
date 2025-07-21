'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthRedirect() {
  const { isLoaded, userId, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // If the user is authenticated, redirect to dashboard
      router.push('/dashboard');
    }
  }, [isLoaded, userId, isSignedIn, router]);

  return null; // This component doesn't render anything
}
