"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteMaintenanceRecord, markMaintenanceAsCompleted } from '../app/dashboard/maintenance/actions';
import { MaintenanceRecord } from '@/types/maintenance';
import { downloadMaintenancePDF } from '@/lib/pdfUtils';

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
    
    // Skip search filtering if search term is empty
    if (!searchTerm) return true;
    
    // Search filter with null checks
    const searchLower = searchTerm.toLowerCase();
    return (
      (record.vehicle_info?.toLowerCase().includes(searchLower) ?? false) ||
      (record.service_type?.toLowerCase().includes(searchLower) ?? false) ||
      (record.description?.toLowerCase().includes(searchLower) ?? false) ||
      (record.service_provider?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined || amount === '') {
      return '$0.00';
    }
    
    // Convert string to number if needed
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if it's a valid number
    if (isNaN(numericAmount)) {
      return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numericAmount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle mark as complete
  const handleMarkComplete = async (id: number | undefined) => {
    if (!id) return;
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
  const handleEdit = (id: number | undefined) => {
    if (!id) return;
    // Navigate to the edit page
    router.push(`/dashboard/maintenance/edit/${id}`);
  };

  // Handle delete record
  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
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

  return (
    <div>
      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Records</label>
          <input
            type="text"
            id="search"
            placeholder="Search by vehicle, service type, provider..."
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-64">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            id="status-filter"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        <div className="flex items-end gap-2">
          <button
            onClick={() => downloadMaintenancePDF(filteredRecords, 'Maintenance Records')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
            disabled={filteredRecords.length === 0}
          >
            Export PDF
          </button>
          <button
            onClick={() => router.push('/dashboard/maintenance/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
          >
            Add Record
          </button>
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
