// Simple script to delete vehicle ID 10 and its maintenance records
require('dotenv').config();
const { Pool } = require('pg');

// Create a PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function deleteVehicle() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    console.log('Deleting maintenance records for vehicle ID 10...');
    const deleteMaintenanceResult = await client.query(
      'DELETE FROM maintenance_records WHERE vehicle_id = $1',
      [10]
    );
    console.log(`Deleted ${deleteMaintenanceResult.rowCount} maintenance records`);
    
    console.log('Deleting vehicle with ID 10...');
    const deleteVehicleResult = await client.query(
      'DELETE FROM vehicles WHERE id = $1',
      [10]
    );
    console.log(`Deleted ${deleteVehicleResult.rowCount} vehicle`);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Successfully deleted vehicle ID 10 and its maintenance records');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error deleting vehicle:', error.message);
  } finally {
    // Release the client back to the pool
    client.release();
    // Close the pool
    await pool.end();
  }
}

// Run the function
deleteVehicle().catch(console.error);
