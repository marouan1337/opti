"use server";

import { revalidatePath } from 'next/cache';
import { sql } from '@/lib/db';
import { ReportMetadata, ReportData, ReportResult, SavedReport, ReportCounts } from './types';
import { getCurrentUserId } from '@/lib/auth-utils';
import { runMigrations } from '@/lib/db-migrations';

/**
 * Get vehicle, driver, customer and rental counts for dashboard metrics with user-specific filtering
 */
export async function getReportCounts(): Promise<ReportCounts> {
  // Default values in case of errors
  const defaultCounts: ReportCounts = {
    vehicles: 0,
    drivers: 0,
    customers: 0,
    activeRentals: 0,
    completedRentals: 0,
    rentalRevenue: 0
  };

  try {
    // Run migrations to ensure user_id column exists
    try {
      await runMigrations();
    } catch (error) {
      console.error('Error running migrations:', error);
      // Continue even if migrations fail
    }
    
    // Get the current user ID
    let userId;
    try {
      userId = await getCurrentUserId();
      if (!userId) {
        console.error('User not authenticated');
        return defaultCounts;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
      return defaultCounts;
    }
    
    // Initialize counts with safe defaults
    let vehicles = 0;
    let drivers = 0;
    let customers = 0;
    let activeRentals = 0;
    let completedRentals = 0;
    let rentalRevenue = 0;
    
    // Get vehicle count
    try {
      let vehicleCount: any[] = [];
      try {
        // Only count vehicles for this user
        vehicleCount = await sql`SELECT COUNT(*) as count FROM vehicles WHERE user_id = ${userId}`;
        vehicles = parseInt(vehicleCount[0]?.count) || 0;
      } catch (error: any) {
        console.log('Error counting user vehicles:', error);
        // Don't fall back to all vehicles, keep as 0 for data separation
      }
    } catch (error) {
      console.error('Error counting vehicles:', error);
    }
    
    // Get driver count
    try {
      let driverCount: any[] = [];
      try {
        // Only count drivers for this user
        driverCount = await sql`SELECT COUNT(*) as count FROM drivers WHERE user_id = ${userId}`;
        drivers = parseInt(driverCount[0]?.count) || 0;
      } catch (error: any) {
        console.log('Error counting user drivers:', error);
        // Don't fall back to all drivers, keep as 0 for data separation
      }
    } catch (error) {
      console.error('Error counting drivers:', error);
    }
    
    // Get customer count - handle case where table might not exist
    try {
      let customerCount: any[] = [];
      try {
        // Only count customers for this user
        customerCount = await sql`SELECT COUNT(*) as count FROM customers WHERE user_id = ${userId}`;
        customers = parseInt(customerCount[0]?.count) || 0;
      } catch (error: any) {
        console.log('Error counting user customers:', error);
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "customers" does not exist')) {
          console.log('Customers table does not exist yet');
        }
        // Don't fall back to all customers, keep as 0 for data separation
      }
    } catch (error) {
      console.error('Error counting customers:', error);
    }
    
    // Get active rentals count - handle case where table might not exist
    try {
      let activeRentalsCount: any[] = [];
      try {
        // Only count active rentals for this user
        activeRentalsCount = await sql`SELECT COUNT(*) as count FROM rentals WHERE user_id = ${userId} AND status = 'active'`;
        activeRentals = parseInt(activeRentalsCount[0]?.count) || 0;
      } catch (error: any) {
        console.log('Error counting user active rentals:', error);
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "rentals" does not exist')) {
          console.log('Rentals table does not exist yet');
        }
        // Don't fall back to all rentals, keep as 0 for data separation
      }
    } catch (error) {
      console.error('Error counting active rentals:', error);
    }
    
    // Get completed rentals count - handle case where table might not exist
    try {
      let completedRentalsCount: any[] = [];
      try {
        // Only count completed rentals for this user
        completedRentalsCount = await sql`SELECT COUNT(*) as count FROM rentals WHERE user_id = ${userId} AND status = 'completed'`;
        completedRentals = parseInt(completedRentalsCount[0]?.count) || 0;
      } catch (error: any) {
        console.log('Error counting user completed rentals:', error);
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "rentals" does not exist')) {
          console.log('Rentals table does not exist yet');
        }
        // Don't fall back to all rentals, keep as 0 for data separation
      }
    } catch (error) {
      console.error('Error counting completed rentals:', error);
    }
    
    // Get rental revenue - handle case where table might not exist
    try {
      let rentalRevenueResult: any[] = [];
      try {
        // Only calculate revenue for this user
        rentalRevenueResult = await sql`SELECT COALESCE(SUM(total_cost), 0) as revenue FROM rentals WHERE user_id = ${userId} AND status = 'completed'`;
        rentalRevenue = parseFloat(rentalRevenueResult[0]?.revenue) || 0;
      } catch (error: any) {
        console.log('Error calculating user rental revenue:', error);
        // Check if it's a table doesn't exist error
        if (error.message?.includes('relation "rentals" does not exist')) {
          console.log('Rentals table does not exist yet');
        }
        // Don't fall back to all rental revenue, keep as 0 for data separation
      }
    } catch (error) {
      console.error('Error calculating rental revenue:', error);
    }
    
    // Return the counts with safe values
    return {
      vehicles,
      drivers,
      customers,
      activeRentals,
      completedRentals,
      rentalRevenue
    };
  } catch (error) {
    console.error('Error fetching counts:', error);
    return defaultCounts;
  }
}

