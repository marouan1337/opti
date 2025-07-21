"use server";

import { sql } from '@/lib/db';
import { getCurrentUserId, getCurrentUsername } from '@/lib/auth-utils';

/**
 * Creates the users table and ensures the current user is registered
 */
export async function createUsersTable() {
  try {
    // Create the users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create index for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)
    `;
    
    // Get current user info
    const userId = await getCurrentUserId();
    const username = await getCurrentUsername();
    
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    
    // Check if the user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE user_id = ${userId}
    `;
    
    if (existingUser.length === 0) {
      // Insert the current user
      await sql`
        INSERT INTO users (user_id, username)
        VALUES (${userId}, ${username})
        ON CONFLICT (user_id) DO UPDATE
        SET username = ${username}
      `;
      console.log(`User ${username} (${userId}) registered in users table`);
    } else {
      // Update username if it changed
      await sql`
        UPDATE users
        SET username = ${username}
        WHERE user_id = ${userId}
      `;
      console.log(`User ${username} (${userId}) information updated`);
    }
    
    return { success: true, message: 'Users table created and current user registered' };
  } catch (error) {
    console.error('Error creating users table:', error);
    return { success: false, message: 'Error creating users table', error };
  }
}
