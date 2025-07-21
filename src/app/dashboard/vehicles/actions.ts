"use server";

import { revalidatePath } from 'next/cache';
import { sql, checkDatabaseConnection } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth-utils';
import { runMigrations } from '@/lib/db-migrations';

export async function addVehicle(formData: FormData) {
  try {
    // First ensure all migrations are run to create necessary tables
    console.log('Running migrations to ensure tables exist...');
    await runMigrations();
    
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const year = parseInt(formData.get('year') as string);
    const license_plate = formData.get('licensePlate') as string;

    // Basic validation
    if (!make || !model || !license_plate) {
      console.error('Missing required fields for adding vehicle');
      return { success: false, message: 'Missing required fields' };
    }

    // Check if the vehicles table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'vehicles'
      ) as exists
    `;
    
    if (!tableCheck[0]?.exists) {
      console.error('Vehicles table does not exist, attempting to create it...');
      // Run migrations again to create the table
      await runMigrations();
    }

    // Now insert the vehicle
    console.log('Inserting vehicle:', { make, model, year, license_plate, userId });
    await sql`
      INSERT INTO vehicles (make, model, year, license_plate, user_id)
      VALUES (${make}, ${model}, ${year}, ${license_plate}, ${userId})
    `;
    
    console.log('Vehicle added successfully');
    revalidatePath('/dashboard/vehicles'); // Revalidate the vehicles page to show the new data
    return { success: true, message: 'Vehicle added successfully' };
  } catch (error) {
    console.error('Error adding vehicle:', error);
    return { 
      success: false, 
      message: `Error adding vehicle: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

export async function editVehicle(formData: FormData) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  const id = parseInt(formData.get('id') as string);
  const make = formData.get('make') as string;
  const model = formData.get('model') as string;
  const year = parseInt(formData.get('year') as string);
  const license_plate = formData.get('licensePlate') as string;

   // Basic validation
  if (!id || !make || !model || !license_plate) {
    // In a real app, handle validation errors properly
    console.error('Missing required fields for editing vehicle');
    return { success: false, message: 'Missing required fields' };
  }

  try {
    // First check if the vehicle belongs to the current user
    const vehicleCheck = await sql`
      SELECT id FROM vehicles WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (vehicleCheck.length === 0) {
      return { success: false, message: 'Vehicle not found or you do not have permission to edit it' };
    }
    
    await sql`
      UPDATE vehicles
      SET make = ${make}, model = ${model}, year = ${year}, license_plate = ${license_plate}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;
    console.log(`Vehicle with id ${id} updated successfully`);
    revalidatePath('/dashboard/vehicles'); // Revalidate the vehicles page to show updated data
    return { success: true, message: 'Vehicle updated successfully' };
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return { success: false, message: 'Error updating vehicle' };
  }
}

export async function deleteVehicle(id: number) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  // Basic validation
  if (!id) {
    console.error('Missing vehicle ID for deletion');
    return { success: false, message: 'Missing vehicle ID' };
  }

  try {
    // First check if the vehicle belongs to the current user
    const vehicleCheck = await sql`
      SELECT id FROM vehicles WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (vehicleCheck.length === 0) {
      return { success: false, message: 'Vehicle not found or you do not have permission to delete it' };
    }
    
    // Check if the vehicle is currently rented
    const activeRentals = await sql`
      SELECT id FROM rentals 
      WHERE vehicle_id = ${id} 
      AND status = 'active' 
      AND user_id = ${userId}
    `;
    
    if (activeRentals.length > 0) {
      return { 
        success: false, 
        message: 'Cannot delete a vehicle that is currently rented. Please end the rental first.' 
      };
    }
    
    // First delete all maintenance records associated with this vehicle
    // Note: We don't filter by user_id here because the vehicle_id foreign key is sufficient
    // and we've already verified the vehicle belongs to the current user
    await sql`
      DELETE FROM maintenance_records
      WHERE vehicle_id = ${id}
    `;
    
    // Then delete the vehicle itself
    await sql`
      DELETE FROM vehicles
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    console.log(`Vehicle with id ${id} and its maintenance records deleted successfully`);
    revalidatePath('/dashboard/vehicles'); // Revalidate the vehicles page to show updated data
    revalidatePath('/dashboard/maintenance'); // Also revalidate the maintenance page
    return { success: true, message: 'Vehicle and associated maintenance records deleted successfully' };
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return { success: false, message: 'Error deleting vehicle: ' + (error instanceof Error ? error.message : String(error)) };
  }
} 

/**
 * Get all vehicles for the current user
 */
export async function getVehicles() {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return [];
  }
  
  try {
    // Get vehicles with rental information
    const vehicles = await sql`
      SELECT v.*, 
        (SELECT COUNT(*) FROM rentals r WHERE r.vehicle_id = v.id AND r.status = 'active') as active_rentals,
        (SELECT r.id FROM rentals r WHERE r.vehicle_id = v.id AND r.status = 'active' ORDER BY r.start_date DESC LIMIT 1) as active_rental_id,
        (SELECT r.customer_name FROM rentals r WHERE r.vehicle_id = v.id AND r.status = 'active' ORDER BY r.start_date DESC LIMIT 1) as rented_to,
        (SELECT r.end_date FROM rentals r WHERE r.vehicle_id = v.id AND r.status = 'active' ORDER BY r.start_date DESC LIMIT 1) as return_date
      FROM vehicles v
      WHERE v.user_id = ${userId}
      ORDER BY v.created_at DESC
    `;
    return vehicles;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}

/**
 * Get a vehicle by ID (only if it belongs to the current user)
 */
export async function getVehicleById(id: number) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return null;
  }
  
  try {
    const vehicles = await sql`
      SELECT * FROM vehicles
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (vehicles.length === 0) {
      return null;
    }
    
    return vehicles[0];
  } catch (error) {
    console.error(`Error fetching vehicle with ID ${id}:`, error);
    return null;
  }
}