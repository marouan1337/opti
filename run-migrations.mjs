// ESM script to run database migrations
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createPool } from '@vercel/postgres';

// Load environment variables
dotenv.config();

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const db = createPool({
  connectionString: process.env.DATABASE_URL
});

async function checkDatabaseConnection() {
  try {
    console.log('Checking database connection...');
    const client = await db.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection successful.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

async function createVehiclesTable() {
  const client = await db.connect();
  try {
    console.log('Checking if vehicles table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'vehicles'
      ) as exists
    `);
    
    if (tableCheck.rows[0]?.exists) {
      console.log('Vehicles table already exists');
      return;
    }
    
    console.log('Creating vehicles table...');
    await client.query(`
      CREATE TABLE vehicles (
        id SERIAL PRIMARY KEY,
        make VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INTEGER,
        license_plate VARCHAR(255) NOT NULL,
        vin VARCHAR(255),
        color VARCHAR(255),
        mileage INTEGER,
        fuel_type VARCHAR(255),
        transmission VARCHAR(255),
        status VARCHAR(255) DEFAULT 'available',
        notes TEXT,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE INDEX idx_vehicles_user_id ON vehicles(user_id)
    `);
    
    console.log('Vehicles table created successfully');
  } catch (error) {
    console.error('Error creating vehicles table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createDriversTable() {
  const client = await db.connect();
  try {
    console.log('Checking if drivers table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'drivers'
      ) as exists
    `);
    
    if (tableCheck.rows[0]?.exists) {
      console.log('Drivers table already exists');
      return;
    }
    
    console.log('Creating drivers table...');
    await client.query(`
      CREATE TABLE drivers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        license_number VARCHAR(255) NOT NULL,
        license_expiry DATE,
        contact_number VARCHAR(255),
        email VARCHAR(255),
        notes TEXT,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE INDEX idx_drivers_user_id ON drivers(user_id)
    `);
    
    console.log('Drivers table created successfully');
  } catch (error) {
    console.error('Error creating drivers table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function createMaintenanceTable() {
  const client = await db.connect();
  try {
    console.log('Checking if maintenance_records table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'maintenance_records'
      ) as exists
    `);
    
    if (tableCheck.rows[0]?.exists) {
      console.log('Maintenance records table already exists');
      return;
    }
    
    console.log('Creating maintenance_records table...');
    await client.query(`
      CREATE TABLE maintenance_records (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        service_date DATE NOT NULL,
        service_type VARCHAR(255) NOT NULL,
        description TEXT,
        cost DECIMAL(10, 2),
        odometer_reading INTEGER,
        performed_by VARCHAR(255),
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_vehicle
          FOREIGN KEY(vehicle_id) 
          REFERENCES vehicles(id)
          ON DELETE CASCADE
      )
    `);
    
    await client.query(`
      CREATE INDEX idx_maintenance_vehicle_id ON maintenance_records(vehicle_id)
    `);
    
    await client.query(`
      CREATE INDEX idx_maintenance_records_user_id ON maintenance_records(user_id)
    `);
    
    console.log('Maintenance records table created successfully');
  } catch (error) {
    console.error('Error creating maintenance records table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  try {
    const connected = await checkDatabaseConnection();
    if (!connected) {
      console.error('Cannot proceed with migrations due to database connection failure');
      process.exit(1);
    }
    
    // Run migrations in the correct order
    await createVehiclesTable();
    await createDriversTable();
    await createMaintenanceTable();
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    // Close the database pool
    await db.end();
  }
}

// Run the migrations
runMigrations();
