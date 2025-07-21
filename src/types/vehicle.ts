export interface Vehicle {
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
