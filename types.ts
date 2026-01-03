

export type UserRole = 'donor' | 'ngo' | 'delivery' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  wallet_balance: number;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  is_active?: boolean;
  has_pending_milestone_reward?: boolean;
  govt_id_url?: string; // Stores Base64 string of the ID image
  ngo_license_number?: string; 
  vehicle_number?: string; 
}

export type DonationStatus = 'pending_admin_approval' | 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'verified' | 'rejected' | 'lab_received';
export type DonationRoute = 'ngo' | 'bio-lab' | 'admin_stock';
export type MedicineCondition = 'Sealed' | 'Opened';

export interface TrackingInfo {
  current_lat: number;
  current_lng: number;
  eta_mins: number;
  last_updated: number;
  driver_name?: string;
  vehicle_number?: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  donor_name: string;
  medicine_name: string;
  medicine_image_url?: string; // New: Stores Base64 string of the medicine
  expiry_date: string;
  condition: MedicineCondition;
  notes?: string;
  route: DonationRoute;
  status: DonationStatus;
  potential_reward: number;
  is_emergency?: boolean;
  pickup_code: string;
  created_at: number;
  tracking?: TrackingInfo;
  delivery_agent_id?: string;
  destination_id?: string;
  destination_name?: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'assigned' | 'fulfilled';

export interface MedicineRequest {
  id: string;
  donor_id: string;
  donor_name?: string;
  requester_type: 'donor' | 'ngo'; 
  medicine_name: string;
  quantity: number;
  reason: string;
  cost: number;
  status: RequestStatus;
  created_at: number;
  assigned_ngo_id?: string;
  assigned_ngo_name?: string;
}

export interface SystemAlert {
  id: string;
  is_active: boolean;
  message: string;
  required_medicines?: string;
}