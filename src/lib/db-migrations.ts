"use server";

import { sql } from '@/lib/db';
import { createUsersTable } from './migrations/create-users-table';
import { createRentalsTable } from './migrations/create-rentals-table';
import { createCustomersTable } from './migrations/create-customers-table';
import { createVehiclesTable } from './migrations/create-vehicles-table';
import { createMaintenanceTable } from './migrations/create-maintenance-table';
import { createDriversTable } from './migrations/create-drivers-table';

/**
 * Add user_id column to existing tables
 */
export async function addUserIdToTables(): Promise<{ success: boolean; message: string }> {
  try {
    // Add user_id to vehicles table
    await sql`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)
    `;
    
    // Add user_id to drivers table
    await sql`
      ALTER TABLE drivers
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)
    `;
    
    // Add user_id to maintenance_records table
    await sql`
      ALTER TABLE maintenance_records
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)
    `;
    
    // Add user_id to rentals table
    await sql`
      ALTER TABLE rentals
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)
    `;
    
    // Add user_id to customers table
    await sql`
      ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)
    `;
    
    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_maintenance_user_id ON maintenance_records(user_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id)
    `;
    
    return { 
      success: true, 
      message: 'Successfully added user_id columns to all tables' 
    };
  } catch (error) {
    console.error('Error adding user_id columns:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Run this migration when the application starts
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('Running database migrations...');
    
    // Add user_id columns to existing tables
    const userIdResult = await addUserIdToTables();
    console.log('User ID columns migration result:', userIdResult);
    
    // Create users table if it doesn't exist
    const usersTableResult = await createUsersTable();
    console.log('Users table migration result:', usersTableResult);
    
    // Create vehicles table if it doesn't exist
    const vehiclesTableResult = await createVehiclesTable();
    console.log('Vehicles table migration result:', vehiclesTableResult);
    
    // Create drivers table if it doesn't exist
    const driversTableResult = await createDriversTable();
    console.log('Drivers table migration result:', driversTableResult);
    
    // Create maintenance records table if it doesn't exist
    const maintenanceTableResult = await createMaintenanceTable();
    console.log('Maintenance records table migration result:', maintenanceTableResult);
    
    // Create rentals table if it doesn't exist
    const rentalsTableResult = await createRentalsTable();
    console.log('Rentals table migration result:', rentalsTableResult);
    
    // Create customers table if it doesn't exist
    const customersTableResult = await createCustomersTable();
    console.log('Customers table migration result:', customersTableResult);
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
