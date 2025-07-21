import React from 'react';

// Import the getDrivers function from actions
import { getDrivers } from './actions';
import DriversClient from './DriversClient';

// Define the Driver interface
interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  license_expiry: string;
  contact_number: string;
  email: string;
  status: string;
  // Add other properties as needed
}

// We're now importing the getDrivers function from actions.ts instead of defining it here

export default async function DriversPage() {
  // Add type assertion to fix TypeScript error
  const drivers = await getDrivers() as Driver[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>

      {/* Buttons for Add New Driver and Download All PDF */}
      <div className="flex justify-end space-x-4">
        {/* Download All PDF button */}
        <button 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Download All PDF
        </button>
        {/* Add New Driver button */}
        <a 
          href="/dashboard/drivers/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Driver
        </a>
      </div>

      <div id="drivers-table" className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Drivers List</h2>
        {/* Use the client component for interactive features */}
        <DriversClient drivers={drivers} />
      </div>
    </div>
  );
}
