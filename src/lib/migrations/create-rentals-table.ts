"use server";

import { sql } from '@/lib/db';

/**
 * Creates the rentals table to track vehicle rentals
 * Simple structure where the app manager enters customer information directly
 */
export async function createRentalsTable() {
  try {
    // Create the rentals table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS rentals (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        daily_rate DECIMAL(10, 2) NOT NULL,
        total_cost DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        notes TEXT,
        user_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `;
    
    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id ON rentals(vehicle_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id)
    `;
    
    console.log('Rentals table created successfully');
    return { success: true, message: 'Rentals table created successfully' };
  } catch (error) {
    console.error('Error creating rentals table:', error);
    return { success: false, message: 'Error creating rentals table', error };
  }
}
