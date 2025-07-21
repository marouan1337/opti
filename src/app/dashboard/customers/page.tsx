import React from 'react';
import Link from 'next/link';
import { getCustomers } from './actions';
import CustomersClient from '../../../components/CustomersClient';

export default async function CustomersPage() {
  const customers = await getCustomers();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>

      {/* Action buttons */}
      <div className="flex justify-end space-x-4">
        <Link 
          href="/dashboard/customers/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Customer
        </Link>
      </div>

      {/* Customer Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Customers Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-blue-600">{customers.length}</p>
          <p className="text-sm text-blue-600 mt-2">Registered customers</p>
        </div>
        
        {/* Customers with Rentals Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Active Customers</h3>
          <p className="text-3xl font-bold text-green-600">
            {customers.filter(c => c.rental_count && c.rental_count > 0).length}
          </p>
          <p className="text-sm text-green-600 mt-2">Customers with rentals</p>
        </div>
        
        {/* New This Month Card */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">New This Month</h3>
          <p className="text-3xl font-bold text-purple-600">
            {customers.filter(c => {
              if (!c.created_at) return false;
              const createdDate = new Date(c.created_at);
              const now = new Date();
              return createdDate.getMonth() === now.getMonth() && 
                     createdDate.getFullYear() === now.getFullYear();
            }).length}
          </p>
          <p className="text-sm text-purple-600 mt-2">Added this month</p>
        </div>
      </div>

      {/* Customer Records Table */}
      <div id="customers-table" className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Records</h2>
        
        {/* Use the client component for interactive features */}
        <CustomersClient customers={customers} />
      </div>
    </div>
  );
}
