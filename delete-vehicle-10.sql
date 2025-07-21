-- SQL script to delete vehicle ID 10 and its maintenance records
-- First delete all maintenance records associated with this vehicle
DELETE FROM maintenance_records WHERE vehicle_id = 10;

-- Then delete the vehicle itself
DELETE FROM vehicles WHERE id = 10;
