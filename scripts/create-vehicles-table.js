import dotenv from 'dotenv';
import fs from 'fs'; // Import file system module

// Try reading .env file content directly
try {
  const envFileContent = fs.readFileSync('.env', 'utf-8');
  console.log('Raw .env file content:\n', envFileContent);
} catch (error) {
  console.error('Error reading .env file:', error);
}

dotenv.config({ path: '.env' }); // Explicitly specify the path

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

console.log('dotenv config result:', dotenv.config({ path: '.env' })); // Log dotenv result
console.log('DATABASE_URL after config:', process.env.DATABASE_URL); // Log the variable after config
console.log('Full process.env:', process.env); // Log the full process.env

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function createVehiclesTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        make VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        year INT,
        license_plate VARCHAR(50) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Vehicles table created successfully (or already exists).');
  } catch (error) {
    console.error('Error creating vehicles table:', error);
  }
}

createVehiclesTable(); 