"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateRentalStatus, deleteRental } from '@/app/dashboard/rentals/actions';
import { Rental } from '@/types/rental';

interface RentalsClientProps {
  rentals: Rental[];
}

export default function RentalsClient({ rentals }: RentalsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<number | null>(null);

  // Filter records based on search term and status filter
  const filteredRentals = rentals.filter(rental => {
    // Status filter
    if (statusFilter !== 'all' && rental.status !== statusFilter) {
      return false;
    }
    
    // Skip search filtering if search term is empty
    if (!searchTerm) return true;
    
    // Search filter with null checks
    const searchLower = searchTerm.toLowerCase();
    return (
      (rental.vehicle_info?.toLowerCase().includes(searchLower) ?? false) ||
      (rental.customer_name?.toLowerCase().includes(searchLower) ?? false) ||
      (rental.customer_email?.toLowerCase().includes(searchLower) ?? false) ||
      (rental.customer_phone?.toLowerCase().includes(searchLower) ?? false)
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
    if (confirm('Mark this rental as completed?')) {
      try {
        const result = await updateRentalStatus(id, 'completed');
        if (result.success) {
          router.refresh();
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error('Error marking rental as complete:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  // Handle mark as cancelled
  const handleMarkCancelled = async (id: number | undefined) => {
    if (!id) return;
    if (confirm('Mark this rental as cancelled?')) {
      try {
        const result = await updateRentalStatus(id, 'cancelled');
        if (result.success) {
          router.refresh();
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error('Error marking rental as cancelled:', error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  // Handle edit record
  const handleEdit = (id: number | undefined) => {
    if (!id) return;
    router.push(`/dashboard/rentals/edit/${id}`);
  };

  // Handle delete record
  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this rental record? This action cannot be undone.')) {
      try {
        const result = await deleteRental(id);
        if (result.success) {
          router.refresh();
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        console.error('Error deleting rental record:', error);
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
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
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
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Rentals</label>
          <input
            type="text"
            id="search"
            placeholder="Search by vehicle, customer name, email..."
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
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="flex items-end gap-2">
          <button
            onClick={() => router.push('/dashboard/rentals/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
          >
            Add Rental
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRentals.length > 0 ? (
              filteredRentals.map((rental) => (
                <React.Fragment key={rental.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rental.vehicle_info}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rental.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(rental.status)}`}>
                        {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(Number(rental.total_cost))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        {rental.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleMarkComplete(rental.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleMarkCancelled(rental.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEdit(rental.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rental.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleDetails(rental.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {showDetails === rental.id ? 'Hide' : 'Details'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showDetails === rental.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Customer Information</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              <strong>Name:</strong> {rental.customer_name}<br />
                              <strong>Email:</strong> {rental.customer_email || 'Not provided'}<br />
                              <strong>Phone:</strong> {rental.customer_phone || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Rental Details</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              <strong>Daily Rate:</strong> {formatCurrency(Number(rental.daily_rate))}<br />
                              <strong>Total Cost:</strong> {formatCurrency(Number(rental.total_cost))}<br />
                              <strong>Created:</strong> {formatDate(rental.created_at || null)}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-medium text-gray-900">Notes</h4>
                            <p className="text-sm text-gray-500 mt-1">{rental.notes || 'No notes available'}</p>
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
                    ? 'No rental records match your filters'
                    : 'No rental records available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
