"use server";

import { sql } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth-utils';
import { runMigrations } from '@/lib/db-migrations';

// Define interfaces for dashboard data
interface DashboardStats {
  totalVehicles: number;
  activeDrivers: number;
  totalCustomers: number;
  activeRentals: number;
  completedRentals: number;
  rentalRevenue: number;
  pendingMaintenance: number;
  completedMaintenance: number;
  overdueMaintenance: number;
  vehiclesByStatus?: { status: string; count: number }[];
  recentActivity: RecentActivity[];
}

interface RecentActivity {
  id: number;
  type: 'vehicle' | 'driver' | 'maintenance' | 'customer' | 'rental';
  description: string;
  timestamp: string;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Run migrations to ensure user_id columns exist
    await runMigrations();
    
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return {
        totalVehicles: 0,
        activeDrivers: 0,
        totalCustomers: 0,
        activeRentals: 0,
        completedRentals: 0,
        rentalRevenue: 0,
        pendingMaintenance: 0,
        completedMaintenance: 0,
        overdueMaintenance: 0,
        recentActivity: []
      };
    }
    
    // Get vehicle counts - handle missing user_id column
    let totalVehicles = 0;
    try {
      const vehiclesResult = await sql`SELECT COUNT(*) as count FROM vehicles WHERE user_id = ${userId}`;
      totalVehicles = parseInt(vehiclesResult[0].count);
    } catch (error) {
      console.log('Error counting vehicles with user_id filter:', error);
      // Falling back to count all vehicles (temporary until migration completes)
      const vehiclesResult = await sql`SELECT COUNT(*) as count FROM vehicles`;
      totalVehicles = parseInt(vehiclesResult[0].count);
    }

    // Get driver counts - handle missing user_id column
    let activeDrivers = 0;
    try {
      const driversResult = await sql`SELECT COUNT(*) as count FROM drivers WHERE status = 'active' AND user_id = ${userId}`;
      activeDrivers = parseInt(driversResult[0].count);
    } catch (error) {
      console.log('Error counting drivers with user_id filter:', error);
      // Falling back to count all active drivers (temporary until migration completes)
      const driversResult = await sql`SELECT COUNT(*) as count FROM drivers WHERE status = 'active'`;
      activeDrivers = parseInt(driversResult[0].count);
    }

    // Get maintenance counts by status - handle missing user_id column
    let maintenanceResult;
    try {
      maintenanceResult = await sql`
        SELECT 
          status, 
          COUNT(*) as count 
        FROM maintenance_records 
        WHERE user_id = ${userId}
        GROUP BY status
      `;
    } catch (error) {
      console.log('Error counting maintenance with user_id filter:', error);
      // Falling back to count all maintenance records (temporary until migration completes)
      maintenanceResult = await sql`
        SELECT 
          status, 
          COUNT(*) as count 
        FROM maintenance_records 
        GROUP BY status
      `;
    }

    // Initialize maintenance counts
    let pendingMaintenance = 0;
    let completedMaintenance = 0;
    let overdueMaintenance = 0;

    // Process maintenance results
    maintenanceResult.forEach((row: any) => {
      if (row.status === 'scheduled') {
        pendingMaintenance = parseInt(row.count);
      } else if (row.status === 'completed') {
        completedMaintenance = parseInt(row.count);
      } else if (row.status === 'overdue') {
        overdueMaintenance = parseInt(row.count);
      }
    });

    // Get customer counts with user_id filter
    let totalCustomers = 0;
    try {
      const customersResult = await sql`SELECT COUNT(*) as count FROM customers WHERE user_id = ${userId}`;
      totalCustomers = parseInt(customersResult[0].count);
    } catch (error) {
      console.log('Error counting customers with user_id filter:', error);
      // Falling back to count all customers (temporary until migration completes)
      try {
        const customersResult = await sql`SELECT COUNT(*) as count FROM customers`;
        totalCustomers = parseInt(customersResult[0].count);
      } catch (error) {
        console.error('Error counting all customers:', error);
      }
    }

    // Get rental counts and revenue (try with user_id filter, fall back if column doesn't exist yet)
    let activeRentals = 0;
    let completedRentals = 0;
    let rentalRevenue = 0;
    try {
      // Active rentals
      let activeRentalsResult;
      try {
        activeRentalsResult = await sql`SELECT COUNT(*) as count FROM rentals WHERE status = 'active' AND user_id = ${userId}`;
      } catch (error) {
        console.log('Falling back to count all active rentals');
        activeRentalsResult = await sql`SELECT COUNT(*) as count FROM rentals WHERE status = 'active'`;
      }
      activeRentals = parseInt(activeRentalsResult[0].count);

      // Completed rentals
      let completedRentalsResult;
      try {
        completedRentalsResult = await sql`SELECT COUNT(*) as count FROM rentals WHERE status = 'completed' AND user_id = ${userId}`;
      } catch (error) {
        console.log('Falling back to count all completed rentals');
        completedRentalsResult = await sql`SELECT COUNT(*) as count FROM rentals WHERE status = 'completed'`;
      }
      completedRentals = parseInt(completedRentalsResult[0].count);

      // Rental revenue
      let revenueResult;
      try {
        revenueResult = await sql`SELECT COALESCE(SUM(total_cost), 0) as revenue FROM rentals WHERE status = 'completed' AND user_id = ${userId}`;
      } catch (error) {
        console.log('Falling back to calculate all rental revenue');
        revenueResult = await sql`SELECT COALESCE(SUM(total_cost), 0) as revenue FROM rentals WHERE status = 'completed'`;
      }
      rentalRevenue = parseFloat(revenueResult[0].revenue);
    } catch (error) {
      console.error('Error counting rentals:', error);
    }

    // Get recent activity (combined from vehicles, drivers, maintenance, customers, and rentals)
    const recentActivity = await getRecentActivity();

    return {
      totalVehicles,
      activeDrivers,
      totalCustomers,
      activeRentals,
      completedRentals,
      rentalRevenue,
      pendingMaintenance,
      completedMaintenance,
      overdueMaintenance,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
    return {
      totalVehicles: 0,
      activeDrivers: 0,
      totalCustomers: 0,
      activeRentals: 0,
      completedRentals: 0,
      rentalRevenue: 0,
      pendingMaintenance: 0,
      completedMaintenance: 0,
      overdueMaintenance: 0,
      recentActivity: []
    };
  }
}

