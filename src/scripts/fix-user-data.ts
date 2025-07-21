"use server";

import { sql } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth-utils';
import { runMigrations } from '@/lib/db-migrations';

/**
 * This script will:
 * 1. Run all migrations to ensure user_id columns exist
 * 2. Associate only unassigned data with the current user
 * 3. Ensure data separation between users
 */
export async function fixUserData() {
  try {
    // Step 1: Run migrations to ensure user_id columns exist
    console.log('Running migrations...');
    const migrationResult = await runMigrations();
    console.log('Migration result:', migrationResult);

    // Step 2: Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    console.log('Current user ID:', userId);
    
    // Check if this is the first time this user is logging in
    const userCheck = await sql`
      SELECT 1 FROM vehicles WHERE user_id = ${userId} LIMIT 1
    `;
    
    // Only associate data if this user doesn't have any data yet
    if (userCheck.length === 0) {
      // Step 3: Associate only unassigned vehicles with the current user
      console.log('Associating unassigned vehicles with current user...');
      await sql`
        UPDATE vehicles
        SET user_id = ${userId}
        WHERE user_id IS NULL
      `;

      // Step 4: Associate only unassigned drivers with the current user
      console.log('Associating unassigned drivers with current user...');
      await sql`
        UPDATE drivers
        SET user_id = ${userId}
        WHERE user_id IS NULL
      `;

      // Step 5: Associate only unassigned maintenance records with the current user
      console.log('Associating unassigned maintenance records with current user...');
      await sql`
        UPDATE maintenance_records
        SET user_id = ${userId}
        WHERE user_id IS NULL
      `;
      
      // Step 6: Associate only unassigned rentals with the current user
      console.log('Associating unassigned rentals with current user...');
      await sql`
        UPDATE rentals
        SET user_id = ${userId}
        WHERE user_id IS NULL
      `;
      
      // Step 7: Associate only unassigned customers with the current user
      console.log('Associating unassigned customers with current user...');
      await sql`
        UPDATE customers
        SET user_id = ${userId}
        WHERE user_id IS NULL
      `;
      
      return { 
        success: true, 
        message: 'Unassigned data has been associated with your account' 
      };
    } else {
      console.log('User already has data, skipping association');
      return {
        success: true,
        message: 'User already has data, no changes needed'
      };
    }
  } catch (error) {
    console.error('Error fixing user data:', error);
    return { 
      success: false, 
      message: 'Error fixing user data', 
      error 
    };
  }
}
