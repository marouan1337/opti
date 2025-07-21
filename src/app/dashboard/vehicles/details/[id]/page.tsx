import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getVehicleById } from '@/app/dashboard/vehicles/actions';
import { getMaintenanceRecordsByVehicleId } from '@/app/dashboard/maintenance/actions';
import { formatCurrency, formatDate } from '@/lib/formatters';
import VehicleMaintenanceHistory from '@/components/VehicleMaintenanceHistory';

interface VehicleDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function VehicleDetailsPage({ params }: VehicleDetailsPageProps) {
  const vehicleId = parseInt(params.id);
  
  if (isNaN(vehicleId)) {
    return notFound();
  }
  
  // Get the vehicle data
  const vehicle = await getVehicleById(vehicleId);
  
  if (!vehicle) {
    return notFound();
  }

  // Get maintenance records for this vehicle
  const maintenanceRecords = await getMaintenanceRecordsByVehicleId(vehicleId);
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vehicle Details</h1>
        <div className="flex space-x-3">
          <Link 
            href={`/dashboard/vehicles/edit/${vehicle.id}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Edit Vehicle
          </Link>
          <Link 
            href="/dashboard/vehicles"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Back to Vehicles
          </Link>
        </div>
      </div>
      
      {/* Vehicle Details Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Make</p>
                <p className="text-base font-medium text-gray-900">{vehicle.make}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Model</p>
                <p className="text-base font-medium text-gray-900">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Year</p>
                <p className="text-base font-medium text-gray-900">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">License Plate</p>
                <p className="text-base font-medium text-gray-900">{vehicle.license_plate}</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">VIN</p>
                <p className="text-base font-medium text-gray-900">{vehicle.vin || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Color</p>
                <p className="text-base font-medium text-gray-900">{vehicle.color || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mileage</p>
                <p className="text-base font-medium text-gray-900">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Date</p>
                <p className="text-base font-medium text-gray-900">
                  {vehicle.registration_date ? formatDate(vehicle.registration_date) : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Maintenance History Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Maintenance History</h2>
          <Link 
            href={`/dashboard/maintenance/add?vehicleId=${vehicle.id}`}
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Add Maintenance Record
          </Link>
        </div>
        
        <VehicleMaintenanceHistory maintenanceRecords={maintenanceRecords} />
      </div>
    </div>
  );
}
