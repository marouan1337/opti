// Simple script to delete a vehicle and its maintenance records directly
const { execSync } = require('child_process');
const path = require('path');

// Get the vehicle ID from command line arguments
const vehicleId = process.argv[2];

if (!vehicleId || isNaN(Number(vehicleId))) {
  console.error('Please provide a valid vehicle ID as an argument');
  process.exit(1);
}

try {
  // Run a SQL command to delete maintenance records first
  console.log(`Deleting maintenance records for vehicle ID ${vehicleId}...`);
  const deleteMaintenanceCommand = `
    npx dotenv -e .env -- npx tsx -e "
      import { sql } from './src/lib/db';
      async function run() {
        const result = await sql\`DELETE FROM maintenance_records WHERE vehicle_id = \${${vehicleId}}\`;
        console.log('Deleted maintenance records:', result);
      }
      run().catch(console.error);
    "
  `;
  
  execSync(deleteMaintenanceCommand, { stdio: 'inherit' });
  
  // Then delete the vehicle
  console.log(`Deleting vehicle with ID ${vehicleId}...`);
  const deleteVehicleCommand = `
    npx dotenv -e .env -- npx tsx -e "
      import { sql } from './src/lib/db';
      async function run() {
        const result = await sql\`DELETE FROM vehicles WHERE id = \${${vehicleId}}\`;
        console.log('Deleted vehicle:', result);
      }
      run().catch(console.error);
    "
  `;
  
  execSync(deleteVehicleCommand, { stdio: 'inherit' });
  
  console.log(`Successfully deleted vehicle ID ${vehicleId} and its maintenance records`);
} catch (error) {
  console.error('Error deleting vehicle:', error.message);
  process.exit(1);
}
