// Define the Maintenance Record interface for use across the application
export interface MaintenanceRecord {
  id?: number;
  vehicle_id: number;
  vehicle_info?: string; // Stores make, model, license plate for display
  service_type: string;
  description: string;
  date_performed: string | null;
  next_due_date: string;
  cost: number;
  status: 'scheduled' | 'completed' | 'overdue';
  service_provider: string;
  notes: string;
}

// Define the form data interface for adding/editing maintenance records
export interface MaintenanceFormData {
  vehicle_id: number;
  service_type: string;
  description: string;
  date_performed: string;
  next_due_date: string;
  cost: string;
  status: 'scheduled' | 'completed' | 'overdue';
  service_provider: string;
  notes: string;
}

// Define the action result interface
export interface ActionResult {
  success: boolean;
  message?: string;
  error?: unknown;
  data?: any;
}
