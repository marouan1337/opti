"use server";

import { sql } from '@/lib/db';

/**
 * This script will:
 * 1. Make all vehicles visible to all users by setting a common user_id
 * 2. Do the same for drivers and maintenance records
 */
export async function resetUserData() {
  try {
    // Use a common user ID for all data
    const commonUserId = 'shared_data';
    
    console.log('Resetting vehicle user data...');
    await sql`
      UPDATE vehicles
      SET user_id = ${commonUserId}
    `;

    console.log('Resetting driver user data...');
    await sql`
      UPDATE drivers
      SET user_id = ${commonUserId}
    `;

    console.log('Resetting maintenance record user data...');
    await sql`
      UPDATE maintenance_records
      SET user_id = ${commonUserId}
    `;

    return { 
      success: true, 
      message: 'All data has been made visible to all users' 
    };
  } catch (error) {
    console.error('Error resetting user data:', error);
    return { 
      success: false, 
      message: 'Error resetting user data', 
      error 
    };
  }
}