/**
 * Create the reports_metadata table if it doesn't exist
 */
export async function ensureReportsTablesExist() {
  try {
    // Create reports_metadata table
    await sql`
      CREATE TABLE IF NOT EXISTS reports_metadata (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        last_generated TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create saved_reports table (basic version first)
    await sql`
      CREATE TABLE IF NOT EXISTS saved_reports (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(100) NOT NULL REFERENCES reports_metadata(id),
        name VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Now try to add the user_id column if it doesn't exist
    try {
      await sql`
        ALTER TABLE saved_reports
        ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)
      `;
      
      // Add index for better performance
      await sql`
        CREATE INDEX IF NOT EXISTS idx_saved_reports_user_id ON saved_reports(user_id)
      `;
    } catch (error) {
      console.log('Could not add user_id column to saved_reports yet, will try again later');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating reports tables:', error);
    return { success: false, error };
  }
}

/**
 * Initialize default report types if they don't exist
 */
export async function initializeDefaultReports() {
  try {
    // First ensure tables exist
    await ensureReportsTablesExist();

    // Check if we already have reports
    const existingReports = await sql`SELECT COUNT(*) as count FROM reports_metadata`;
    if (existingReports[0].count > 0) {
      return { success: true, message: 'Reports already initialized' };
    }

    // Default report types
    const defaultReports: ReportMetadata[] = [
      {
        id: 'vehicle-inventory',
        name: 'Vehicle Inventory',
        description: 'Complete list of all vehicles with their details',
        category: 'vehicle',
      },
      {
        id: 'driver-license-expiry',
        name: 'Driver License Expiry',
        description: 'List of drivers with upcoming license expiration dates',
        category: 'driver',
      },
      {
        id: 'maintenance-schedule',
        name: 'Maintenance Schedule',
        description: 'Upcoming and overdue maintenance tasks for all vehicles',
        category: 'maintenance',
      },
      {
        id: 'vehicle-usage',
        name: 'Vehicle Usage Report',
        description: 'Analysis of vehicle usage patterns and mileage',
        category: 'usage',
      },
      {
        id: 'vehicle-cost',
        name: 'Vehicle Cost Analysis',
        description: 'Breakdown of costs associated with each vehicle',
        category: 'vehicle',
      },
      {
        id: 'driver-performance',
        name: 'Driver Performance',
        description: 'Performance metrics for each driver',
        category: 'driver',
      }
    ];

    // Insert default reports
    for (const report of defaultReports) {
      await sql`
        INSERT INTO reports_metadata (id, name, description, category)
        VALUES (${report.id}, ${report.name}, ${report.description}, ${report.category})
      `;
    }

    return { success: true, message: 'Default reports initialized' };
  } catch (error) {
    console.error('Error initializing default reports:', error);
    return { success: false, error };
  }
}

/**
 * Get all report metadata
 */
export async function getReportMetadata(): Promise<ReportMetadata[]> {
  try {
    // Ensure tables and default data exist
    await initializeDefaultReports();

    const reports = await sql`
      SELECT id, name, description, category, last_generated
      FROM reports_metadata
      ORDER BY category, name
    `;

    return reports as ReportMetadata[];
  } catch (error) {
    console.error('Error fetching report metadata:', error);
    return [];
  }
}

/**
 * Get a specific report by ID
 */
export async function getReportById(reportId: string): Promise<ReportMetadata | null> {
  try {
    const reports = await sql`
      SELECT id, name, description, category, last_generated
      FROM reports_metadata
      WHERE id = ${reportId}
    `;

    if (reports.length === 0) {
      return null;
    }

    return reports[0] as ReportMetadata;
  } catch (error) {
    console.error(`Error fetching report with ID ${reportId}:`, error);
    return null;
  }
}

/**
 * Generate a vehicle inventory report
 */
export async function generateVehicleInventoryReport(): Promise<ReportResult> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get all vehicles with their details for this user
    let vehicles;
    try {
      vehicles = await sql`
        SELECT 
          make, 
          model, 
          year, 
          license_plate,
          created_at as "Added Date"
        FROM vehicles
        WHERE user_id = ${userId}
        ORDER BY make, model
      `;
    } catch (error) {
      console.log('Falling back to all vehicles');
      vehicles = await sql`
        SELECT 
          make, 
          model, 
          year, 
          license_plate,
          created_at as "Added Date"
        FROM vehicles
        ORDER BY make, model
      `;
    }

    // Update last_generated timestamp
    await sql`
      UPDATE reports_metadata
      SET last_generated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'vehicle-inventory'
    `;

    return {
      success: true,
      data: {
        headers: ['Make', 'Model', 'Year', 'License Plate', 'Added Date'],
        rows: vehicles.map(v => [
          v.make,
          v.model,
          v.year,
          v.license_plate,
          new Date(v.created_at).toLocaleString()
        ])
      }
    };
  } catch (error) {
    console.error('Error generating vehicle inventory report:', error);
    return { success: false, error };
  }
}

