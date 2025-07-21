import { NextResponse } from 'next/server';
import { resetUserData } from '@/scripts/reset-user-data';

export async function GET() {
  try {
    const result = await resetUserData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running reset-user-data:', error);
    return NextResponse.json({ success: false, message: 'Error running reset-user-data', error }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
