"use client";

import { useState } from 'react';
import AddDriverModal from '@/components/AddDriverModal';
import { addDriver } from './actions';

export default function AddDriverClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleAddDriver = async (driverData: {
    first_name: string;
    last_name: string;
    license_number: string;
    license_expiry: string;
    contact_number: string;
    email: string;
    status: string;
  }) => {
    // Create a FormData object to match the server action's expected input
    const formData = new FormData();
    formData.append('firstName', driverData.first_name);
    formData.append('lastName', driverData.last_name);
    formData.append('licenseNumber', driverData.license_number);
    formData.append('licenseExpiry', driverData.license_expiry);
    formData.append('contactNumber', driverData.contact_number);
    formData.append('email', driverData.email);
    formData.append('status', driverData.status);
    
    // Call the server action
    await addDriver(formData);
  };

  return (
    <>
      <button
        onClick={openModal}
        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Add New Driver
      </button>
      
      <AddDriverModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleAddDriver}
      />
    </>
  );
}
