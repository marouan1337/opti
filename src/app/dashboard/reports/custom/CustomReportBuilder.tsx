"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Column {
  column_name: string;
  data_type: string;
}

interface Table {
  name: string;
  displayName: string;
  columns: Column[];
}

interface Schema {
  tables: {
    [key: string]: Table;
  };
}

interface CustomReportBuilderProps {
  schema: Schema;
}

export default function CustomReportBuilder({ schema }: CustomReportBuilderProps) {
  const router = useRouter();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ column: string; operator: string; value: string }[]>([]);
  const [reportName, setReportName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Available tables from schema
  const tables = Object.values(schema.tables);
  
  // Get columns for the selected table
  const columns = selectedTable ? schema.tables[selectedTable]?.columns || [] : [];
  
  // Available operators for filters
  const operators = [
    { value: '=', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: 'LIKE', label: 'Contains' },
    { value: 'IS NULL', label: 'Is Empty' },
    { value: 'IS NOT NULL', label: 'Is Not Empty' }
  ];
  
  // Handle table selection
  const handleTableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tableName = e.target.value;
    setSelectedTable(tableName);
    setSelectedColumns([]);
    setFilters([]);
  };
  
  // Handle column selection/deselection
  const handleColumnToggle = (columnName: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnName)) {
        return prev.filter(col => col !== columnName);
      } else {
        return [...prev, columnName];
      }
    });
  };
  
  // Add a new filter
  const addFilter = () => {
    if (columns.length > 0) {
      setFilters(prev => [
        ...prev,
        { column: columns[0].column_name, operator: '=', value: '' }
      ]);
    }
  };
  
  // Remove a filter
  const removeFilter = (index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  };
  
  // Update a filter
  const updateFilter = (index: number, field: 'column' | 'operator' | 'value', value: string) => {
    setFilters(prev => {
      const newFilters = [...prev];
      newFilters[index] = { ...newFilters[index], [field]: value };
      return newFilters;
    });
  };
  
  // Generate the custom report
  const handleGenerateReport = async () => {
    if (!selectedTable || selectedColumns.length === 0 || !reportName) {
      alert('Please select a table, at least one column, and provide a report name.');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // In a real implementation, this would call a server action to generate the report
      // For now, we'll simulate a delay and redirect to the reports page
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to reports page
      router.push('/dashboard/reports');
    } catch (error) {
      console.error('Error generating custom report:', error);
      alert('An error occurred while generating the report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Report Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Report Name
        </label>
        <input
          type="text"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a name for your report"
          required
        />
      </div>
      
      {/* Table Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Table
        </label>
        <select
          value={selectedTable}
          onChange={handleTableChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select a table --</option>
          {tables.map(table => (
            <option key={table.name} value={table.name}>
              {table.displayName}
            </option>
          ))}
        </select>
      </div>
      
      {/* Column Selection */}
      {selectedTable && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Columns
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {columns.map(column => (
              <div key={column.column_name} className="flex items-center">
                <input
                  type="checkbox"
                  id={`column-${column.column_name}`}
                  checked={selectedColumns.includes(column.column_name)}
                  onChange={() => handleColumnToggle(column.column_name)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`column-${column.column_name}`}
                  className="ml-2 block text-sm text-gray-900"
                >
                  {column.column_name} ({column.data_type})
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Filters */}
      {selectedTable && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Filters
            </label>
            <button
              type="button"
              onClick={addFilter}
              className="px-2 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Filter
            </button>
          </div>
          
          {filters.length === 0 ? (
            <p className="text-sm text-gray-500">No filters added. Click "Add Filter" to add one.</p>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={filter.column}
                    onChange={(e) => updateFilter(index, 'column', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {columns.map(column => (
                      <option key={column.column_name} value={column.column_name}>
                        {column.column_name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  
                  {!['IS NULL', 'IS NOT NULL'].includes(filter.operator) && (
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, 'value', e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Value"
                    />
                  )}
                  
                  <button
                    type="button"
                    onClick={() => removeFilter(index)}
                    className="px-2 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Generate Report Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={isGenerating || !selectedTable || selectedColumns.length === 0 || !reportName}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
}
