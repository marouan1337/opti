"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Define interfaces for report data
interface ReportMetadata {
  id: string;
  name: string;
  description: string;
  category: 'vehicle' | 'driver' | 'maintenance' | 'usage';
  lastGenerated?: string;
}

interface ReportsClientProps {
  reports: ReportMetadata[];
}

export default function ReportsClient({ reports }: ReportsClientProps) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Filter reports based on active category and search term
  const filteredReports = reports.filter(report => {
    const matchesCategory = activeCategory === 'all' || report.category === activeCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Handle generating a report
  const handleGenerateReport = (reportId: string) => {
    // In a real implementation, this would call a server action to generate the report
    alert(`Generating report: ${reportId}`);
    // Navigate to the report details page
    router.push(`/dashboard/reports/${reportId}`);
  };
  
  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Reports' },
    { id: 'vehicle', name: 'Vehicle Reports' },
    { id: 'driver', name: 'Driver Reports' },
    { id: 'maintenance', name: 'Maintenance Reports' },
    { id: 'usage', name: 'Usage Reports' }
  ];
  
  return (
    <div>
      {/* Filter and search controls */}
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                activeCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {/* Reports grid */}
      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(report.category)}`}>
                  {getCategoryLabel(report.category)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{report.description}</p>
              
              {report.lastGenerated && (
                <p className="mt-4 text-xs text-gray-500">
                  Last generated: {new Date(report.lastGenerated).toLocaleString()}
                </p>
              )}
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Generate Report
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No reports found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

// Helper functions for category styling
function getCategoryColor(category: string): string {
  switch (category) {
    case 'vehicle':
      return 'bg-blue-100 text-blue-800';
    case 'driver':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    case 'usage':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'vehicle':
      return 'Vehicle';
    case 'driver':
      return 'Driver';
    case 'maintenance':
      return 'Maintenance';
    case 'usage':
      return 'Usage';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
