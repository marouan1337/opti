import { NextResponse } from 'next/server';
import { transferVehicle, transferAllVehicles } from '@/scripts/transfer-vehicle';
import { isAuthenticated } from '@/lib/auth-utils';

export async function POST(request: Request) {
  try {
    // Check if user is authenticated
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { vehicleId, fromUserId, toUserId } = body;
    
    // Validate request
    if (!toUserId) {
      return NextResponse.json({ success: false, message: 'Target user ID is required' }, { status: 400 });
    }
    
    let result;
    
    // If vehicleId is provided, transfer a single vehicle
    if (vehicleId) {
      result = await transferVehicle(vehicleId, toUserId);
    } 
    // If fromUserId is provided, transfer all vehicles from that user
    else if (fromUserId) {
      result = await transferAllVehicles(fromUserId, toUserId);
    } else {
      return NextResponse.json({ success: false, message: 'Either vehicleId or fromUserId is required' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error transferring vehicle(s):', error);
    return NextResponse.json({ success: false, message: 'Error transferring vehicle(s)', error }, { status: 500 });
  }
}
