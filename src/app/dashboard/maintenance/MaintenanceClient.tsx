"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMaintenanceRecord, markMaintenanceAsCompleted } from './actions';

// Define the Maintenance interface
interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  vehicle_info: string;
  service_type: string;
  description: string;
  date_performed: string;
  next_due_date: string;
  cost: number;
  status: 'scheduled' | 'completed' | 'overdue';
  service_provider: string;
  notes: string;
}

interface MaintenanceClientProps {
  maintenanceRecords: MaintenanceRecord[];
}

export default function MaintenanceClient({ maintenanceRecords }: MaintenanceClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<number | null>(null);

  // Filter records based on search term and status filter
  const filteredRecords = maintenanceRecords.filter(record => {
    // Status filter
    if (statusFilter !== 'all' && record.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    return (
      record.vehicle_info.toLowerCase().includes(searchLower) ||
      record.service_type.toLowerCase().includes(searchLower) ||
      record.description.toLowerCase().includes(searchLower) ||
      record.service_provider.toLowerCase().includes(searchLower)
    );
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle mark as complete
  const handleMarkComplete = async (id: number) => {
    if (confirm('Mark this maintenance task as completed?')) {
      try {
        const result = await markMaintenanceAsCompleted(id);
        if (result.success) {
          router.refresh();
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error('Error marking maintenance as complete:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  // Handle edit record
  const handleEdit = (id: number) => {
    // This would navigate to the edit page
    console.log(`Editing maintenance record ${id}`);
    alert('Edit functionality will be implemented');
  };

  // Handle delete record
  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        const result = await deleteMaintenanceRecord(id);
        if (result.success) {
          router.refresh();
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting maintenance record:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  // Toggle details view
  const toggleDetails = (id: number) => {
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

  return (
    <div>
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search maintenance records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Maintenance Records Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Type
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
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <React.Fragment key={record.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.vehicle_info}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.service_type}
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
                        {record.status !== 'completed' && (
                          <button
                            onClick={() => handleMarkComplete(record.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(record.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleDetails(record.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {showDetails === record.id ? 'Hide' : 'Details'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showDetails === record.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Description</h4>
                            <p className="text-sm text-gray-500 mt-1">{record.description || 'No description provided'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Service Provider</h4>
                            <p className="text-sm text-gray-500 mt-1">{record.service_provider || 'Not specified'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Date Performed</h4>
                            <p className="text-sm text-gray-500 mt-1">{formatDate(record.date_performed) || 'Not performed yet'}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Notes</h4>
                            <p className="text-sm text-gray-500 mt-1">{record.notes || 'No notes available'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No maintenance records match your filters'
                    : 'No maintenance records available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
