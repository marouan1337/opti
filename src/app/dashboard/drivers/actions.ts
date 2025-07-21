"use server";

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth-utils';
import { runMigrations } from '@/lib/db-migrations';

export async function addDriver(formData: FormData) {
  // Ensure database has the user_id column
  await runMigrations();
  
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  const first_name = formData.get('firstName') as string;
  const last_name = formData.get('lastName') as string;
  const license_number = formData.get('licenseNumber') as string;
  const license_expiry = formData.get('licenseExpiry') as string;
  const contact_number = formData.get('contactNumber') as string;
  const email = formData.get('email') as string;
  const status = formData.get('status') as string || 'active';

  // Basic validation
  if (!first_name || !last_name || !license_number || !license_expiry) {
    console.error('Missing required fields for adding driver');
    return { success: false, message: 'Missing required fields' };
  }

  try {
    await sql`
      INSERT INTO drivers (
        first_name, last_name, license_number, license_expiry, 
        contact_number, email, status, user_id
      )
      VALUES (
        ${first_name}, ${last_name}, ${license_number}, ${license_expiry}, 
        ${contact_number}, ${email}, ${status}, ${userId}
      )
    `;
    console.log('Driver added successfully');
    revalidatePath('/dashboard/drivers'); // Revalidate the drivers page to show the new data
    return { success: true, message: 'Driver added successfully' };
  } catch (error) {
    console.error('Error adding driver:', error);
    return { success: false, message: 'Error adding driver' };
  }
}

export async function editDriver(formData: FormData) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  const id = parseInt(formData.get('id') as string);
  const first_name = formData.get('firstName') as string;
  const last_name = formData.get('lastName') as string;
  const license_number = formData.get('licenseNumber') as string;
  const license_expiry = formData.get('licenseExpiry') as string;
  const contact_number = formData.get('contactNumber') as string;
  const email = formData.get('email') as string;
  const status = formData.get('status') as string;

  // Basic validation
  if (!id || !first_name || !last_name || !license_number || !license_expiry) {
    console.error('Missing required fields for editing driver');
    return { success: false, message: 'Missing required fields' };
  }

  try {
    // First check if the driver belongs to the current user
    const driverCheck = await sql`
      SELECT id FROM drivers WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (driverCheck.length === 0) {
      return { success: false, message: 'Driver not found or you do not have permission to edit it' };
    }
    
    await sql`
      UPDATE drivers
      SET 
        first_name = ${first_name}, 
        last_name = ${last_name}, 
        license_number = ${license_number}, 
        license_expiry = ${license_expiry}, 
        contact_number = ${contact_number}, 
        email = ${email}, 
        status = ${status},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;
    console.log(`Driver with id ${id} updated successfully`);
    revalidatePath('/dashboard/drivers'); // Revalidate the drivers page to show updated data
    return { success: true, message: 'Driver updated successfully' };
  } catch (error) {
    console.error('Error updating driver:', error);
    return { success: false, message: 'Error updating driver' };
  }
}

export async function deleteDriver(id: number) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  // Basic validation
  if (!id) {
    console.error('Missing driver ID for deletion');
    return { success: false, message: 'Missing driver ID' };
  }

  try {
    // First check if the driver belongs to the current user
    const driverCheck = await sql`
      SELECT id FROM drivers WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (driverCheck.length === 0) {
      return { success: false, message: 'Driver not found or you do not have permission to delete it' };
    }
    
    await sql`
      DELETE FROM drivers
      WHERE id = ${id} AND user_id = ${userId}
    `;
    console.log(`Driver with id ${id} deleted successfully`);
    revalidatePath('/dashboard/drivers'); // Revalidate the drivers page to show updated data
    return { success: true, message: 'Driver deleted successfully' };
  } catch (error) {
    console.error('Error deleting driver:', error);
    return { success: false, message: 'Error deleting driver' };
  }
}

export async function updateDriverStatus(id: number, status: string) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  // Basic validation
  if (!id || !status) {
    console.error('Missing driver ID or status for update');
    return { success: false, message: 'Missing driver ID or status' };
  }

  try {
    // First check if the driver belongs to the current user
    const driverCheck = await sql`
      SELECT id FROM drivers WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (driverCheck.length === 0) {
      return { success: false, message: 'Driver not found or you do not have permission to update it' };
    }
    
    await sql`
      UPDATE drivers
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;
    console.log(`Driver with id ${id} status updated to ${status}`);
    revalidatePath('/dashboard/drivers'); // Revalidate the drivers page to show updated data
    return { success: true, message: 'Driver status updated successfully' };
  } catch (error) {
    console.error('Error updating driver status:', error);
    return { success: false, message: 'Error updating driver status' };
  }
}

/**
 * Get all drivers for the current user
 */
export async function getDrivers() {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return [];
  }
  
  try {
    const drivers = await sql`
      SELECT * FROM drivers
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return drivers;
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
}
