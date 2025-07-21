"use client";

import { useState } from 'react';

// Define report data structure
interface ReportData {
  headers: string[];
  rows: any[][];
}

interface ReportDetailClientProps {
  reportId: string;
  reportData: ReportData;
}

export default function ReportDetailClient({ reportId, reportData }: ReportDetailClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterValue, setFilterValue] = useState('');
  
  // Apply filtering
  const filteredRows = reportData.rows.filter(row => {
    if (!filterValue) return true;
    return row.some(cell => 
      cell.toString().toLowerCase().includes(filterValue.toLowerCase())
    );
  });
  
  // Apply sorting
  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortColumn === null) return 0;
    
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];
    
    // Handle different data types
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Default string comparison
    const strA = valueA.toString().toLowerCase();
    const strB = valueB.toString().toLowerCase();
    
    if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
    if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  // Apply pagination
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = sortedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // Handle sorting
  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };
  
  // Handle export to CSV
  const exportToCsv = () => {
    const headers = reportData.headers.join(',');
    const rows = reportData.rows.map(row => row.join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle export to PDF (in a real app, this would use a PDF library)
  const exportToPdf = () => {
    alert('PDF export functionality would be implemented here with a library like jsPDF');
  };
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div>
      {/* Report controls */}
      <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Filter data..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filterValue && (
            <button
              onClick={() => setFilterValue('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={exportToCsv}
            className="px-3 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Export CSV
          </button>
          <button
            onClick={exportToPdf}
            className="px-3 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Export PDF
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Print
          </button>
        </div>
      </div>
      
      {/* Report data table */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {reportData.headers.map((header, index) => (
                <th 
                  key={index}
                  onClick={() => handleSort(index)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    {header}
                    {sortColumn === index && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={reportData.headers.length} 
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Rows per page:
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to first page when changing rows per page
              }}
              className="border border-gray-300 rounded-md text-sm p-1"
            >
              {[5, 10, 25, 50].map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lsaquo;
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
