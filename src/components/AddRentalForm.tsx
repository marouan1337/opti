"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addRental } from '@/app/dashboard/rentals/actions';
import Link from 'next/link';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
}

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface AddRentalFormProps {
  vehicles: Vehicle[];
  customers: Customer[];
}

export default function AddRentalForm({ vehicles, customers }: AddRentalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dailyRate, setDailyRate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [totalCost, setTotalCost] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [manualEntry, setManualEntry] = useState<boolean>(false);

  // Calculate total cost when daily rate or dates change
  useEffect(() => {
    if (dailyRate && startDate && endDate) {
      const rate = parseFloat(dailyRate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (!isNaN(rate) && start && end && end >= start) {
        const durationMs = end.getTime() - start.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
        setTotalCost(rate * durationDays);
      } else {
        setTotalCost(null);
      }
    } else {
      setTotalCost(null);
    }
  }, [dailyRate, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await addRental(formData);

      if (result.success) {
        router.push('/dashboard/rentals');
        router.refresh();
      } else {
        setFormError(result.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error adding rental:', error);
      setFormError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Set today as the default start date
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setStartDate(formattedDate);
    
    // Set default end date as 7 days from today
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    setEndDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vehicle Selection */}
        <div>
          <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
            Vehicle *
          </label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          >
            <option value="">Select a vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.license_plate}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Selection */}
        <div>
          <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700">
            Customer *
          </label>
          <div className="flex space-x-2">
            <select
              id="customer_id"
              name="customer_id"
              value={selectedCustomerId}
              onChange={(e) => {
                const customerId = e.target.value;
                setSelectedCustomerId(customerId);
                setManualEntry(customerId === 'new');
                
                if (customerId && customerId !== 'new') {
                  const customer = customers.find(c => c.id === parseInt(customerId));
                  if (customer) {
                    setCustomerName(customer.name);
                    setCustomerEmail(customer.email || '');
                    setCustomerPhone(customer.phone || '');
                  }
                } else if (customerId === 'new') {
                  setCustomerName('');
                  setCustomerEmail('');
                  setCustomerPhone('');
                }
              }}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
              disabled={manualEntry}
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                </option>
              ))}
              <option value="new">+ Add New Customer</option>
            </select>
            <Link 
              href="/dashboard/customers/add"
              className="mt-1 px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Add a new customer in the customer management section"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Customer Name */}
        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
            Customer Name *
          </label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            readOnly={!manualEntry && selectedCustomerId !== ''}
          />
        </div>

        {/* Customer Email */}
        <div>
          <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700">
            Customer Email
          </label>
          <input
            type="email"
            id="customer_email"
            name="customer_email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            readOnly={!manualEntry && selectedCustomerId !== ''}
          />
        </div>

        {/* Customer Phone */}
        <div>
          <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700">
            Customer Phone
          </label>
          <input
            type="tel"
            id="customer_phone"
            name="customer_phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            readOnly={!manualEntry && selectedCustomerId !== ''}
          />
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date *
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={startDate} // Prevent end date before start date
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          />
        </div>

        {/* Daily Rate */}
        <div>
          <label htmlFor="daily_rate" className="block text-sm font-medium text-gray-700">
            Daily Rate (USD) *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="daily_rate"
              name="daily_rate"
              min="0"
              step="0.01"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              required
              className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
          </div>
        </div>

        {/* Total Cost (Calculated) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Cost (Calculated)
          </label>
          <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700">
            {totalCost !== null ? formatCurrency(totalCost) : 'Please fill in dates and daily rate'}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Adding...' : 'Add Rental'}
        </button>
      </div>
    </form>
  );
}
