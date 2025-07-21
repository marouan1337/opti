export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Calculated fields for display
  rental_count?: number;
}