/**
 * Get recent activity across the system
 */
async function getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return [];
    }
    
    // Get recent vehicle activity (try with user_id filter, fall back if column doesn't exist yet)
    let vehicleActivity;
    try {
      vehicleActivity = await sql`
        SELECT 
          id,
          'vehicle' as type,
          CONCAT('Vehicle ', make, ' ', model, ' (', license_plate, ') was added') as description,
          created_at as timestamp
        FROM vehicles
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      console.log('Falling back to all vehicle activity');
      vehicleActivity = await sql`
        SELECT 
          id,
          'vehicle' as type,
          CONCAT('Vehicle ', make, ' ', model, ' (', license_plate, ') was added') as description,
          created_at as timestamp
        FROM vehicles
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    // Get recent driver activity (try with user_id filter, fall back if column doesn't exist yet)
    let driverActivity;
    try {
      driverActivity = await sql`
        SELECT 
          id,
          'driver' as type,
          CONCAT('Driver ', first_name, ' ', last_name, ' was ', 
            CASE 
              WHEN status = 'active' THEN 'activated'
              WHEN status = 'inactive' THEN 'deactivated'
              ELSE 'updated'
            END) as description,
          updated_at as timestamp
        FROM drivers
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      console.log('Falling back to all driver activity');
      driverActivity = await sql`
        SELECT 
          id,
          'driver' as type,
          CONCAT('Driver ', first_name, ' ', last_name, ' was ', 
            CASE 
              WHEN status = 'active' THEN 'activated'
              WHEN status = 'inactive' THEN 'deactivated'
              ELSE 'updated'
            END) as description,
          updated_at as timestamp
        FROM drivers
        ORDER BY updated_at DESC
        LIMIT ${limit}
      `;
    }

    // Get recent maintenance activity (try with user_id filter, fall back if column doesn't exist yet)
    let maintenanceActivity;
    try {
      maintenanceActivity = await sql`
        SELECT 
          m.id,
          'maintenance' as type,
          CONCAT(
            'Maintenance for ', 
            v.make, ' ', v.model, ' (', v.license_plate, ') was ', 
            CASE 
              WHEN m.status = 'completed' THEN 'completed'
              WHEN m.status = 'scheduled' THEN 'scheduled'
              WHEN m.status = 'overdue' THEN 'marked as overdue'
              ELSE 'updated'
            END
          ) as description,
          m.updated_at as timestamp
        FROM maintenance_records m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.user_id = ${userId}
        ORDER BY m.updated_at DESC
        LIMIT ${limit}
      `;
    } catch (error) {
      console.log('Falling back to all maintenance activity');
      maintenanceActivity = await sql`
        SELECT 
          m.id,
          'maintenance' as type,
          CONCAT(
            'Maintenance for ', 
            v.make, ' ', v.model, ' (', v.license_plate, ') was ', 
            CASE 
              WHEN m.status = 'completed' THEN 'completed'
              WHEN m.status = 'scheduled' THEN 'scheduled'
              WHEN m.status = 'overdue' THEN 'marked as overdue'
              ELSE 'updated'
            END
          ) as description,
          m.updated_at as timestamp
        FROM maintenance_records m
        JOIN vehicles v ON m.vehicle_id = v.id
        ORDER BY m.updated_at DESC
        LIMIT ${limit}
      `;
    }

    // Get recent customer activity (try with user_id filter, fall back if column doesn't exist yet)
    let customerActivity: RecentActivity[] = [];
    try {
      try {
        const result = await sql`
          SELECT 
            id,
            'customer' as type,
            CONCAT('Customer ', name, ' was added') as description,
            created_at as timestamp
          FROM customers
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
        customerActivity = result as unknown as RecentActivity[];
      } catch (error) {
        console.log('Falling back to all customer activity');
        const result = await sql`
          SELECT 
            id,
            'customer' as type,
            CONCAT('Customer ', name, ' was added') as description,
            created_at as timestamp
          FROM customers
          ORDER BY created_at DESC
          LIMIT ${limit}
        `;
        customerActivity = result as unknown as RecentActivity[];
      }
    } catch (error) {
      console.error('Error fetching customer activity:', error);
    }
    
    // Get recent rental activity (try with user_id filter, fall back if column doesn't exist yet)
    let rentalActivity: RecentActivity[] = [];
    try {
      try {
        const result = await sql`
          SELECT 
            r.id,
            'rental' as type,
            CONCAT(
              'Vehicle rented to ', r.customer_name, ' (', 
              CASE 
                WHEN r.status = 'active' THEN 'active'
                WHEN r.status = 'completed' THEN 'completed'
                WHEN r.status = 'cancelled' THEN 'cancelled'
                ELSE 'updated'
              END,
              ')'  
            ) as description,
            r.created_at as timestamp
          FROM rentals r
          WHERE r.user_id = ${userId}
          ORDER BY r.created_at DESC
          LIMIT ${limit}
        `;
        rentalActivity = result as unknown as RecentActivity[];
      } catch (error) {
        console.log('Falling back to all rental activity');
        const result = await sql`
          SELECT 
            r.id,
            'rental' as type,
            CONCAT(
              'Vehicle rented to ', r.customer_name, ' (', 
              CASE 
                WHEN r.status = 'active' THEN 'active'
                WHEN r.status = 'completed' THEN 'completed'
                WHEN r.status = 'cancelled' THEN 'cancelled'
                ELSE 'updated'
              END,
              ')'  
            ) as description,
            r.created_at as timestamp
          FROM rentals r
          ORDER BY r.created_at DESC
          LIMIT ${limit}
        `;
        rentalActivity = result as unknown as RecentActivity[];
      }
    } catch (error) {
      console.error('Error fetching rental activity:', error);
    }

    // Combine all activities and sort by timestamp
    const allActivity = [
      ...vehicleActivity,
      ...driverActivity,
      ...maintenanceActivity,
      ...customerActivity,
      ...rentalActivity
    ].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }).slice(0, limit);

    return allActivity as RecentActivity[];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
}

