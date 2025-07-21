"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCustomer } from '@/app/dashboard/customers/actions';
import { deleteCustomerRentals } from '@/app/dashboard/rentals/actions';
import { Customer } from '@/types/customer';

interface CustomersClientProps {
  customers: Customer[];
}

export default function CustomersClient({ customers }: CustomersClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState<number | null>(null);

  // Filter records based on search term
  const filteredCustomers = customers.filter(customer => {
    // Skip search filtering if search term is empty
    if (!searchTerm) return true;
    
    // Search filter with null checks
    const searchLower = searchTerm.toLowerCase();
    return (
      (customer.name?.toLowerCase().includes(searchLower) ?? false) ||
      (customer.email?.toLowerCase().includes(searchLower) ?? false) ||
      (customer.phone?.toLowerCase().includes(searchLower) ?? false) ||
      (customer.address?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  // Handle edit customer
  const handleEdit = (id: number | undefined) => {
    if (!id) return;
    router.push(`/dashboard/customers/edit/${id}`);
  };

  // Handle view customer details
  const handleViewDetails = (id: number | undefined) => {
    if (!id) return;
    router.push(`/dashboard/customers/${id}`);
  };

  // Handle delete customer
  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        // Call the server action to delete the customer
        const result = await deleteCustomer(id);
        
        if (result.success) {
          // Success case - refresh the UI
          alert('Customer deleted successfully.');
          router.refresh();
        } else {
          // Handle specific error cases
          if (result.message && result.message.includes('rental records')) {
            // Rental conflict case
            if (confirm(`${result.message}\n\nWould you like to delete all rentals for this customer first?`)) {
              handleDeleteWithRentals(id);
            }
          } else if (result.message && result.message.includes('Authentication required')) {
            // Authentication error case
            alert('Your session has expired. Please stay on this page while we refresh your session.');
            
            // Refresh the page but stay on the current route
            // This will trigger a new auth check without redirecting to login
            router.refresh();
          } else {
            // Generic error case
            alert(`Error: ${result.message}`);
          }
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('An error occurred while trying to delete the customer. Please try again.');
        // Don't refresh automatically on error to prevent potential login redirects
      }
    }
  };
  
  // Handle deleting all rentals for a customer before deleting the customer
  const handleDeleteWithRentals = async (id: number | undefined) => {
    if (!id) return;
    
    try {
      // Find the customer name
      const customer = customers.find(c => c.id === id);
      if (!customer || !customer.name) {
        alert('Could not find customer information.');
        return;
      }
      
      // First delete all rentals for this customer
      const rentalResult = await deleteCustomerRentals(customer.name);
      
      if (rentalResult.success) {
        // Now try to delete the customer
        const customerResult = await deleteCustomer(id);
        
        if (customerResult.success) {
          alert('Customer and all associated rentals deleted successfully.');
          router.refresh();
        } else {
          alert(`Rentals were deleted but could not delete customer: ${customerResult.message}`);
          router.refresh();
        }
      } else {
        alert(`Error deleting rentals: ${rentalResult.message}`);
      }
    } catch (error) {
      console.error('Error in delete with rentals flow:', error);
      alert('An error occurred. The page will refresh to maintain consistency.');
      router.refresh();
    }
  };

  // Toggle details view
  const toggleDetails = (id: number | undefined) => {
    if (!id) return;
    setShowDetails(showDetails === id ? null : id);
  };

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      {/* Filters and Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Customers</label>
          <input
            type="text"
            id="search"
            placeholder="Search by name, email, phone, address..."
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-end gap-2">
          <button
            onClick={() => router.push('/dashboard/customers/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-sm"
          >
            Add Customer
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rentals
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <React.Fragment key={customer.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.email && (
                        <div className="flex items-center">
                          <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center mt-1">
                          <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {customer.rental_count || 0} rentals
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleViewDetails(customer.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(customer.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => toggleDetails(customer.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {showDetails === customer.id ? 'Hide' : 'Details'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showDetails === customer.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Address</h4>
                            <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">
                              {customer.address || 'No address provided'}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Notes</h4>
                            <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">
                              {customer.notes || 'No notes available'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  {searchTerm
                    ? 'No customers match your search'
                    : 'No customers available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
