"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Get the current user's ID from Clerk
 * Returns null if the user is not authenticated
 * Includes error handling for JWT validation errors
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error('Authentication error:', error);
    // If there's a JWT validation error, we return null to indicate no authentication
    return null;
  }
}

/**
 * Check if the user is authenticated
 * Useful for server components and actions
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}

/**
 * Get the current user's username from Clerk
 * Returns the username or email if available, otherwise returns 'User'
 */
export async function getCurrentUsername(): Promise<string> {
  const user = await currentUser();
  
  if (!user) {
    return 'User';
  }
  
  // Try to get username from various sources
  return user.username || 
         user.firstName || 
         user.emailAddresses[0]?.emailAddress || 
         `User-${user.id.substring(0, 8)}`;
}