/**
 * Get upcoming maintenance tasks
 */
export async function getUpcomingMaintenance(limit: number = 5): Promise<any[]> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return [];
    }
    
    let upcomingMaintenance;
    try {
      upcomingMaintenance = await sql`
        SELECT 
          m.id, 
          m.vehicle_id, 
          CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
          m.service_type, 
          m.next_due_date, 
          m.status
        FROM maintenance_records m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.status IN ('scheduled', 'overdue')
          AND m.user_id = ${userId}
        ORDER BY 
          CASE 
            WHEN m.status = 'overdue' THEN 1
            WHEN m.status = 'scheduled' THEN 2
            ELSE 3
          END,
          m.next_due_date ASC
        LIMIT ${limit}
      `;
    } catch (error) {
      console.log('Error fetching maintenance with user_id filter:', error);
      // Falling back to all maintenance records (temporary until migration completes)
      upcomingMaintenance = await sql`
        SELECT 
          m.id, 
          m.vehicle_id, 
          CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
          m.service_type, 
          m.next_due_date, 
          m.status
        FROM maintenance_records m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.status IN ('scheduled', 'overdue')
        ORDER BY 
          CASE 
            WHEN m.status = 'overdue' THEN 1
            WHEN m.status = 'scheduled' THEN 2
            ELSE 3
          END,
          m.next_due_date ASC
        LIMIT ${limit}
      `;
    }
    
    return upcomingMaintenance;
  } catch (error) {
    console.error('Error fetching upcoming maintenance:', error);
    return [];
  }
}

/**
 * Get vehicle statistics by status or other attributes
 */
export async function getVehicleStats(): Promise<any> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { vehiclesByStatus: [] };
    }
    
    // You could expand this to include more detailed statistics
    // This is a simple example that could be extended
    let vehiclesByStatus;
    try {
      vehiclesByStatus = await sql`
        SELECT 
          CASE 
            WHEN last_service_date IS NULL OR last_service_date < NOW() - INTERVAL '6 months' THEN 'needs_service'
            ELSE 'good'
          END as status,
          COUNT(*) as count
        FROM vehicles
        WHERE user_id = ${userId}
        GROUP BY status
      `;
    } catch (error) {
      console.log('Error fetching vehicle stats with user_id filter:', error);
      // Falling back to all vehicles (temporary until migration completes)
      vehiclesByStatus = await sql`
        SELECT 
          CASE 
            WHEN last_service_date IS NULL OR last_service_date < NOW() - INTERVAL '6 months' THEN 'needs_service'
            ELSE 'good'
          END as status,
          COUNT(*) as count
        FROM vehicles
        GROUP BY status
      `;
    }
    
    return {
      vehiclesByStatus
    };
  } catch (error) {
    console.error('Error fetching vehicle statistics:', error);
    return {
      vehiclesByStatus: []
    };
  }
}
