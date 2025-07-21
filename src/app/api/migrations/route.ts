import { NextResponse } from 'next/server';
import { runMigrations } from '@/lib/db-migrations';

export async function GET() {
  try {
    const result = await runMigrations();
    return NextResponse.json({ success: true, message: 'Migrations completed successfully', result });
  } catch (error) {
    console.error('Error running migrations:', error);
    return NextResponse.json({ success: false, message: 'Error running migrations', error }, { status: 500 });
  }
}

// This will also run the migrations
export async function POST() {
  return GET();
}
