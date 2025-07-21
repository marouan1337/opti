'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteVehicle } from '@/app/dashboard/vehicles/actions';
import { downloadVehiclePDF } from '@/lib/pdfUtils';
import { Vehicle } from '@/types/vehicle';

interface VehiclesClientProps {
  vehicles: Vehicle[];
}

export default function VehiclesClient({ vehicles }: VehiclesClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [localVehicles, setLocalVehicles] = useState<Vehicle[]>(vehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Filter vehicles based on search term and status filter
  const filteredVehicles = localVehicles.filter(vehicle => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'rented' && Number(vehicle.active_rentals) <= 0) {
        return false;
      }
      if (statusFilter === 'available' && Number(vehicle.active_rentals) > 0) {
        return false;
      }
    }
    
    // Skip search filtering if search term is empty
    if (!searchTerm) return true;
    
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.year.toString().includes(searchLower) ||
      vehicle.license_plate.toLowerCase().includes(searchLower) ||
      (vehicle.rented_to?.toLowerCase().includes(searchLower) ?? false)
    );
  });
  
  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      setIsDeleting(true);
      try {
        const result = await deleteVehicle(id);
        if (result.success) {
          setDeleteMessage('Vehicle deleted successfully');
          // Remove the vehicle from the local state
          setLocalVehicles(localVehicles.filter(vehicle => vehicle.id !== id));
        } else {
          setDeleteMessage(result.message || 'Failed to delete vehicle');
        }
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        setDeleteMessage('An error occurred while deleting the vehicle');
      } finally {
        setIsDeleting(false);
        // Clear message after 3 seconds
        setTimeout(() => setDeleteMessage(''), 3000);
      }
    }
  };

  return (
    <div>
      {deleteMessage && (
        <div className={`p-4 mb-4 rounded-md ${deleteMessage.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {deleteMessage}
        </div>
      )}
      
      {/* Search and filter controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Vehicles</label>
          <input
            type="text"
            id="search"
            placeholder="Search by make, model, year, license plate..."
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
            <option value="all">All Vehicles</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
          </select>
        </div>
        
        <div className="flex items-end gap-2">
          <button
            onClick={() => downloadVehiclePDF(filteredVehicles, 'Vehicle Fleet Report')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
            disabled={filteredVehicles.length === 0}
          >
            Export PDF
          </button>
          <button
            onClick={() => router.push('/dashboard/vehicles/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
          >
            Add New Vehicle
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Make
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License Plate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account ID
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No vehicles found
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vehicle.make}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.license_plate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {Number(vehicle.active_rentals) > 0 ? (
                      <div>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Rented
                        </span>
                        <div className="mt-1 text-xs text-gray-500">
                          <div>To: {vehicle.rented_to}</div>
                          <div>Return: {formatDate(vehicle.return_date)}</div>
                          <a 
                            href={`/dashboard/rentals/edit/${vehicle.active_rental_id}`}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            View Rental
                          </a>
                        </div>
                      </div>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vehicle.user_id ? vehicle.user_id.substring(0, 8) + '...' : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a 
                      href={`/dashboard/vehicles/details/${vehicle.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer"
                    >
                      View Details
                    </a>
                    <a 
                      href={`/dashboard/vehicles/edit/${vehicle.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4 cursor-pointer"
                    >
                      Edit
                    </a>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      disabled={isDeleting || Number(vehicle.active_rentals) > 0}
                      className={`mr-4 ${Number(vehicle.active_rentals) > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900 cursor-pointer'} disabled:opacity-50`}
                      title={Number(vehicle.active_rentals) > 0 ? 'Cannot delete a rented vehicle' : 'Delete vehicle'}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <a 
                      href={`/dashboard/vehicles/pdf/${vehicle.id}`}
                      className="text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
