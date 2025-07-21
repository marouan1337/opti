"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateRental, completeRental } from '@/app/dashboard/rentals/actions';
import Link from 'next/link';
import { Rental } from '@/types/rental';

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

interface EditRentalFormProps {
  vehicles: Vehicle[];
  customers: Customer[];
  rental: Rental;
}

export default function EditRentalForm({ vehicles, customers, rental }: EditRentalFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dailyRate, setDailyRate] = useState<string>(rental.daily_rate.toString());
  
  // Safely format dates, handling different possible formats
  const formatDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    try {
      // If it's already a date string in YYYY-MM-DD format
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
      
      // If it's a string with time component
      if (typeof dateValue === 'string' && dateValue.includes('T')) {
        return dateValue.split('T')[0];
      }
      
      // Try to create a date object and format it
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  const [startDate, setStartDate] = useState<string>(formatDate(rental.start_date));
  const [endDate, setEndDate] = useState<string>(formatDate(rental.end_date));
  const [totalCost, setTotalCost] = useState<number>(rental.total_cost);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>(rental.customer_name);
  const [notes, setNotes] = useState<string>(rental.notes || '');
  const [customerEmail, setCustomerEmail] = useState<string>(rental.customer_email || '');
  const [customerPhone, setCustomerPhone] = useState<string>(rental.customer_phone || '');
  const [status, setStatus] = useState<string>(rental.status);
  const [manualEntry, setManualEntry] = useState<boolean>(true);

  // Find matching customer if exists
  useEffect(() => {
    const matchingCustomer = customers.find(
      c => c.name === rental.customer_name && 
           (c.email === rental.customer_email || (!c.email && !rental.customer_email)) &&
           (c.phone === rental.customer_phone || (!c.phone && !rental.customer_phone))
    );
    
    if (matchingCustomer) {
      setSelectedCustomerId(matchingCustomer.id.toString());
      setManualEntry(false);
    } else {
      setManualEntry(true);
    }
  }, [customers, rental]);

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
      }
    }
  }, [dailyRate, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (!rental.id) {
        setFormError('Rental ID is missing');
        setIsSubmitting(false);
        return;
      }
      
      const formData = new FormData(e.currentTarget);
      const result = await updateRental(rental.id, formData);

      if (result.success) {
        router.push('/dashboard/rentals');
        router.refresh();
      } else {
        setFormError(result.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error updating rental:', error);
      setFormError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  // Handle completing a rental with today's date as the actual return date
  const handleQuickComplete = async () => {
    if (!rental.id) {
      setFormError('Rental ID is missing');
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Use today's date as the actual return date
      const today = new Date();
      const formattedToday = today.toISOString().split('T')[0];
      
      const result = await completeRental(rental.id, {
        actualEndDate: formattedToday,
        notes: notes
      });
      
      if (result.success) {
        router.push('/dashboard/rentals');
        router.refresh();
      } else {
        setFormError(result.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error completing rental:', error);
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
        {/* Vehicle Selection - Readonly in edit mode */}
        <div>
          <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700">
            Vehicle
          </label>
          <input
            type="text"
            value={rental.vehicle_info}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm text-gray-500"
          />
          <input type="hidden" name="vehicle_id" value={rental.vehicle_id} />
        </div>

        {/* Customer Information - Readonly in edit mode */}
        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
            Customer
          </label>
          <input
            type="text"
            value={rental.customer_name}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm text-gray-500"
          />
          <input type="hidden" name="customer_name" value={rental.customer_name} />
        </div>

        {/* Rental Dates - Editable */}
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
            End Date *
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          />
        </div>

        {/* Pricing Information - Editable */}
        <div>
          <label htmlFor="daily_rate" className="block text-sm font-medium text-gray-700">
            Daily Rate *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              id="daily_rate"
              name="daily_rate"
              type="number"
              step="0.01"
              min="0"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 pl-7 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
            />
          </div>
        </div>

        <div>
          <label htmlFor="total_cost" className="block text-sm font-medium text-gray-700">
            Total Cost (Calculated)
          </label>
          <input
            type="text"
            value={formatCurrency(totalCost)}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm text-gray-500"
          />
        </div>

        {/* Rental Status - Editable */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Rental Status *
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Notes - Editable */}
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Link
          href="/dashboard/rentals"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Cancel
        </Link>
        
        {rental.status === 'active' && (
          <button
            type="button"
            onClick={handleQuickComplete}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300"
          >
            {isSubmitting ? 'Processing...' : 'Complete Now (Early Return)'}
          </button>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
        >
          {isSubmitting ? 'Updating...' : 'Update Rental'}
        </button>
      </div>
    </form>
  );
}
