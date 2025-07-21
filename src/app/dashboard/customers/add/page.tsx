import React from 'react';
import Link from 'next/link';
import AddCustomerForm from '../../../../components/AddCustomerForm';

export default function AddCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
        <Link 
          href="/dashboard/customers" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Customers
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <AddCustomerForm />
      </div>
    </div>
  );
}
