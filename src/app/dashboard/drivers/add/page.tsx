import React from 'react';
import Link from 'next/link';
import AddDriverClient from '../AddDriverClient';

export default function AddDriverPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Add New Driver</h1>
        <Link 
          href="/dashboard/drivers" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Drivers
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="mb-6 text-gray-600">Fill out the form below to add a new driver to the system.</p>
        <AddDriverClient />
      </div>
    </div>
  );
}
