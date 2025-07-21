export interface Rental {
  id?: number;
  vehicle_id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  start_date: string;
  end_date: string;
  daily_rate: number;
  total_cost: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  // Join data for display
  vehicle_info?: string;
}
