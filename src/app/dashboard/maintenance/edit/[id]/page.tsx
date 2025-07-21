import React from 'react';
import { notFound } from 'next/navigation';
import EditMaintenanceForm from '@/components/EditMaintenanceForm';
import { getMaintenanceRecordById } from '../../actions';
import { getVehicles } from '@/app/dashboard/vehicles/actions';

export default async function EditMaintenancePage({ params }: { params: { id: string } }) {
  // Get the maintenance record by ID
  const id = parseInt(params.id);
  const maintenanceRecord = await getMaintenanceRecordById(id);
  
  // Get all vehicles for the dropdown
  const vehicles = await getVehicles();
  
  // If the maintenance record doesn't exist, show 404
  if (!maintenanceRecord) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Edit Maintenance Record</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <EditMaintenanceForm maintenanceRecord={maintenanceRecord} vehicles={vehicles} />
      </div>
    </div>
  );
}
