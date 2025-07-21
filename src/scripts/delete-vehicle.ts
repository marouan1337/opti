import { sql } from '@/lib/db';

// Define interface for SQL query results
interface SqlQueryResult {
  count?: number;
  rows?: any[];
  [key: string]: any;
}

/**
 * Script to safely delete a vehicle and its associated maintenance records
 * This handles the foreign key constraint by deleting maintenance records first
 */
export async function deleteVehicleWithRecords(vehicleId: number) {
  try {
    console.log(`Attempting to delete vehicle with ID ${vehicleId} and its maintenance records...`);
    
    // First, delete all maintenance records associated with this vehicle
    const deleteMaintenanceResult = await sql`
      DELETE FROM maintenance_records
      WHERE vehicle_id = ${vehicleId}
    ` as SqlQueryResult;
    
    console.log(`Deleted ${deleteMaintenanceResult.count} maintenance records for vehicle ID ${vehicleId}`);
    
    // Then delete the vehicle itself
    const deleteVehicleResult = await sql`
      DELETE FROM vehicles
      WHERE id = ${vehicleId}
    ` as SqlQueryResult;
    
    console.log(`Deleted ${deleteVehicleResult.count} vehicle with ID ${vehicleId}`);
    
    return {
      success: true,
      message: `Successfully deleted vehicle ID ${vehicleId} and ${deleteMaintenanceResult.count} associated maintenance records`
    };
  } catch (error) {
    console.error('Error deleting vehicle and its records:', error);
    return {
      success: false,
      message: `Error deleting vehicle: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  // Get vehicle ID from command line arguments
  const vehicleId = parseInt(process.argv[2]);
  
  if (!vehicleId || isNaN(vehicleId)) {
    console.error('Please provide a valid vehicle ID as an argument');
    process.exit(1);
  }
  
  deleteVehicleWithRecords(vehicleId)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
