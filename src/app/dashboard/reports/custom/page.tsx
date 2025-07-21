import React from 'react';
import Link from 'next/link';
import CustomReportBuilder from '../../../../components/CustomReportBuilder';
import { sql } from '@/lib/db';

// Define interfaces for schema types to match CustomReportBuilder component
interface Column {
  column_name: string;
  data_type: string;
}

interface Table {
  name: string;
  displayName: string;
  columns: Column[];
}

interface Schema {
  tables: {
    [key: string]: Table;
  };
}

// Get database schema information for custom reports
async function getDatabaseSchema(): Promise<Schema> {
  'use server';
  
  try {
    // Get vehicles table columns
    const vehiclesColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'vehicles'
      ORDER BY ordinal_position
    `;
    
    // Get drivers table columns
    const driversColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'drivers'
      ORDER BY ordinal_position
    `;
    
    // Ensure the columns match the Column interface
    const typedVehiclesColumns = vehiclesColumns.map(col => ({
      column_name: col.column_name,
      data_type: col.data_type
    }));
    
    const typedDriversColumns = driversColumns.map(col => ({
      column_name: col.column_name,
      data_type: col.data_type
    }));
    
    return {
      tables: {
        vehicles: {
          name: 'vehicles',
          displayName: 'Vehicles',
          columns: typedVehiclesColumns
        },
        drivers: {
          name: 'drivers',
          displayName: 'Drivers',
          columns: typedDriversColumns
        }
      }
    };
  } catch (error) {
    console.error('Error fetching database schema:', error);
    return {
      tables: {
        vehicles: {
          name: 'vehicles',
          displayName: 'Vehicles',
          columns: []
        },
        drivers: {
          name: 'drivers',
          displayName: 'Drivers',
          columns: []
        }
      }
    };
  }
}

export default async function CustomReportPage() {
  const schema = await getDatabaseSchema();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Create Custom Report</h1>
        <Link 
          href="/dashboard/reports" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Reports
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="mb-6 text-gray-600">
          Build a custom report by selecting tables, columns, and filters. You can combine data from different tables
          to create comprehensive reports tailored to your needs.
        </p>
        
        <CustomReportBuilder schema={schema} />
      </div>
    </div>
  );
}
