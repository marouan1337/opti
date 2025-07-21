import React from 'react';
import Link from 'next/link';
import { getCustomerById, getCustomerRentals } from '../actions';
import CustomerDetailClient from '@/components/CustomerDetailClient';

interface CustomerDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const customerId = parseInt(params.id);
  const customer = await getCustomerById(customerId);
  const rentals = await getCustomerRentals(customerId);
  
  if (!customer) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Customer Not Found</h1>
          <Link 
            href="/dashboard/customers" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back to Customers
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-700">The customer you are looking for does not exist or has been deleted.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
        <div className="flex space-x-4">
          <Link 
            href={`/dashboard/customers/edit/${customer.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Customer
          </Link>
          <Link 
            href="/dashboard/customers" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back to Customers
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <CustomerDetailClient customer={customer} rentals={rentals} />
      </div>
    </div>
  );
}
