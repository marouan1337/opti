import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

// Get the database URL from environment variables or use the hardcoded fallback
// Based on the memory, this is the connection string that was previously working
const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_BfwAD2Frm1Ia@ep-raspy-flower-a83qpcwq-pooler.eastus2.azure.neon.tech/neondb?sslmode=require';

// Create a single database connection instance
export const sql = neon(databaseUrl);

// Helper function to check database connection
export async function checkDatabaseConnection() {
  try {
    // Simple query to test connection
    await sql`SELECT 1`;
    return { connected: true, error: null };
  } catch (error) {
    console.error('Database connection error:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown database connection error' 
    };
  }
}
