"use server";

import { sql } from '@/lib/db';

/**
 * Create the vehicles table if it doesn't exist
 */
export async function createVehiclesTable(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the table already exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'vehicles'
      ) as exists
    `;
    
    if (tableCheck[0]?.exists) {
      return { success: true, message: 'Vehicles table already exists' };
    }
    
    // Create the vehicles table
    await sql`
      CREATE TABLE vehicles (
        id SERIAL PRIMARY KEY,
        make VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INTEGER,
        license_plate VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create index for better performance
    await sql`
      CREATE INDEX idx_vehicles_user_id ON vehicles(user_id)
    `;
    
    return { success: true, message: 'Vehicles table created successfully' };
  } catch (error) {
    console.error('Error creating vehicles table:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
