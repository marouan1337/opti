import React from 'react';
import { notFound } from 'next/navigation';
import EditVehicleForm from './EditVehicleForm';
import { getVehicleById } from '@/app/dashboard/vehicles/actions';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
}

interface EditVehiclePageProps {
  params: {
    id: string;
  };
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const vehicleId = parseInt(params.id);
  
  if (isNaN(vehicleId)) {
    return notFound();
  }
  
  // Get the vehicle data
  const vehicle = await getVehicleById(vehicleId) as Vehicle;
  
  if (!vehicle) {
    return notFound();
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <EditVehicleForm vehicle={vehicle} />
      </div>
    </div>
  );
}
