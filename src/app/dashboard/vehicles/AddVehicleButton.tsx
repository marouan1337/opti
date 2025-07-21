"use client";

import { useState } from 'react';
import AddVehicleModal from '@/components/AddVehicleModal';
import { addVehicle } from './actions';

export default function AddVehicleButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleAddVehicle = async (vehicleData: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
  }) => {
    // Create a FormData object to match the server action's expected input
    const formData = new FormData();
    formData.append('make', vehicleData.make);
    formData.append('model', vehicleData.model);
    formData.append('year', vehicleData.year.toString());
    formData.append('licensePlate', vehicleData.license_plate);
    
    // Call the server action
    await addVehicle(formData);
  };

  return (
    <>
      <button
        onClick={openModal}
        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add New Vehicle
      </button>
      
      <AddVehicleModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleAddVehicle}
      />
    </>
  );
}
