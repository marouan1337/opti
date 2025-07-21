"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Customer } from '@/types/customer';
import { Rental } from '@/types/rental';

interface CustomerDetailClientProps {
  customer: Customer;
  rentals: Rental[];
}

export default function CustomerDetailClient({ customer, rentals }: CustomerDetailClientProps) {
  const router = useRouter();

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate total revenue from this customer
  const totalRevenue = rentals
    .filter(r => r.status === 'completed')
    .reduce((sum, rental) => sum + Number(rental.total_cost), 0);

  return (
    <div className="space-y-8">
      {/* Customer Information Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Customer Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{customer.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1 text-sm text-gray-900">{customer.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{customer.address || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{customer.notes || 'No notes available'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer Since</p>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(customer.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Rentals</h3>
          <p className="text-3xl font-bold text-blue-600">{rentals.length}</p>
          <p className="text-sm text-blue-600 mt-2">All time rentals</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Active Rentals</h3>
          <p className="text-3xl font-bold text-green-600">
            {rentals.filter(r => r.status === 'active').length}
          </p>
          <p className="text-sm text-green-600 mt-2">Currently active</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-sm text-purple-600 mt-2">From completed rentals</p>
        </div>
      </div>

      {/* Rental History */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Rental History</h2>
        </div>
        <div className="p-6">
          {rentals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
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
                  {rentals.map((rental) => (
                    <tr key={rental.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rental.vehicle_info}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(rental.start_date)} - {formatDate(rental.end_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${rental.status === 'active' ? 'bg-blue-100 text-blue-800' : 
                            rental.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(Number(rental.total_cost))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/dashboard/rentals/edit/${rental.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No rental history available for this customer.</p>
              <button
                onClick={() => router.push('/dashboard/rentals/add')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create New Rental
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
