"use server";

import { sql } from '@/lib/db';

/**
 * Create the maintenance_records table if it doesn't exist
 */
export async function createMaintenanceTable(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if the table already exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'maintenance_records'
      ) as exists
    `;
    
    if (tableCheck[0]?.exists) {
      return { success: true, message: 'Maintenance records table already exists' };
    }
    
    // Create the maintenance_records table
    await sql`
      CREATE TABLE maintenance_records (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        service_date DATE NOT NULL,
        service_type VARCHAR(255) NOT NULL,
        description TEXT,
        cost DECIMAL(10, 2),
        odometer_reading INTEGER,
        performed_by VARCHAR(255),
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_vehicle
          FOREIGN KEY(vehicle_id) 
          REFERENCES vehicles(id)
          ON DELETE CASCADE
      )
    `;
    
    // Create indexes for better performance
    await sql`
      CREATE INDEX idx_maintenance_vehicle_id ON maintenance_records(vehicle_id)
    `;
    
    await sql`
      CREATE INDEX idx_maintenance_records_user_id ON maintenance_records(user_id)
    `;
    
    return { success: true, message: 'Maintenance records table created successfully' };
  } catch (error) {
    console.error('Error creating maintenance records table:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
