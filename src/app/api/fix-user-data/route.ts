import { NextResponse } from 'next/server';
import { fixUserData } from '@/scripts/fix-user-data';

export async function GET() {
  try {
    const result = await fixUserData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running fix-user-data:', error);
    return NextResponse.json({ success: false, message: 'Error running fix-user-data', error }, { status: 500 });
  }
}

// This will also run the fix-user-data script
export async function POST() {
  return GET();
}
