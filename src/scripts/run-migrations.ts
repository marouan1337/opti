"use server";

import { runMigrations } from '@/lib/db-migrations';
import { checkDatabaseConnection } from '@/lib/db';

/**
 * Script to run all database migrations and check database connection
 */
export async function runMigrationsAndCheckConnection() {
  try {
    console.log('Checking database connection...');
    const connectionResult = await checkDatabaseConnection();
    
    if (!connectionResult.connected) {
      console.error('Database connection failed:', connectionResult.error);
      return { success: false, message: `Database connection failed: ${connectionResult.error}` };
    }
    
    console.log('Database connection successful. Running migrations...');
    await runMigrations();
    
    return { success: true, message: 'Database migrations completed successfully' };
  } catch (error) {
    console.error('Error running migrations:', error);
    return { 
      success: false, 
      message: `Error running migrations: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  runMigrationsAndCheckConnection()
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