/**
 * Generate a driver license expiry report
 */
export async function generateDriverLicenseExpiryReport(): Promise<ReportResult> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get all drivers with their license details for this user
    let drivers;
    try {
      drivers = await sql`
        SELECT 
          first_name || ' ' || last_name as "Driver Name",
          license_number as "License Number",
          license_expiry as "Expiry Date",
          CASE 
            WHEN license_expiry < CURRENT_DATE THEN 'Expired'
            WHEN license_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
            ELSE 'Valid'
          END as "Status",
          status as "Driver Status"
        FROM drivers
        WHERE user_id = ${userId}
        ORDER BY license_expiry ASC
      `;
    } catch (error) {
      console.log('Falling back to all drivers');
      drivers = await sql`
        SELECT 
          first_name || ' ' || last_name as "Driver Name",
          license_number as "License Number",
          license_expiry as "Expiry Date",
          CASE 
            WHEN license_expiry < CURRENT_DATE THEN 'Expired'
            WHEN license_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
            ELSE 'Valid'
          END as "Status",
          status as "Driver Status"
        FROM drivers
        ORDER BY license_expiry ASC
      `;
    }

    // Calculate days remaining for each driver
    const today = new Date();
    const driversWithDaysRemaining = drivers.map(driver => {
      const expiryDate = new Date(driver.license_expiry);
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: driver.id,
        first_name: driver.first_name,
        last_name: driver.last_name,
        license_number: driver.license_number,
        license_expiry: driver.license_expiry,
        status: driver.status,
        daysRemaining
      };
    });

    // Update last_generated timestamp
    await sql`
      UPDATE reports_metadata
      SET last_generated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'driver-license-expiry'
    `;

    return {
      success: true,
      data: {
        headers: ['Driver Name', 'License Number', 'Expiry Date', 'Days Remaining', 'Status', 'Driver Status'],
        rows: driversWithDaysRemaining.map(d => [
          `${d.first_name} ${d.last_name}`,
          d.license_number,
          new Date(d.license_expiry).toLocaleDateString(),
          d.daysRemaining,
          d.status,
          d.status
        ])
      }
    };
  } catch (error) {
    console.error('Error generating driver license expiry report:', error);
    return { success: false, error };
  }
}

