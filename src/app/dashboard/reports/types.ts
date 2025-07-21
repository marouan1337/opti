// Report metadata interface
export interface ReportMetadata {
  id: string;
  name: string;
  description: string;
  category: 'vehicle' | 'driver' | 'maintenance' | 'usage';
  last_generated?: string;
}

// Report counts interface
export interface ReportCounts {
  vehicles: number;
  drivers: number;
  customers: number;
  activeRentals: number;
  completedRentals: number;
  rentalRevenue: number;
}

// Report data interface
export interface ReportData {
  headers: string[];
  rows: any[][];
}

// Report result interface
export interface ReportSuccessResult {
  success: true;
  data: ReportData;
}

export interface ReportErrorResult {
  success: false;
  error: unknown;
}

export type ReportResult = ReportSuccessResult | ReportErrorResult;

// Saved report interface
export interface SavedReport {
  id: number;
  report_id: string;
  name: string;
  data: any;
  created_at: string;
}
