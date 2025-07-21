import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportData } from '@/app/dashboard/reports/types';
import { MaintenanceRecord } from '@/types/maintenance';

// Define Vehicle interface here to avoid import issues
interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  user_id: string;
  active_rentals?: number;
  active_rental_id?: number;
  rented_to?: string;
  return_date?: string;
}

// No need for custom type declarations as we're using the autoTable import directly

/**
 * Generate a PDF from report data
 */
export function generateReportPDF(reportName: string, reportData: ReportData): jsPDF {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add the report title
  doc.setFontSize(18);
  doc.text(reportName, 14, 22);
  
  // Add the date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add the report data as a table
  autoTable(doc, {
    head: [reportData.headers],
    body: reportData.rows,
    startY: 40,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });
  
  // Add page numbers
  // Using any to bypass TypeScript limitations with jsPDF internal methods
  const internal = (doc as any).internal;
  const pageCount = internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      internal.pageSize.getWidth() - 30,
      internal.pageSize.getHeight() - 10
    );
  }
  
  // Add footer with company name
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('OptiCore Car Manager', 14, (doc as any).internal.pageSize.getHeight() - 10);
  
  return doc;
}

/**
 * Download a PDF file
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

/**
 * Generate a PDF from maintenance records
 */
export function generateMaintenancePDF(maintenanceRecords: MaintenanceRecord[], title: string = 'Maintenance Records'): jsPDF {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add the title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add the date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Format the data for the PDF
  const formattedData = maintenanceRecords.map(record => [
    record.vehicle_info || 'N/A',
    record.service_type,
    record.description || 'N/A',
    record.date_performed ? new Date(record.date_performed).toLocaleDateString() : 'Not performed',
    new Date(record.next_due_date).toLocaleDateString(),
    typeof record.cost === 'number' ? 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.cost) : 
      'N/A',
    record.status.charAt(0).toUpperCase() + record.status.slice(1),
    record.service_provider || 'N/A'
  ]);
  
  // Define the columns for the PDF
  const headers = [
    'Vehicle', 
    'Service Type', 
    'Description', 
    'Date Performed', 
    'Next Due Date', 
    'Cost', 
    'Status', 
    'Service Provider'
  ];
  
  // Add the maintenance data as a table
  autoTable(doc, {
    head: [headers],
    body: formattedData,
    startY: 40,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      overflow: 'ellipsize',
      cellWidth: 'wrap'
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Vehicle
      1: { cellWidth: 'auto' }, // Service Type
      2: { cellWidth: 30 },     // Description
      3: { cellWidth: 'auto' }, // Date Performed
      4: { cellWidth: 'auto' }, // Next Due Date
      5: { cellWidth: 'auto' }, // Cost
      6: { cellWidth: 'auto' }, // Status
      7: { cellWidth: 'auto' }  // Service Provider
    }
  });
  
  // Add page numbers
  // Using any to bypass TypeScript limitations with jsPDF internal methods
  const internal = (doc as any).internal;
  const pageCount = internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      internal.pageSize.getWidth() - 30,
      internal.pageSize.getHeight() - 10
    );
  }
  
  // Add footer with company name
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('OptiCore Car Manager', 14, (doc as any).internal.pageSize.getHeight() - 10);
  
  return doc;
}

/**
 * Download maintenance records as PDF
 */
export function downloadMaintenancePDF(maintenanceRecords: MaintenanceRecord[], title: string = 'Maintenance Records'): void {
  const doc = generateMaintenancePDF(maintenanceRecords, title);
  downloadPDF(doc, title.replace(/\s+/g, '_').toLowerCase() + '.pdf');
}

/**
 * Generate a PDF from vehicle data
 */
export function generateVehiclePDF(vehicles: Vehicle[], title: string = 'Vehicle Fleet'): jsPDF {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add the title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add the date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Prepare the data for the table
  const tableRows = vehicles.map(vehicle => [
    vehicle.make,
    vehicle.model,
    vehicle.year.toString(),
    vehicle.license_plate,
    Number(vehicle.active_rentals) > 0 ? 'Rented' : 'Available',
    vehicle.rented_to || 'N/A',
    vehicle.return_date ? new Date(vehicle.return_date).toLocaleDateString() : 'N/A'
  ]);
  
  // Add the table
  autoTable(doc, {
    head: [['Make', 'Model', 'Year', 'License Plate', 'Status', 'Rented To', 'Return Date']],
    body: tableRows,
    startY: 40,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
  });
  
  // Add page numbers
  const internal = (doc as any).internal;
  const pageCount = internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
  }
  
  return doc;
}

/**
 * Download vehicle data as PDF
 */
export function downloadVehiclePDF(vehicles: Vehicle[], title: string = 'Vehicle Fleet'): void {
  const doc = generateVehiclePDF(vehicles, title);
  downloadPDF(doc, title.replace(/\s+/g, '_').toLowerCase() + '.pdf');
}