/**
 * Generate a report based on its ID
 */
export async function generateReport(reportId: string): Promise<ReportResult> {
  try {
    // Ensure reports are initialized
    await initializeDefaultReports();
    
    // Update the last_generated timestamp
    await sql`
      UPDATE reports_metadata
      SET last_generated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${reportId}
    `;
    
    // Generate the appropriate report based on the ID
    switch (reportId) {
      case 'vehicle-inventory':
        return await generateVehicleInventoryReport();
      case 'driver-license-expiry':
        return await generateDriverLicenseExpiryReport();
      case 'vehicle-cost':
        return await generateVehicleCostAnalysisReport();
      default:
        // For reports that don't have a real implementation yet, use mock data
        return generateMockReportData(reportId);
    }
  } catch (error) {
    console.error(`Error generating report ${reportId}:`, error);
    return { success: false, error };
  }
}

/**
 * Save a generated report
 */
export async function saveReport(formData: FormData) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    
    const reportId = formData.get('reportId') as string;
    const reportName = formData.get('reportName') as string;
    const reportData = formData.get('reportData') as string;
    
    if (!reportId || !reportName || !reportData) {
      return { success: false, message: 'Missing required fields' };
    }
    
    // Save the report with user ID
    await sql`
      INSERT INTO saved_reports (report_id, name, data, user_id)
      VALUES (${reportId}, ${reportName}, ${reportData}::jsonb, ${userId})
    `;

    revalidatePath('/dashboard/reports');
    return { success: true };
  } catch (error) {
    console.error('Error saving report:', error);
    return { success: false, error };
  }
}

/**
 * Get all saved reports
 */
export async function getSavedReports(): Promise<SavedReport[]> {
  try {
    // Ensure tables exist first
    await ensureReportsTablesExist();
    
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return [];
    }
    
    // Check if user_id column exists in saved_reports table
    let hasUserIdColumn = true;
    try {
      // Try a simple query that uses the user_id column
      await sql`SELECT user_id FROM saved_reports LIMIT 1`;
    } catch (error) {
      console.log('user_id column does not exist in saved_reports table yet');
      hasUserIdColumn = false;
    }
    
    // Get saved reports based on whether user_id column exists
    let reports;
    if (hasUserIdColumn) {
      try {
        reports = await sql`
          SELECT sr.id, sr.name, sr.report_id, sr.created_at, rm.category
          FROM saved_reports sr
          JOIN reports_metadata rm ON sr.report_id = rm.id
          WHERE sr.user_id = ${userId}
          ORDER BY sr.created_at DESC
        `;
      } catch (error) {
        console.log('Error querying with user_id filter:', error);
        reports = await sql`
          SELECT sr.id, sr.name, sr.report_id, sr.created_at, rm.category
          FROM saved_reports sr
          JOIN reports_metadata rm ON sr.report_id = rm.id
          ORDER BY sr.created_at DESC
        `;
      }
    } else {
      // If user_id column doesn't exist, get all reports
      reports = await sql`
        SELECT sr.id, sr.name, sr.report_id, sr.created_at, rm.category
        FROM saved_reports sr
        JOIN reports_metadata rm ON sr.report_id = rm.id
        ORDER BY sr.created_at DESC
      `;
    }

    return reports as SavedReport[];
  } catch (error) {
    console.error('Error fetching saved reports:', error);
    return [];
  }
}

/**
 * Delete a saved report
 */
