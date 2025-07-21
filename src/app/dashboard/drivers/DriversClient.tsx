"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDriver, updateDriverStatus } from './actions';
import EditDriverModal from '../../../components/EditDriverModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  license_expiry: string;
  contact_number: string;
  email: string;
  status: string;
}

interface DriversClientProps {
  drivers: Driver[];
}

export default function DriversClient({ drivers }: DriversClientProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleEditClick = (driver: Driver) => {
    setCurrentDriver(driver);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setCurrentDriver(null);
  };

  const handleDeleteClick = async (id: number) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      try {
        await deleteDriver(id);
      } catch (error) {
        console.error('Error deleting driver:', error);
        alert('Failed to delete driver. Please try again.');
      }
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateDriverStatus(id, newStatus);
    } catch (error) {
      console.error('Error updating driver status:', error);
      alert('Failed to update driver status. Please try again.');
    }
  };

  // Filter drivers based on search term and status filter
  const filteredDrivers = drivers.filter(driver => {
    if (statusFilter !== 'all' && driver.status !== statusFilter) {
      return false;
    }
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      driver.first_name.toLowerCase().includes(searchLower) ||
      driver.last_name.toLowerCase().includes(searchLower) ||
      driver.license_number.toLowerCase().includes(searchLower) ||
      driver.email.toLowerCase().includes(searchLower) ||
      driver.contact_number.toLowerCase().includes(searchLower)
    );
  });

  // Generate and download PDF
  const downloadDriversPDF = () => {
    if (filteredDrivers.length === 0) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Drivers Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Create the table
    autoTable(doc, {
      head: [['Name', 'License Number', 'License Expiry', 'Contact', 'Email', 'Status']],
      body: filteredDrivers.map(driver => [
        `${driver.first_name} ${driver.last_name}`,
        driver.license_number,
        new Date(driver.license_expiry).toLocaleDateString(),
        driver.contact_number,
        driver.email,
        driver.status
      ]),
      startY: 35,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    // Save the PDF
    doc.save('drivers-report.pdf');
  };

  return (
    <>
      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Drivers</label>
          <input
            type="text"
            id="search"
            placeholder="Search by name, license, email, phone..."
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
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        
        <div className="flex items-end gap-2">
          <button
            onClick={() => router.push('/dashboard/drivers/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
          >
            Add Driver
          </button>
          <button
            onClick={downloadDriversPDF}
            disabled={filteredDrivers.length === 0}
            className={`${filteredDrivers.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white font-medium py-2 px-4 rounded-md shadow-sm`}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License Expiry
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrivers.map((driver) => (
              <tr key={driver.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {driver.first_name} {driver.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.license_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(driver.license_expiry).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.contact_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    value={driver.status}
                    onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full border-0 font-semibold ${
                      driver.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : driver.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleEditClick(driver)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(driver.id)}
                    className="text-red-600 hover:text-red-900 mr-4"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => {
                      const doc = new jsPDF();
                      doc.setFontSize(18);
                      doc.text(`Driver: ${driver.first_name} ${driver.last_name}`, 14, 22);
                      doc.setFontSize(11);
                      
                      const driverData = [
                        ['Name', `${driver.first_name} ${driver.last_name}`],
                        ['License Number', driver.license_number],
                        ['License Expiry', new Date(driver.license_expiry).toLocaleDateString()],
                        ['Contact', driver.contact_number],
                        ['Email', driver.email],
                        ['Status', driver.status]
                      ];
                      
                      autoTable(doc, {
                        body: driverData,
                        startY: 30,
                        theme: 'plain',
                        styles: { fontSize: 10, cellPadding: 4 },
                        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
                      });
                      
                      doc.save(`driver-${driver.id}.pdf`);
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentDriver && (
        <EditDriverModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          driver={currentDriver}
        />
      )}
    </>
  );
}
