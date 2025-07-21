"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MaintenanceRecord } from '@/types/maintenance';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface VehicleMaintenanceHistoryProps {
  maintenanceRecords: MaintenanceRecord[];
}

export default function VehicleMaintenanceHistory({ maintenanceRecords }: VehicleMaintenanceHistoryProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<number | null>(null);

  // Filter records based on status filter
  const filteredRecords = maintenanceRecords.filter(record => {
    // Status filter
    if (statusFilter !== 'all' && record.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Toggle details view
  const toggleDetails = (id: number | undefined) => {
    if (!id) return;
    setShowDetails(showDetails === id ? null : id);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle edit record
  const handleEdit = (id: number | undefined) => {
    if (!id) return;
    router.push(`/dashboard/maintenance/edit/${id}`);
  };

  // Handle view record details
  const handleViewDetails = (id: number | undefined) => {
    if (!id) return;
    toggleDetails(id);
  };

  return (
    <div>
      {/* Status Filter */}
      <div className="mb-6">
        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
        <select
          id="status-filter"
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 max-w-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No maintenance records found for this vehicle.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Performed
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <React.Fragment key={record.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.service_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.date_performed)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(record.next_due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(record.cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleEdit(record.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleViewDetails(record.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {showDetails === record.id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showDetails === record.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                            <p className="text-sm text-gray-500">{record.description || 'No description provided'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Service Provider</h4>
                            <p className="text-sm text-gray-500">{record.service_provider || 'Not specified'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                            <p className="text-sm text-gray-500">{record.notes || 'No notes provided'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
