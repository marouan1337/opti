import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReportDetailClient from '../../../../components/ReportDetailClient';
import { getReportById, generateReport } from '../actions';
import { ReportMetadata, ReportData, ReportResult } from '../types';

// Use type definitions from types.ts

// Server component to fetch report metadata and data
async function getReportDetails(reportId: string): Promise<{ metadata: ReportMetadata, data: ReportData } | null> {
  // Get report metadata
  const reportMetadata = await getReportById(reportId);
  
  if (!reportMetadata) {
    return null;
  }
  
  // Generate the report
  const reportResult = await generateReport(reportId) as ReportResult;
  
  if (!reportResult.success) {
    // With proper typing, we can access the error property directly
    console.error('Error generating report:', reportResult.error);
    return null;
  }
  
  // Ensure we have report data
  if (!reportResult.data) {
    console.error('Report generated successfully but no data was returned');
    return null;
  }
  
  return { 
    metadata: reportMetadata, 
    data: reportResult.data 
  };
}

export default async function ReportDetailPage({ params }: { params: { reportId: string } }) {
  const reportDetails = await getReportDetails(params.reportId);
  
  if (!reportDetails) {
    notFound();
  }
  
  const { metadata, data } = reportDetails;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{metadata.name}</h1>
        <Link 
          href="/dashboard/reports" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Back to Reports
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <p className="text-gray-600">{metadata.description}</p>
          {metadata.last_generated && (
            <p className="mt-2 text-sm text-gray-500">
              Last generated: {new Date(metadata.last_generated).toLocaleString()}
            </p>
          )}
        </div>
        
        {/* Client component for interactive features */}
        <ReportDetailClient reportId={metadata.id} reportData={data} />
      </div>
    </div>
  );
}
