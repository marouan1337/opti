import React from 'react';

import MaintenanceClient from '@/components/MaintenanceClient';
import { getMaintenanceRecords, checkOverdueMaintenance } from './actions';
import { MaintenanceRecord } from '@/types/maintenance';

export default async function MaintenancePage() {
  // Get maintenance records and ensure all have an id
  const records = await getMaintenanceRecords();
  const maintenanceRecords = records.filter(record => record.id !== undefined) as MaintenanceRecord[];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        {/* Add New Maintenance Record button */}
        <a 
          href="/dashboard/maintenance/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Maintenance Record
        </a>
      </div>

      {/* Maintenance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Scheduled Maintenance Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Scheduled</h3>
          <p className="text-3xl font-bold text-blue-600">
            {maintenanceRecords.filter(r => r.status === 'scheduled').length}
          </p>
          <p className="text-sm text-blue-600 mt-2">Upcoming maintenance tasks</p>
        </div>
        
        {/* Overdue Maintenance Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Overdue</h3>
          <p className="text-3xl font-bold text-red-600">
            {maintenanceRecords.filter(r => r.status === 'overdue').length}
          </p>
          <p className="text-sm text-red-600 mt-2">Past due maintenance tasks</p>
        </div>
        
        {/* Completed Maintenance Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">
            {maintenanceRecords.filter(r => r.status === 'completed').length}
          </p>
          <p className="text-sm text-green-600 mt-2">Finished maintenance tasks</p>
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div id="maintenance-table" className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Records</h2>
        
        {/* Use the client component for interactive features */}
        <MaintenanceClient maintenanceRecords={maintenanceRecords} />
      </div>
    </div>
  );
}
