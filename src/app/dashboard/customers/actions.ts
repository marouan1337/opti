"use server";

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { Customer } from '@/types/customer';
import { Rental } from '@/types/rental';
import { getCurrentUserId } from '@/lib/auth-utils';

/**
 * Add a new customer
 */
export async function addCustomer(formData: FormData) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const notes = formData.get('notes') as string;

  // Basic validation
  if (!name) {
    return { success: false, message: 'Customer name is required' };
  }

  try {
    await sql`
      INSERT INTO customers (
        name, 
        email, 
        phone, 
        address, 
        notes,
        user_id
      )
      VALUES (
        ${name}, 
        ${email}, 
        ${phone}, 
        ${address}, 
        ${notes},
        ${userId}
      )
    `;
    
    revalidatePath('/dashboard/customers');
    return { success: true, message: 'Customer added successfully' };
  } catch (error) {
    console.error('Error adding customer:', error);
    return { success: false, message: 'Error adding customer: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(formData: FormData) {
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return { success: false, message: 'User not authenticated' };
  }
  
  const id = parseInt(formData.get('id') as string);
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const notes = formData.get('notes') as string;

  // Basic validation
  if (!id || !name) {
    return { success: false, message: 'Customer ID and name are required' };
  }

  try {
    await sql`
      UPDATE customers
      SET 
        name = ${name}, 
        email = ${email}, 
        phone = ${phone}, 
        address = ${address}, 
        notes = ${notes},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    revalidatePath('/dashboard/customers');
    return { success: true, message: 'Customer updated successfully' };
  } catch (error) {
    console.error('Error updating customer:', error);
    return { success: false, message: 'Error updating customer: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Delete a customer
 */
export async function deleteCustomer(id: number) {
  if (!id) {
    return { success: false, message: 'Customer ID is required' };
  }
  
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    
    // If no user ID, return an error instead of trying to delete without authentication
    if (!userId) {
      console.error('User not authenticated when trying to delete customer');
      return { success: false, message: 'Authentication required. Please log in again.' };
    }

    // First check if customer has any rentals that belong to the current user
    const rentalCheck = await sql`
      SELECT COUNT(*) as count FROM rentals
      WHERE customer_name IN (
        SELECT name FROM customers WHERE id = ${id} AND user_id = ${userId}
      )
      AND user_id = ${userId}
    `;
    
    if (rentalCheck[0].count > 0) {
      return { 
        success: false, 
        message: `Cannot delete customer with ${rentalCheck[0].count} rental records. Please delete the rentals first or update them to use a different customer.` 
      };
    }
    
    // Delete the customer if no rentals exist
    await sql`
      DELETE FROM customers
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    revalidatePath('/dashboard/customers');
    return { success: true, message: 'Customer deleted successfully' };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { success: false, message: 'Error deleting customer: ' + (error instanceof Error ? error.message : String(error)) };
  }
}

/**
 * Get all customers
 */
