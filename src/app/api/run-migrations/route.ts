import { NextResponse } from 'next/server';
import { runMigrations } from '@/lib/db-migrations';
import { checkDatabaseConnection } from '@/lib/db';

export async function GET() {
  try {
    console.log('Checking database connection...');
    const connectionResult = await checkDatabaseConnection();
    
    if (!connectionResult.connected) {
      console.error('Database connection failed:', connectionResult.error);
      return NextResponse.json({ 
        success: false, 
        message: `Database connection failed: ${connectionResult.error}` 
      }, { status: 500 });
    }
    
    console.log('Database connection successful. Running migrations...');
    await runMigrations();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database migrations completed successfully' 
    });
  } catch (error) {
    console.error('Error running migrations:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error running migrations: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}
