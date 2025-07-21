import React from 'react';

// Import the getVehicles function from actions
import { getVehicles } from './actions';
import VehiclesClient from '@/components/VehiclesClient';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string; // Use snake_case to match potential database column name
  // Add other properties as needed
}

// Using the sql instance from our centralized database utility

// We're now importing the getVehicles function from actions.ts instead of defining it here

export default async function VehiclesPage() {
  const vehicles = await getVehicles() as Vehicle[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vehicles Management</h1>

      {/* Buttons for Add New Vehicle and Download All PDF (will interact with Server Actions or Client Components)*/}
      <div className="flex justify-end space-x-4">
         {/* Download All PDF button (will need a mechanism to trigger PDF generation, perhaps a Server Action or client component calling an API route)*/}
         <button 
          // This button will trigger a Server Action or client-side logic for PDF download
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Download All PDF
        </button>
        {/* Add New Vehicle button */}
        <a 
          href="/dashboard/vehicles/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Vehicle
        </a>
      </div>

      <div id="vehicles-table" className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fleet List</h2>
        <VehiclesClient vehicles={vehicles} />
      </div>
    </div>
  );
} 