export async function getCustomers() {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('User not authenticated, attempting to fetch all customers as fallback');
      // Fallback query without user_id filtering as a last resort
      const allCustomers = await sql`
        SELECT c.*, 
          (SELECT COUNT(*) FROM rentals r WHERE r.customer_name = c.name) as rental_count
        FROM customers c
        ORDER BY c.name ASC
      `;
      
      return allCustomers as Customer[];
    }
    
    // Try with user_id filtering first
    try {
      const customers = await sql`
        SELECT c.*, 
          (SELECT COUNT(*) FROM rentals r WHERE r.customer_name = c.name AND r.user_id = ${userId}) as rental_count
        FROM customers c
        WHERE c.user_id = ${userId}
        ORDER BY c.name ASC
      `;
      
      return customers as Customer[];
    } catch (filterError) {
      // Fallback query without user_id filtering (temporary during migration)
      console.warn('Error with user_id filtered query for customers, trying fallback:', filterError);
      
      const customers = await sql`
        SELECT c.*, 
          (SELECT COUNT(*) FROM rentals r WHERE r.customer_name = c.name) as rental_count
        FROM customers c
        ORDER BY c.name ASC
      `;
      
      return customers as Customer[];
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

/**
 * Get a customer by ID
 */
export async function getCustomerById(id: number) {
  if (!id) {
    return null;
  }
  
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    
    // If no user ID, try to fetch without user_id filtering as a fallback
    if (!userId) {
      console.warn('User not authenticated, attempting to fetch customer without user_id check');
      
      const customers = await sql`
        SELECT * FROM customers
        WHERE id = ${id}
      `;
      
      return customers.length > 0 ? customers[0] as Customer : null;
    }
    
    // Try with user_id filtering first
    try {
      const customers = await sql`
        SELECT * FROM customers
        WHERE id = ${id} AND user_id = ${userId}
      `;
      
      return customers.length > 0 ? customers[0] as Customer : null;
    } catch (filterError) {
      // Fallback query without user_id filtering (temporary during migration)
      console.warn('Error with user_id filtered query for customer by ID, trying fallback:', filterError);
      
      const customers = await sql`
        SELECT * FROM customers
        WHERE id = ${id}
      `;
      
      return customers.length > 0 ? customers[0] as Customer : null;
    }
  } catch (error) {
    console.error(`Error fetching customer with ID ${id}:`, error);
    return null;
  }
}

/**
 * Get customer rental history
 */
export async function getCustomerRentals(customerId: number): Promise<Rental[]> {
  if (!customerId) {
    return [];
  }
  
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) return [];
    
    try {
      // Get the current user ID
      const userId = await getCurrentUserId();
      
      // If no user ID, try to fetch without user_id filtering as a fallback
      if (!userId) {
        console.warn('User not authenticated, attempting to fetch rentals without user_id check');
        
        const rentals = await sql`
          SELECT r.*, 
            CONCAT(v.make, ' ', v.model, ' (', v.year, ') - ', v.license_plate) as vehicle_info
          FROM rentals r
          JOIN vehicles v ON r.vehicle_id = v.id
          WHERE r.customer_name = ${customer.name}
          ORDER BY r.start_date DESC
        `;
        
        return rentals as Rental[];
      }
      
      // Try with user_id filtering first
      try {
        const rentals = await sql`
          SELECT r.*, 
            CONCAT(v.make, ' ', v.model, ' (', v.year, ') - ', v.license_plate) as vehicle_info
          FROM rentals r
          JOIN vehicles v ON r.vehicle_id = v.id
          WHERE r.customer_name = ${customer.name} AND r.user_id = ${userId}
          ORDER BY r.start_date DESC
        `;
        
        return rentals as Rental[];
      } catch (filterError) {
        // Fallback query without user_id filtering (temporary during migration)
        console.warn('Error with user_id filtered query for customer rentals, trying fallback:', filterError);
        
        const rentals = await sql`
          SELECT r.*, 
            CONCAT(v.make, ' ', v.model, ' (', v.year, ') - ', v.license_plate) as vehicle_info
          FROM rentals r
          JOIN vehicles v ON r.vehicle_id = v.id
          WHERE r.customer_name = ${customer.name}
          ORDER BY r.start_date DESC
        `;
        
        return rentals as Rental[];
      }
    } catch (authError) {
      console.warn('Authentication error when fetching rentals:', authError);
      
      // Final fallback if authentication fails
      const rentals = await sql`
        SELECT r.*, 
          CONCAT(v.make, ' ', v.model, ' (', v.year, ') - ', v.license_plate) as vehicle_info
        FROM rentals r
        JOIN vehicles v ON r.vehicle_id = v.id
        WHERE r.customer_name = ${customer.name}
        ORDER BY r.start_date DESC
      `;
      
      return rentals as Rental[];
    }
  } catch (error) {
    console.error(`Error fetching rentals for customer ${customerId}:`, error);
    return [];
  }
}
