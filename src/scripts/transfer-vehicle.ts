"use server";

import { sql } from '@/lib/db';

/**
 * Transfers a vehicle from one user to another
 */
export async function transferVehicle(vehicleId: number, targetUserId: string) {
  try {
    console.log(`Transferring vehicle ${vehicleId} to user ${targetUserId}...`);
    
    // Update the vehicle's user_id
    await sql`
      UPDATE vehicles
      SET user_id = ${targetUserId}
      WHERE id = ${vehicleId}
    `;
    
    // Also update any maintenance records for this vehicle
    await sql`
      UPDATE maintenance_records
      SET user_id = ${targetUserId}
      WHERE vehicle_id = ${vehicleId}
    `;
    
    return { 
      success: true, 
      message: `Vehicle ${vehicleId} has been transferred to user ${targetUserId}` 
    };
  } catch (error) {
    console.error('Error transferring vehicle:', error);
    return { 
      success: false, 
      message: 'Error transferring vehicle', 
      error 
    };
  }
}

/**
 * Transfers all vehicles from one user to another
 */
export async function transferAllVehicles(fromUserId: string, toUserId: string) {
  try {
    console.log(`Transferring all vehicles from user ${fromUserId} to user ${toUserId}...`);
    
    // Update all vehicles
    await sql`
      UPDATE vehicles
      SET user_id = ${toUserId}
      WHERE user_id = ${fromUserId}
    `;
    
    // Update all maintenance records
    await sql`
      UPDATE maintenance_records
      SET user_id = ${toUserId}
      WHERE user_id = ${fromUserId}
    `;
    
    return { 
      success: true, 
      message: `All vehicles have been transferred from user ${fromUserId} to user ${toUserId}` 
    };
  } catch (error) {
    console.error('Error transferring vehicles:', error);
    return { 
      success: false, 
      message: 'Error transferring vehicles', 
      error 
    };
  }
}
