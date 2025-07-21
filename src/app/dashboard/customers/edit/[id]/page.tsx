import React from 'react';
import Link from 'next/link';
import { getCustomerById } from '../../actions';
import EditCustomerForm from '@/components/EditCustomerForm';

interface EditCustomerPageProps {
  params: {
    id: string;
  };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const customerId = parseInt(params.id);
  const customer = await getCustomerById(customerId);
  
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
          <p className="text-gray-700">The customer you are trying to edit does not exist or has been deleted.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
        <Link 
          href="/dashboard/customers" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Customers
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <EditCustomerForm customer={customer} />
      </div>
    </div>
  );
}
