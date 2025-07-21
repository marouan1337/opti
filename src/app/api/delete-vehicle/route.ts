import { NextRequest, NextResponse } from 'next/server';
import { deleteVehicleWithRecords } from '@/scripts/delete-vehicle';
import { getCurrentUserId } from '@/lib/auth-utils';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get the current user ID for authorization
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    // Get the vehicle ID from the request body
    const { vehicleId } = await request.json();
    
    if (!vehicleId || isNaN(Number(vehicleId))) {
      return NextResponse.json({ success: false, message: 'Invalid vehicle ID' }, { status: 400 });
    }

    // Verify the vehicle belongs to the current user before deletion
    const vehicleCheck = await sql`
      SELECT id FROM vehicles WHERE id = ${vehicleId} AND user_id = ${userId}
    `;
    
    if (vehicleCheck.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Vehicle not found or you do not have permission to delete it' }, 
        { status: 403 }
      );
    }

    // Delete the vehicle and its maintenance records
    const result = await deleteVehicleWithRecords(Number(vehicleId));
    
    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error) {
    console.error('Error in delete-vehicle API:', error);
    return NextResponse.json(
      { success: false, message: `Server error: ${error instanceof Error ? error.message : String(error)}` }, 
      { status: 500 }
    );
  }
}
