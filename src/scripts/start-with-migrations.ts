"use server";

import { runMigrations } from '@/lib/db-migrations';
import { checkDatabaseConnection } from '@/lib/db';
import { spawn } from 'child_process';

/**
 * Script to run migrations and then start the development server
 */
export async function runMigrationsAndStartServer() {
  try {
    console.log('Checking database connection...');
    const connectionResult = await checkDatabaseConnection();
    
    if (!connectionResult.connected) {
      console.error('Database connection failed:', connectionResult.error);
      return { success: false, message: `Database connection failed: ${connectionResult.error}` };
    }
    
    console.log('Database connection successful. Running migrations...');
    const migrationResult = await runMigrations();
    console.log('Migration completed with result:', migrationResult);
    
    console.log('Starting development server...');
    // Start the Next.js development server
    const nextDev = spawn('npm', ['run', 'dev'], { 
      stdio: 'inherit',
      shell: true
    });
    
    nextDev.on('error', (error) => {
      console.error('Failed to start development server:', error);
    });
    
    return { success: true, message: 'Migrations completed and server started' };
  } catch (error) {
    console.error('Error in startup process:', error);
    return { 
      success: false, 
      message: `Error in startup process: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  runMigrationsAndStartServer()
    .then(result => {
      console.log(result.message);
      // Don't exit process as we want the server to keep running
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