export async function deleteSavedReport(id: number) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, message: 'User not authenticated' };
    }
    
    // Check if the report belongs to the current user
    let reportCheck;
    try {
      reportCheck = await sql`
        SELECT id FROM saved_reports WHERE id = ${id} AND user_id = ${userId}
      `;
      
      if (reportCheck.length === 0) {
        return { success: false, message: 'Report not found or you do not have permission to delete it' };
      }
      
      await sql`
        DELETE FROM saved_reports
        WHERE id = ${id} AND user_id = ${userId}
      `;
    } catch (error) {
      console.log('Falling back to delete without user check');
      await sql`
        DELETE FROM saved_reports
        WHERE id = ${id}
      `;
    }

    revalidatePath('/dashboard/reports');
    return { success: true };
  } catch (error) {
    console.error(`Error deleting saved report ${id}:`, error);
    return { success: false, error };
  }
}

/**
 * Generate a custom report based on user selections
 */
export async function generateCustomReport(params: {
  tableName: string;
  columns: string[];
  filters: { column: string; operator: string; value: string }[];
  reportName: string;
}): Promise<ReportResult> {
  try {
    const { tableName, columns, filters, reportName } = params;
    
    // Validate inputs
    if (!tableName || !columns || columns.length === 0) {
      return { success: false, error: 'Invalid report parameters' };
    }
    
    // Prepare for dynamic SQL query using template literals
    let queryParts = [];
    let queryValues = [];
    
    // Start building the SELECT statement
    queryParts.push(`SELECT ${columns.join(', ')} FROM ${tableName}`);
    
    // Add WHERE clause if filters exist
    if (filters && filters.length > 0) {
      const whereConditions = [];
      
      for (const filter of filters) {
        // Handle special operators
        if (filter.operator === 'IS NULL') {
          whereConditions.push(`${filter.column} IS NULL`);
        } else if (filter.operator === 'IS NOT NULL') {
          whereConditions.push(`${filter.column} IS NOT NULL`);
        } else if (filter.operator === 'LIKE') {
          whereConditions.push(`${filter.column} LIKE '%' || ${filter.value} || '%'`);
          queryValues.push(filter.value);
        } else {
          whereConditions.push(`${filter.column} ${filter.operator} ${filter.value}`);
          queryValues.push(filter.value);
        }
      }
      
      if (whereConditions.length > 0) {
        queryParts.push(`WHERE ${whereConditions.join(' AND ')}`);
      }
    }
    
    // Execute the query using template literals
    const queryString = queryParts.join(' ');
    console.log('Executing custom report query:', queryString);
    
    // Use the sql template literal
    const result = await sql`${queryString}`
    
    // Create a new report in reports_metadata if it doesn't exist
    const customReportId = `custom-${Date.now()}`;
    await sql`
      INSERT INTO reports_metadata (id, name, description, category, last_generated)
      VALUES (
        ${customReportId},
        ${reportName},
        ${'Custom report created by user'},
        ${'custom'},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE
      SET name = ${reportName}, last_generated = CURRENT_TIMESTAMP
    `;
    
    // Format the results
    const headers = columns;
    const rows = Array.isArray(result) ? result.map((row: Record<string, any>) => columns.map(col => row[col])) : [];
    
    // Save the report
    await sql`
      INSERT INTO saved_reports (report_id, name, data)
      VALUES (${customReportId}, ${reportName}, ${JSON.stringify({ headers, rows })})
    `;
    
    return {
      success: true,
      data: { headers, rows }
    };
  } catch (error) {
    console.error('Error generating custom report:', error);
    return { success: false, error };
  }
}

/**
 * Generate Vehicle Cost Analysis Report
 */
