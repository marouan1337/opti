import React from 'react';
import Link from 'next/link';
import { getRentals } from './actions';
import RentalsClient from '../../../components/RentalsClient';

export default async function RentalsPage() {
  const rentals = await getRentals();
  
  // Check if we have valid rentals data
  if (!rentals || rentals.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Rental Management</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Rentals Available</h3>
          <p className="text-sm text-yellow-700">
            {!rentals ? "Please sign in to view your rentals" : "You don't have any rentals yet"}
          </p>
          <div className="mt-4">
            <Link 
              href="/dashboard/rentals/add"
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Your First Rental
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Count rentals by status
  const activeRentals = rentals.filter(r => r.status === 'active').length;
  const completedRentals = rentals.filter(r => r.status === 'completed').length;
  const cancelledRentals = rentals.filter(r => r.status === 'cancelled').length;
  
  // Calculate total revenue from completed rentals
  const totalRevenue = rentals
    .filter(r => r.status === 'completed')
    .reduce((sum, rental) => sum + Number(rental.total_cost), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Rental Management</h1>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        <Link 
          href="/dashboard/rentals/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Rental
        </Link>
      </div>

      {/* Rental Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Active Rentals Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Active</h3>
          <p className="text-3xl font-bold text-blue-600">{activeRentals}</p>
          <p className="text-sm text-blue-600 mt-2">Current rentals</p>
        </div>
        
        {/* Completed Rentals Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-green-600">{completedRentals}</p>
          <p className="text-sm text-green-600 mt-2">Finished rentals</p>
        </div>
        
        {/* Cancelled Rentals Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Cancelled</h3>
          <p className="text-3xl font-bold text-red-600">{cancelledRentals}</p>
          <p className="text-sm text-red-600 mt-2">Cancelled rentals</p>
        </div>
        
        {/* Total Revenue Card */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-purple-600">
            ${totalRevenue.toFixed(2)}
          </p>
          <p className="text-sm text-purple-600 mt-2">From completed rentals</p>
        </div>
      </div>

      {/* Rental Records Table */}
      <div id="rentals-table" className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rental Records</h2>
        
        {/* Use the client component for interactive features */}
        <RentalsClient rentals={rentals} />
      </div>
    </div>
  );
}
