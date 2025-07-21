"use server";

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { Rental } from '@/types/rental';
import { getCurrentUserId } from '@/lib/auth-utils';

/**
 * Check if a vehicle is available for rental during a specific period
 */
export async function isVehicleAvailableDuringPeriod(vehicleId: number, startDate: string, endDate: string, excludeRentalId?: number) {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  
  try {
    // Check for any active rentals for this vehicle that overlap with the requested period
    const overlappingRentals = await sql`
      SELECT id FROM rentals
      WHERE vehicle_id = ${vehicleId}
        AND status = 'active'
        AND user_id = ${userId}
        AND (
          (start_date <= ${endDate} AND end_date >= ${startDate})
        )
        ${excludeRentalId ? sql`AND id != ${excludeRentalId}` : sql``}
    `;
    
    // If there are any overlapping rentals, the vehicle is not available
    return overlappingRentals.length === 0;
  } catch (error) {
    console.error(`Error checking vehicle availability for vehicle ${vehicleId}:`, error);
    return false;
  }
}

/**
 * Add a new rental record
 */
export async function addRental(formData: FormData) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  const vehicle_id = parseInt(formData.get('vehicle_id') as string);
  const customer_id = formData.get('customer_id') as string;
  const customer_name = formData.get('customer_name') as string;
  const customer_email = formData.get('customer_email') as string;
  const customer_phone = formData.get('customer_phone') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;
  const daily_rate = parseFloat(formData.get('daily_rate') as string);
  const notes = formData.get('notes') as string;
  
  // Calculate rental duration in days
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  
  // Calculate total cost
  const total_cost = daily_rate * durationDays;

  // Basic validation
  if (!vehicle_id || !customer_name || !start_date || !end_date || !daily_rate) {
    return { success: false, message: 'Missing required fields' };
  }
  
  // Check if the vehicle is available during the requested period
  const isAvailable = await isVehicleAvailableDuringPeriod(vehicle_id, start_date, end_date);
  if (!isAvailable) {
    return { success: false, message: 'This vehicle is already rented during the selected period. Please choose another vehicle or different dates.' };
  }
  
  // If a customer ID was provided and it's not 'new', update the customer's rental count
  let shouldUpdateCustomerStats = false;
  if (customer_id && customer_id !== 'new' && customer_id !== '') {
    shouldUpdateCustomerStats = true;
  }

  try {
    await sql`
      INSERT INTO rentals (
        vehicle_id, 
        customer_name, 
        customer_email, 
        customer_phone, 
        start_date, 
        end_date, 
        daily_rate, 
        total_cost, 
        status, 
        notes,
        user_id
      )
      VALUES (
        ${vehicle_id}, 
        ${customer_name}, 
        ${customer_email}, 
        ${customer_phone}, 
        ${start_date}, 
        ${end_date}, 
        ${daily_rate}, 
        ${total_cost}, 
        'active', 
        ${notes},
        ${userId}
      )
    `;
    
    revalidatePath('/dashboard/rentals');
    return { success: true, message: 'Rental added successfully' };
  } catch (error) {
    console.error('Error adding rental:', error);
    return { success: false, message: 'Error adding rental: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Update a rental's status
 */
export async function updateRentalStatus(id: number, status: 'active' | 'completed' | 'cancelled') {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }

  if (!id) {
    return { success: false, message: 'Missing rental ID' };
  }

  try {
    await sql`
      UPDATE rentals
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    revalidatePath('/dashboard/rentals');
    return { success: true, message: `Rental marked as ${status}` };
  } catch (error) {
    console.error('Error updating rental status:', error);
    return { success: false, message: 'Error updating rental status: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Delete a rental record
 */
export async function deleteRental(id: number) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  if (!id) {
    return { success: false, message: 'Missing rental ID' };
  }

  try {
    await sql`
      DELETE FROM rentals
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    revalidatePath('/dashboard/rentals');
    return { success: true, message: 'Rental deleted successfully' };
  } catch (error) {
    console.error('Error deleting rental:', error);
    return { success: false, message: 'Error deleting rental: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Get all rental records
 */
export async function getRentals() {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return [];
  }
  
  try {
    // First attempt: Query with user_id filtering
    try {
      const rentals = await sql`
        SELECT r.*, 
          CONCAT(v.make, ' ', v.model, ' (', v.year, ') - ', v.license_plate) as vehicle_info
        FROM rentals r
        JOIN vehicles v ON r.vehicle_id = v.id
        WHERE r.user_id = ${userId}
        ORDER BY r.created_at DESC
      `;
      
      return rentals as Rental[];
    } catch (filterError) {
      // If the first query fails (possibly due to missing user_id column),
      // try a fallback query without user_id filtering
      console.warn('Error with user_id filtered query, trying fallback:', filterError);
      
      // This is a temporary fallback during migration - should be removed once all tables have user_id
      const rentals = await sql`
        SELECT r.*, 
          CONCAT(v.make, ' ', v.model, ' (', v.year, ') - ', v.license_plate) as vehicle_info
        FROM rentals r
        JOIN vehicles v ON r.vehicle_id = v.id
        ORDER BY r.created_at DESC
      `;
      
      return rentals as Rental[];
    }
  } catch (error) {
    console.error('Error fetching rentals:', error);
    return [];
  }
}

/**
 * Get a rental by ID
 */
export async function getRentalById(id: number) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return null;
  }
  
  if (!id) {
    return null;
  }
  
  try {
    const rentals = await sql`
      SELECT r.*, 
        CONCAT(v.make, ' ', v.model, ' (', v.year, ') - ', v.license_plate) as vehicle_info
      FROM rentals r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = ${id} AND r.user_id = ${userId}
    `;
    
    return rentals.length > 0 ? rentals[0] as Rental : null;
  } catch (error) {
    console.error(`Error fetching rental with ID ${id}:`, error);
    return null;
  }
}

/**
 * Get active rentals for a specific vehicle
 */
export async function getActiveRentalsForVehicle(vehicleId: number) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return [];
  }
  
  if (!vehicleId) {
    return [];
  }
  
  try {
    const rentals = await sql`
      SELECT * FROM rentals
      WHERE vehicle_id = ${vehicleId} AND status = 'active' AND user_id = ${userId}
    `;
    
    return rentals as Rental[];
  } catch (error) {
    console.error(`Error fetching active rentals for vehicle ${vehicleId}:`, error);
    return [];
  }
}

