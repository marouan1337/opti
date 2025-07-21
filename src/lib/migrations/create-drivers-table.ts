"use server";

import { sql } from '@/lib/db';

/**
 * Create the drivers table if it doesn't exist
 */
export async function createDriversTable(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the table already exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'drivers'
      ) as exists
    `;
    
    if (tableCheck[0]?.exists) {
      return { success: true, message: 'Drivers table already exists' };
    }
    
    // Create the drivers table
    await sql`
      CREATE TABLE drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        license_number VARCHAR(255) NOT NULL,
        license_expiry DATE,
        contact_number VARCHAR(255),
        email VARCHAR(255),
        notes TEXT,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create index for better performance
    await sql`
      CREATE INDEX idx_drivers_user_id ON drivers(user_id)
    `;
    
    return { success: true, message: 'Drivers table created successfully' };
  } catch (error) {
    console.error('Error creating drivers table:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
