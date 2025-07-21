import React from 'react';
import ReportsClient from '../../../components/ReportsClient';
import { getReportMetadata, getReportCounts } from './actions';

// Define interfaces for report data
interface ReportMetadata {
  id: string;
  name: string;
  description: string;
  category: 'vehicle' | 'driver' | 'maintenance' | 'usage';
  last_generated?: string;
}

// We're now importing the getReportCounts function from actions.ts instead of defining it here

export default async function ReportsPage() {
  const reports = await getReportMetadata();
  const counts = await getReportCounts();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports Dashboard</h1>
      
      {/* Dashboard metrics - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Vehicles</h3>
          <p className="text-3xl font-bold text-blue-600">{counts.vehicles}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Drivers</h3>
          <p className="text-3xl font-bold text-green-600">{counts.drivers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Customers</h3>
          <p className="text-3xl font-bold text-purple-600">{counts.customers}</p>
        </div>
      </div>
      
      {/* Dashboard metrics - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700">Active Rentals</h3>
          <p className="text-3xl font-bold text-green-600">{counts.activeRentals}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700">Completed Rentals</h3>
          <p className="text-3xl font-bold text-blue-600">{counts.completedRentals}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700">Rental Revenue</h3>
          <p className="text-3xl font-bold text-emerald-600">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(counts.rentalRevenue)}
          </p>
        </div>
      </div>
      
      {/* Reports section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Available Reports</h2>
          <p className="text-sm text-gray-600 mt-1">Total available reports: {reports.length}</p>
        </div>
        
        {/* Client component for interactive features */}
        <ReportsClient reports={reports} />
      </div>
    </div>
  );
}