/**
 * Delete all rentals for a specific customer
 */
export async function deleteCustomerRentals(customerName: string) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    try {
      // Fallback if authentication fails
      await sql`
        DELETE FROM rentals
        WHERE customer_name = ${customerName}
      `;
      
      revalidatePath('/dashboard/rentals');
      revalidatePath('/dashboard/customers');
      return { success: true, message: 'All rentals for this customer deleted successfully' };
    } catch (error) {
      console.error('Error deleting customer rentals:', error);
      return { success: false, message: 'Error deleting customer rentals: ' + (error instanceof Error ? error.message : String(error)) };
    }
  }
  
  try {
    // Delete all rentals for this customer that belong to the current user
    await sql`
      DELETE FROM rentals
      WHERE customer_name = ${customerName} AND user_id = ${userId}
    `;
    
    revalidatePath('/dashboard/rentals');
    revalidatePath('/dashboard/customers');
    return { success: true, message: 'All rentals for this customer deleted successfully' };
  } catch (error) {
    console.error('Error deleting customer rentals:', error);
    return { success: false, message: 'Error deleting customer rentals: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Update a rental record with new details
 */
export async function updateRental(id: number, formData: FormData) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  if (!id) {
    return { success: false, message: 'Missing rental ID' };
  }

  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;
  const daily_rate = parseFloat(formData.get('daily_rate') as string);
  const notes = formData.get('notes') as string;
  const status = formData.get('status') as 'active' | 'completed' | 'cancelled';
  
  // Calculate rental duration in days
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const durationMs = endDate.getTime() - startDate.getTime();
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  
  // Calculate total cost
  const total_cost = daily_rate * durationDays;

  // Basic validation
  if (!start_date || !end_date || !daily_rate) {
    return { success: false, message: 'Missing required fields' };
  }

  // If status is being changed to completed, handle it with the specialized function
  if (status === 'completed') {
    // First get the current rental to check its previous status
    const currentRental = await getRentalById(id);
    if (currentRental && currentRental.status !== 'completed') {
      return completeRental(id, {
        actualEndDate: end_date,
        notes: notes
      });
    }
  }

  try {
    await sql`
      UPDATE rentals
      SET 
        start_date = ${start_date},
        end_date = ${end_date},
        daily_rate = ${daily_rate},
        total_cost = ${total_cost},
        status = ${status},
        notes = ${notes},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    revalidatePath('/dashboard/rentals');
    revalidatePath('/dashboard/customers');
    return { success: true, message: 'Rental updated successfully' };
  } catch (error) {
    console.error('Error updating rental:', error);
    return { success: false, message: 'Error updating rental: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Complete a rental and recalculate the cost based on actual duration
 */
export async function completeRental(id: number, options: { actualEndDate?: string, notes?: string }) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  if (!id) {
    return { success: false, message: 'Missing rental ID' };
  }

  try {
    // First, get the rental details
    const rental = await getRentalById(id);
    if (!rental) {
      return { success: false, message: 'Rental not found' };
    }

    // Determine the actual end date
    let actualEndDate: Date;
    if (options.actualEndDate) {
      actualEndDate = new Date(options.actualEndDate);
    } else {
      // If no actual end date provided, use today's date
      actualEndDate = new Date();
    }

    // Format the date for SQL
    const formattedActualEndDate = actualEndDate.toISOString().split('T')[0];
    
    // Calculate actual rental duration in days
    const startDate = new Date(rental.start_date);
    
    // Set both dates to the start of their respective days to count only full days
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(actualEndDate.getFullYear(), actualEndDate.getMonth(), actualEndDate.getDate());
    
    // Calculate the difference in days
    const durationMs = endDateOnly.getTime() - startDateOnly.getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include the first day
    
    // Calculate actual total cost
    const actualTotalCost = rental.daily_rate * durationDays;

    // Update the rental with actual end date, cost, and completed status
    if (options.notes) {
      // If notes are provided, update them
      await sql`
        UPDATE rentals
        SET 
          end_date = ${formattedActualEndDate},
          total_cost = ${actualTotalCost},
          status = 'completed',
          notes = ${options.notes},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${userId}
      `;
    } else {
      // If no notes are provided, keep existing notes
      await sql`
        UPDATE rentals
        SET 
          end_date = ${formattedActualEndDate},
          total_cost = ${actualTotalCost},
          status = 'completed',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${userId}
      `;
    }
    
    revalidatePath('/dashboard/rentals');
    revalidatePath('/dashboard/customers');
    return { 
      success: true, 
      message: `Rental completed successfully. Final cost: $${actualTotalCost.toFixed(2)} for ${durationDays} day(s).` 
    };
  } catch (error) {
    console.error('Error completing rental:', error);
    return { success: false, message: 'Error completing rental: ' + (error instanceof Error ? error.message : String(error)) };
  }
}