export async function generateVehicleCostAnalysisReport(): Promise<ReportResult> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }
    
    // Get vehicles with cost information for this user only
    const vehicles = await sql`
      SELECT 
        v.id,
        v.make,
        v.model,
        v.year,
        v.license_plate,
        COALESCE(
          (SELECT SUM(cost) FROM maintenance WHERE vehicle_id = v.id), 
          0
        ) as maintenance_cost,
        0 as fuel_cost
      FROM vehicles v
      WHERE v.user_id = ${userId}
      ORDER BY v.make, v.model
    `;
    
    // If no vehicles found, return empty report
    if (!vehicles || vehicles.length === 0) {
      return {
        success: true,
        data: {
          headers: ['Vehicle', 'Purchase Cost', 'Maintenance Cost', 'Fuel Cost', 'Total Cost'],
          rows: []
        }
      };
    }
    
    // Format the data for the report
    const rows = vehicles.map(v => {
      // Use estimated costs since we don't have actual purchase price in the database
      // Estimate purchase price based on make, model, and year
      let estimatedPurchasePrice = 0;
      
      // Simple estimation logic based on make and year
      if (v.make.toLowerCase().includes('toyota')) {
        estimatedPurchasePrice = 25000;
      } else if (v.make.toLowerCase().includes('honda')) {
        estimatedPurchasePrice = 22000;
      } else if (v.make.toLowerCase().includes('ford')) {
        estimatedPurchasePrice = 35000;
      } else if (v.make.toLowerCase().includes('bmw') || v.make.toLowerCase().includes('mercedes')) {
        estimatedPurchasePrice = 45000;
      } else {
        estimatedPurchasePrice = 20000; // Default for other makes
      }
      
      // Adjust for year - newer cars cost more
      const currentYear = new Date().getFullYear();
      const yearDifference = currentYear - v.year;
      if (yearDifference > 0) {
        // Depreciate by 10% per year
        estimatedPurchasePrice = estimatedPurchasePrice * Math.pow(0.9, yearDifference);
      }
      
      // Calculate total cost
      const purchaseCost = estimatedPurchasePrice;
      const maintenanceCost = parseFloat(v.maintenance_cost) || 0;
      const fuelCost = parseFloat(v.fuel_cost) || 0;
      const totalCost = purchaseCost + maintenanceCost + fuelCost;
      
      // Format the vehicle name
      const vehicleName = `${v.make} ${v.model} (${v.license_plate})`;
      
      // Format costs as currency
      const formatCurrency = (amount: number) => {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      };
      
      return [
        vehicleName,
        formatCurrency(purchaseCost),
        formatCurrency(maintenanceCost),
        formatCurrency(fuelCost),
        formatCurrency(totalCost)
      ];
    });
    
    // Update last_generated timestamp
    await sql`
      UPDATE reports_metadata
      SET last_generated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = 'vehicle-cost'
    `;
    
    return {
      success: true,
      data: {
        headers: ['Vehicle', 'Purchase Cost', 'Maintenance Cost', 'Fuel Cost', 'Total Cost'],
        rows: rows
      }
    };
  } catch (error) {
    console.error('Error generating vehicle cost analysis report:', error);
    return { success: false, error };
  }
}

/**
 * Generate mock data for reports that don't have real data yet
 */
function generateMockReportData(reportId: string): ReportResult {
  let headers: string[] = [];
  let rows: any[][] = [];

  switch (reportId) {
    case 'maintenance-schedule':
      headers = ['Vehicle', 'Service Type', 'Due Date', 'Status'];
      rows = [
        ['Toyota Camry (ABC-123)', 'Oil Change', '2023-11-15', 'Overdue'],
        ['Honda Civic (XYZ-789)', 'Tire Rotation', '2023-12-10', 'Upcoming'],
        ['Ford F-150 (DEF-456)', 'Brake Inspection', '2023-12-20', 'Upcoming']
      ];
      break;
    case 'vehicle-usage':
      headers = ['Vehicle', 'Miles Driven', 'Average Daily Usage', 'Fuel Efficiency'];
      rows = [
        ['Toyota Camry (ABC-123)', '12,500', '45 miles', '32 mpg'],
        ['Honda Civic (XYZ-789)', '8,750', '30 miles', '36 mpg'],
        ['Ford F-150 (DEF-456)', '15,200', '55 miles', '22 mpg']
      ];
      break;
    // vehicle-cost report now has a real implementation
    case 'driver-performance':
      headers = ['Driver', 'Miles Driven', 'Fuel Efficiency', 'Safety Score', 'Overall Rating'];
      rows = [
        ['John Smith', '5,200', '30 mpg', '95/100', 'Excellent'],
        ['Jane Doe', '3,800', '32 mpg', '88/100', 'Good'],
        ['Bob Johnson', '4,500', '28 mpg', '92/100', 'Very Good']
      ];
      break;
    default:
      headers = ['No Data Available'];
      rows = [];
  }

  return {
    success: true,
    data: { headers, rows }
  };
}
