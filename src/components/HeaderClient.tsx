"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function HeaderClient() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  // Hide header on dashboard and auth pages
  if (isDashboard || isAuthPage) {
    return null;
  }

  return (
    <header className="flex justify-end items-center p-4">
      <SignedOut>
        <div className="space-x-2">
          <SignInButton />
          <SignUpButton />
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
