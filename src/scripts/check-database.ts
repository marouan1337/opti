"use server";

import { sql, checkDatabaseConnection } from '@/lib/db';

/**
 * Script to check database connection and verify tables exist
 */
export async function checkDatabaseAndTables() {
  try {
    console.log('Checking database connection...');
    const connectionResult = await checkDatabaseConnection();
    
    if (!connectionResult.connected) {
      console.error('Database connection failed:', connectionResult.error);
      return { success: false, message: `Database connection failed: ${connectionResult.error}` };
    }
    
    console.log('Database connection successful. Checking tables...');
    
    // Check if the vehicles table exists
    const vehiclesTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'vehicles'
      ) as exists
    `;
    
    const vehiclesTableExists = vehiclesTableCheck[0]?.exists;
    console.log('Vehicles table exists:', vehiclesTableExists);
    
    // Check if the maintenance_records table exists
    const maintenanceTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'maintenance_records'
      ) as exists
    `;
    
    const maintenanceTableExists = maintenanceTableCheck[0]?.exists;
    console.log('Maintenance records table exists:', maintenanceTableExists);
    
    // Check if the drivers table exists
    const driversTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'drivers'
      ) as exists
    `;
    
    const driversTableExists = driversTableCheck[0]?.exists;
    console.log('Drivers table exists:', driversTableExists);
    
    // Check if the customers table exists
    const customersTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'customers'
      ) as exists
    `;
    
    const customersTableExists = customersTableCheck[0]?.exists;
    console.log('Customers table exists:', customersTableExists);
    
    // Check if the rentals table exists
    const rentalsTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'rentals'
      ) as exists
    `;
    
    const rentalsTableExists = rentalsTableCheck[0]?.exists;
    console.log('Rentals table exists:', rentalsTableExists);
    
    return { 
      success: true, 
      message: 'Database connection and table check completed successfully',
      tables: {
        vehicles: vehiclesTableExists,
        maintenance_records: maintenanceTableExists,
        drivers: driversTableExists,
        customers: customersTableExists,
        rentals: rentalsTableExists
      }
    };
  } catch (error) {
    console.error('Error checking database:', error);
    return { 
      success: false, 
      message: `Error checking database: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  checkDatabaseAndTables()
    .then(result => {
      console.log('Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
