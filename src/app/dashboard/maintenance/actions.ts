"use server";

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { MaintenanceRecord, ActionResult } from '@/types/maintenance';
import { getCurrentUserId } from '@/lib/auth-utils';
import { runMigrations } from '@/lib/db-migrations';

/**
 * Ensure the maintenance_records table exists
 */
export async function ensureMaintenanceTableExists(): Promise<ActionResult> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
        service_type VARCHAR(255) NOT NULL,
        description TEXT,
        date_performed DATE,
        next_due_date DATE NOT NULL,
        cost DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) NOT NULL,
        service_provider VARCHAR(255),
        notes TEXT,
        user_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create index for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_maintenance_user_id ON maintenance_records(user_id)
    `;
    
    return { success: true };
  } catch (error) {
    console.error('Error creating maintenance_records table:', error);
    return { success: false, error };
  }
}

/**
 * Get all maintenance records with vehicle information
 */
export async function getMaintenanceRecords(): Promise<MaintenanceRecord[]> {
  try {
    // Run migrations to ensure user_id column exists
    try {
      await runMigrations();
    } catch (migrationError) {
      console.warn('Migration error, continuing with query:', migrationError);
      // Continue execution even if migrations fail
    }
    
    // Ensure table exists
    try {
      await ensureMaintenanceTableExists();
    } catch (tableError) {
      console.warn('Table creation error, continuing with query:', tableError);
      // Continue execution even if table creation fails
    }
    
    // Get the current user ID
    let userId;
    try {
      userId = await getCurrentUserId();
    } catch (authError) {
      console.warn('Authentication error, trying fallback query:', authError);
      // Continue with fallback query
    }
    
    if (!userId) {
      console.warn('User not authenticated, using fallback query');
      try {
        // Fallback query without user_id filtering
        const fallbackRecords = await sql`
          SELECT 
            m.id, 
            m.vehicle_id, 
            CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
            m.service_type, 
            m.description, 
            m.date_performed, 
            m.next_due_date, 
            m.cost, 
            m.status, 
            m.service_provider, 
            m.notes
          FROM maintenance_records m
          JOIN vehicles v ON m.vehicle_id = v.id
          ORDER BY 
            CASE 
              WHEN m.status = 'overdue' THEN 1
              WHEN m.status = 'scheduled' THEN 2
              WHEN m.status = 'completed' THEN 3
              ELSE 4
            END,
            m.next_due_date ASC
        `;
        
        return fallbackRecords as any[];
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        return [];
      }
    }
    
    // Try to check for overdue maintenance records, but don't fail if it errors
    try {
      await checkOverdueMaintenance();
    } catch (overdueError) {
      console.warn('Error checking overdue maintenance, continuing:', overdueError);
      // Continue execution even if overdue check fails
    }
    
    try {
      // Fetch records with vehicle information for the current user
      const records = await sql`
        SELECT 
          m.id, 
          m.vehicle_id, 
          CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
          m.service_type, 
          m.description, 
          m.date_performed, 
          m.next_due_date, 
          m.cost, 
          m.status, 
          m.service_provider, 
          m.notes
        FROM maintenance_records m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.user_id = ${userId} AND v.user_id = ${userId}
        ORDER BY 
          CASE 
            WHEN m.status = 'overdue' THEN 1
            WHEN m.status = 'scheduled' THEN 2
            WHEN m.status = 'completed' THEN 3
            ELSE 4
          END,
          m.next_due_date ASC
      `;
      
      return records as any[];
    } catch (queryError) {
      console.warn('Error with filtered query, trying fallback:', queryError);
      
      // Fallback query without user_id filtering if the main query fails
      try {
        const fallbackRecords = await sql`
          SELECT 
            m.id, 
            m.vehicle_id, 
            CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
            m.service_type, 
            m.description, 
            m.date_performed, 
            m.next_due_date, 
            m.cost, 
            m.status, 
            m.service_provider, 
            m.notes
          FROM maintenance_records m
          JOIN vehicles v ON m.vehicle_id = v.id
          ORDER BY 
            CASE 
              WHEN m.status = 'overdue' THEN 1
              WHEN m.status = 'scheduled' THEN 2
              WHEN m.status = 'completed' THEN 3
              ELSE 4
            END,
            m.next_due_date ASC
        `;
        
        return fallbackRecords as any[];
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        return [];
      }
    }
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    return [];
  }
}

/**
 * Get a specific maintenance record by ID
 */
export async function getMaintenanceRecordById(id: number): Promise<MaintenanceRecord | null> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return null;
    }
    
    const records = await sql`
      SELECT 
        m.id, 
        m.vehicle_id, 
        CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
        m.service_type, 
        m.description, 
        m.date_performed, 
        m.next_due_date, 
        m.cost, 
        m.status, 
        m.service_provider, 
        m.notes
      FROM maintenance_records m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id = ${id} AND m.user_id = ${userId}
    `;
    
    if (records.length === 0) {
      return null;
    }
    
    return records[0] as any;
  } catch (error) {
    console.error(`Error fetching maintenance record ${id}:`, error);
    return null;
  }
}

/**
 * Create a new maintenance record
 */
export async function createMaintenanceRecord(formData: FormData): Promise<ActionResult> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    
    // Ensure table exists
    await ensureMaintenanceTableExists();
    
    // Extract and validate form data
    const vehicle_id = parseInt(formData.get('vehicle_id') as string);
    const service_type = formData.get('service_type') as string;
    const description = formData.get('description') as string;
    const date_performed = formData.get('date_performed') as string || null;
    const next_due_date = formData.get('next_due_date') as string;
    const cost = parseFloat(formData.get('cost') as string) || 0;
    const status = formData.get('status') as 'scheduled' | 'completed' | 'overdue';
    const service_provider = formData.get('service_provider') as string;
    const notes = formData.get('notes') as string;
    
    // Validate required fields
    if (!vehicle_id || !service_type || !next_due_date || !status) {
      return { 
        success: false, 
        message: 'Missing required fields' 
      };
    }
    
    // Check if the vehicle belongs to the current user
    const vehicleCheck = await sql`
      SELECT id FROM vehicles WHERE id = ${vehicle_id} AND user_id = ${userId}
    `;
    
    if (vehicleCheck.length === 0) {
      return { success: false, message: 'Vehicle not found or you do not have permission to use it' };
    }
    
    // Insert record
    await sql`
      INSERT INTO maintenance_records (
        vehicle_id,
        service_type,
        description,
        date_performed,
        next_due_date,
        cost,
        status,
        service_provider,
        notes,
        user_id
      ) VALUES (
        ${vehicle_id},
        ${service_type},
        ${description},
        ${date_performed ? new Date(date_performed) : null},
        ${new Date(next_due_date)},
        ${cost},
        ${status},
        ${service_provider},
        ${notes},
        ${userId}
      )
    `;
    
    // Revalidate the maintenance page
    revalidatePath('/dashboard/maintenance');
    
    return { 
      success: true, 
      message: 'Maintenance record created successfully' 
    };
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return { 
      success: false, 
      message: 'Failed to create maintenance record',
      error 
    };
  }
}

/**
 * Update an existing maintenance record
 */
export async function updateMaintenanceRecord(formData: FormData): Promise<ActionResult> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    
    const id = parseInt(formData.get('id') as string);
    const vehicle_id = parseInt(formData.get('vehicle_id') as string);
    const service_type = formData.get('service_type') as string;
    const description = formData.get('description') as string;
    const date_performed = formData.get('date_performed') as string || null;
    const next_due_date = formData.get('next_due_date') as string;
    const cost = parseFloat(formData.get('cost') as string) || 0;
    const status = formData.get('status') as 'scheduled' | 'completed' | 'overdue';
    const service_provider = formData.get('service_provider') as string;
    const notes = formData.get('notes') as string;
    
    // Validate required fields
    if (!id || !vehicle_id || !service_type || !next_due_date || !status) {
      return { 
        success: false, 
        message: 'Missing required fields' 
      };
    }
    
    // Check if the maintenance record belongs to the current user
    const recordCheck = await sql`
      SELECT id FROM maintenance_records WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (recordCheck.length === 0) {
      return { success: false, message: 'Maintenance record not found or you do not have permission to edit it' };
    }
    
    // Check if the vehicle belongs to the current user
    const vehicleCheck = await sql`
      SELECT id FROM vehicles WHERE id = ${vehicle_id} AND user_id = ${userId}
    `;
    
    if (vehicleCheck.length === 0) {
      return { success: false, message: 'Vehicle not found or you do not have permission to use it' };
    }
    
    // Update record
    await sql`
      UPDATE maintenance_records
      SET 
        vehicle_id = ${vehicle_id},
        service_type = ${service_type},
        description = ${description},
        date_performed = ${date_performed ? new Date(date_performed) : null},
        next_due_date = ${new Date(next_due_date)},
        cost = ${cost},
        status = ${status},
        service_provider = ${service_provider},
        notes = ${notes},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    // Revalidate the maintenance page
    revalidatePath('/dashboard/maintenance');
    
    return { 
      success: true, 
      message: 'Maintenance record updated successfully' 
    };
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    return { 
      success: false, 
      message: 'Failed to update maintenance record',
      error 
    };
  }
}

/**
 * Delete a maintenance record
 */
export async function deleteMaintenanceRecord(id: number): Promise<ActionResult> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    
    // Check if the maintenance record belongs to the current user
    const recordCheck = await sql`
      SELECT id FROM maintenance_records WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (recordCheck.length === 0) {
      return { success: false, message: 'Maintenance record not found or you do not have permission to delete it' };
    }
    
    await sql`
      DELETE FROM maintenance_records
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    // Revalidate the maintenance page
    revalidatePath('/dashboard/maintenance');
    
    return { 
      success: true, 
      message: 'Maintenance record deleted successfully' 
    };
  } catch (error) {
    console.error(`Error deleting maintenance record ${id}:`, error);
    return { 
      success: false, 
      message: 'Failed to delete maintenance record',
      error 
    };
  }
}

/**
 * Mark a maintenance record as completed
 */
export async function markMaintenanceAsCompleted(id: number): Promise<ActionResult> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    
    // Check if the maintenance record belongs to the current user
    const recordCheck = await sql`
      SELECT id FROM maintenance_records WHERE id = ${id} AND user_id = ${userId}
    `;
    
    if (recordCheck.length === 0) {
      return { success: false, message: 'Maintenance record not found or you do not have permission to update it' };
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    await sql`
      UPDATE maintenance_records
      SET 
        status = 'completed',
        date_performed = ${today},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
    `;
    
    // Revalidate the maintenance page
    revalidatePath('/dashboard/maintenance');
    
    return { 
      success: true, 
      message: 'Maintenance record marked as completed' 
    };
  } catch (error) {
    console.error(`Error marking maintenance record ${id} as completed:`, error);
    return { 
      success: false, 
      message: 'Failed to mark maintenance record as completed',
      error 
    };
  }
}

/**
 * Check for overdue maintenance records and update their status
 * This is automatically called when fetching maintenance records
 */
/**
 * Get maintenance records for a specific vehicle
 */
export async function getMaintenanceRecordsByVehicleId(vehicleId: number): Promise<MaintenanceRecord[]> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return [];
    }
    
    const records = await sql`
      SELECT 
        m.id, 
        m.vehicle_id, 
        CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
        m.service_type, 
        m.description, 
        m.date_performed, 
        m.next_due_date, 
        m.cost, 
        m.status, 
        m.service_provider, 
        m.notes,
        m.created_at,
        m.updated_at
      FROM maintenance_records m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.vehicle_id = ${vehicleId} AND m.user_id = ${userId}
      ORDER BY 
        CASE 
          WHEN m.date_performed IS NOT NULL THEN m.date_performed
          ELSE m.created_at
        END DESC
    `;
    
    return records as MaintenanceRecord[];
  } catch (error) {
    console.error(`Error fetching maintenance records for vehicle ${vehicleId}:`, error);
    return [];
  }
}

/**
 * Check for overdue maintenance records and update their status
 */
export async function checkOverdueMaintenance(): Promise<ActionResult> {
  try {
    // Get the current user ID
    let userId;
    try {
      userId = await getCurrentUserId();
    } catch (authError) {
      console.warn('Authentication error in checkOverdueMaintenance:', authError);
      // Try fallback without user_id
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    if (!userId) {
      // Fallback query without user_id filtering
      try {
        await sql`
          UPDATE maintenance_records
          SET 
            status = 'overdue',
            updated_at = CURRENT_TIMESTAMP
          WHERE 
            next_due_date < ${today}
            AND status = 'scheduled'
        `;
        
        return { 
          success: true, 
          message: 'Overdue maintenance records updated (fallback mode)' 
        };
      } catch (fallbackError) {
        console.warn('Fallback update failed:', fallbackError);
        // Continue execution even if fallback fails
        return { 
          success: false, 
          message: 'Failed to update overdue maintenance records in fallback mode'
        };
      }
    }
    
    // With user_id filtering
    try {
      await sql`
        UPDATE maintenance_records
        SET 
          status = 'overdue',
          updated_at = CURRENT_TIMESTAMP
        WHERE 
          next_due_date < ${today}
          AND status = 'scheduled'
          AND user_id = ${userId}
      `;
      
      return { 
        success: true, 
        message: 'Overdue maintenance records updated' 
      };
    } catch (queryError) {
      console.warn('Error with filtered update, trying fallback:', queryError);
      
      // Try fallback if the filtered query fails
      try {
        await sql`
          UPDATE maintenance_records
          SET 
            status = 'overdue',
            updated_at = CURRENT_TIMESTAMP
          WHERE 
            next_due_date < ${today}
            AND status = 'scheduled'
        `;
        
        return { 
          success: true, 
          message: 'Overdue maintenance records updated (fallback mode)' 
        };
      } catch (fallbackError) {
        console.error('Fallback update failed:', fallbackError);
        return { 
          success: false, 
          message: 'Failed to update overdue maintenance records'
        };
      }
    }
  } catch (error) {
    console.error('Error checking for overdue maintenance:', error);
    return { 
      success: false, 
      message: 'Failed to check for overdue maintenance',
      error 
    };
  }
}
