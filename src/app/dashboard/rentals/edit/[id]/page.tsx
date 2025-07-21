import React from 'react';
import Link from 'next/link';
import { getVehicles } from '@/app/dashboard/vehicles/actions';
import { getCustomers } from '@/app/dashboard/customers/actions';
import { getRentalById } from '@/app/dashboard/rentals/actions';
import EditRentalForm from '../../../../../components/EditRentalForm';
import { notFound } from 'next/navigation';

// Define the Vehicle interface to match the component props
interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
}

// Define the Customer interface
interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export default async function EditRentalPage({ params }: { params: { id: string } }) {
  const rentalId = parseInt(params.id);
  
  // Get the rental data
  const rental = await getRentalById(rentalId);
  
  // Get all vehicles and customers for the dropdowns
  const vehicles = await getVehicles() as Vehicle[];
  const customers = await getCustomers() as Customer[];
  
  // If the rental doesn't exist, show a 404 page
  if (!rental) {
    notFound();
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Edit Rental</h1>
        <Link 
          href="/dashboard/rentals" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Rentals
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <EditRentalForm 
          vehicles={vehicles} 
          customers={customers} 
          rental={rental} 
        />
      </div>
    </div>
  );
}
