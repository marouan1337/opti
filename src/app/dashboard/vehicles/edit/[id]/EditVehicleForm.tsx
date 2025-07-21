'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { editVehicle } from '@/app/dashboard/vehicles/actions';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
}

interface EditVehicleFormProps {
  vehicle: Vehicle;
}

export default function EditVehicleForm({ vehicle }: EditVehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('id', vehicle.id.toString());
      
      const result = await editVehicle(formData);
      
      if (result.success) {
        setSuccess(result.message || 'Vehicle updated successfully');
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard/vehicles');
          router.refresh();
        }, 1500);
      } else {
        setError(result.message || 'Failed to update vehicle');
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="make" className="block text-sm font-medium text-gray-700">Make</label>
        <input
          type="text"
          name="make"
          id="make"
          defaultValue={vehicle.make}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>
      
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model</label>
        <input
          type="text"
          name="model"
          id="model"
          defaultValue={vehicle.model}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>
      
      <div>
        <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
        <input
          type="number"
          name="year"
          id="year"
          defaultValue={vehicle.year}
          required
          min="1900"
          max="2100"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>
      
      <div>
        <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700">License Plate</label>
        <input
          type="text"
          name="licensePlate"
          id="licensePlate"
          defaultValue={vehicle.license_plate}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black"
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/vehicles')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Update Vehicle'}
        </button>
      </div>
    </form>
  );
}
