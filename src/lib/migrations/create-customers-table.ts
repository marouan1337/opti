"use server";

import { sql } from '@/lib/db';

/**
 * Creates the customers table to store customer information
 */
export async function createCustomersTable() {
  try {
    // Create the customers table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)
    `;
    
    console.log('Customers table created successfully');
    return { success: true, message: 'Customers table created successfully' };
  } catch (error) {
    console.error('Error creating customers table:', error);
    return { success: false, message: 'Error creating customers table', error };
  }
}
