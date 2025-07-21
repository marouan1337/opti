import React from 'react';
import Link from 'next/link';
import { sql } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth-utils';
import AddMaintenanceForm from '@/components/AddMaintenanceForm';

// Define the Vehicle interface for dropdown options
interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
}

// Get all vehicles for the current user for the dropdown
async function getVehicles(): Promise<Vehicle[]> {
  'use server';
  
  // Get the current user ID
  const userId = await getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return [];
  }
  
  try {
    const vehicles = await sql`
      SELECT id, make, model, year, license_plate 
      FROM vehicles 
      WHERE user_id = ${userId}
      ORDER BY make, model
    `;
    return vehicles as Vehicle[];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}

export default async function AddMaintenancePage() {
  const vehicles = await getVehicles();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Add Maintenance Record</h1>
        <Link 
          href="/dashboard/maintenance" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Maintenance
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <AddMaintenanceForm vehicles={vehicles} />
      </div>
    </div>
  );
}
