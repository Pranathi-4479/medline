
import { User, Donation, SystemAlert, UserRole, DonationStatus, MedicineRequest, RequestStatus } from '../types';

// Internal type for storage including password
interface StoredUser extends User {
  password?: string;
  is_active?: boolean;
}

// Initial Data Seeding
const SEED_USERS: StoredUser[] = [
  { uid: 'u1', name: 'John Doe', email: 'donor@test.com', phone: '1234567890', password: 'password123', role: 'donor', wallet_balance: 450, address: '123 Donor St, NY', location: { lat: 40.7128, lng: -74.0060 }, is_active: true, has_pending_milestone_reward: false },
  { uid: 'u2', name: 'Health NGO', email: 'ngo@test.com', phone: '0987654321', password: 'password123', role: 'ngo', wallet_balance: 0, address: '456 Charity Ave, NY', location: { lat: 40.7589, lng: -73.9851 }, is_active: true },
  { uid: 'u5', name: 'Care Foundation', email: 'care@test.com', phone: '0987654322', password: 'password123', role: 'ngo', wallet_balance: 0, address: '789 Hope St, Brooklyn', location: { lat: 40.6782, lng: -73.9442 }, is_active: true },
  { uid: 'u3', name: 'Fast Delivery', email: 'driver@test.com', phone: '1122334455', password: 'password123', role: 'delivery', wallet_balance: 0, address: '789 Logistics Blvd, NY', location: { lat: 40.7306, lng: -73.9352 }, is_active: true },
  { uid: 'u4', name: 'Super Admin', email: 'admin@test.com', phone: '5544332211', password: 'password123', role: 'admin', wallet_balance: 0, is_active: true },
];

const SEED_DONATIONS: Donation[] = [
  { 
    id: 'd1', donor_id: 'u1', donor_name: 'John Doe', medicine_name: 'Paracetamol 500mg', expiry_date: '2025-12-01', condition: 'Sealed', route: 'ngo', status: 'verified', potential_reward: 50, pickup_code: '1234', created_at: Date.now() - 86400000, delivery_agent_id: 'u3', destination_id: 'u2', destination_name: 'Health NGO', is_emergency: false
  },
  { 
    id: 'd2', donor_id: 'u1', donor_name: 'John Doe', medicine_name: 'Cough Syrup', expiry_date: '2023-01-01', condition: 'Opened', route: 'bio-lab', status: 'picked_up', potential_reward: 2, pickup_code: '5678', created_at: Date.now() - 100000,
    tracking: { current_lat: 40.7128, current_lng: -74.0060, eta_mins: 15, last_updated: Date.now(), driver_name: 'Fast Delivery' },
    delivery_agent_id: 'u3', destination_id: 'bio-lab', destination_name: 'City Bio-Lab', is_emergency: false
  },
];

const SEED_REQUESTS: MedicineRequest[] = [
  { id: 'r1', donor_id: 'u1', donor_name: 'John Doe', requester_type: 'donor', medicine_name: 'First Aid Kit', quantity: 1, reason: 'Personal use', cost: 100, status: 'approved', created_at: Date.now() - 172800000 }
];

const SEED_ALERT: SystemAlert = { id: 'config', is_active: false, message: 'CRITICAL ALERT: Flood affecting Zone A. Urgent antibiotics needed.', required_medicines: 'Antibiotics, Bandages' };

// LocalStorage Helpers
const getStorage = <T>(key: string, seed: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(stored);
};

const setStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- AUTH SERVICE ---
export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getStorage<StoredUser[]>('medilink_users', SEED_USERS);
        const user = users.find(u => u.email === email);
        
        if (user) {
          if (user.is_active === false) {
             reject(new Error('Account pending approval from Admin.'));
             return;
          }
          if (user.password === password) {
            const { password: _, ...safeUser } = user;
            resolve(safeUser as User);
          } else {
            reject(new Error('Invalid password'));
          }
        } else {
          reject(new Error('User not found'));
        }
      }, 500);
    });
  },
  signup: async (name: string, email: string, phone: string, password: string, role: UserRole, address: string, location?: { lat: number, lng: number }): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStorage<StoredUser[]>('medilink_users', SEED_USERS);
        
        // Auto-activate donors, but require admin approval for NGO/Delivery
        const isActive = role === 'donor';

        const newUser: StoredUser = { 
          uid: Math.random().toString(36).substr(2, 9), 
          name, 
          email,
          phone, 
          password, 
          role, 
          wallet_balance: 0,
          address,
          location,
          is_active: isActive,
          has_pending_milestone_reward: false
        };
        users.push(newUser);
        setStorage('medilink_users', users);
        
        const { password: _, ...safeUser } = newUser;
        resolve(safeUser as User);
      }, 500);
    });
  },
  updateUser: async (uid: string, data: Partial<User>): Promise<User> => {
    const users = getStorage<StoredUser[]>('medilink_users', SEED_USERS);
    const index = users.findIndex(u => u.uid === uid);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      setStorage('medilink_users', users);
      const { password: _, ...safeUser } = users[index];
      return safeUser as User;
    }
    throw new Error('User not found');
  },
  getAllUsers: async (): Promise<User[]> => {
    const users = getStorage<StoredUser[]>('medilink_users', SEED_USERS);
    return users.map(({ password, ...user }) => user as User);
  },
  toggleUserStatus: async (uid: string, isActive: boolean): Promise<void> => {
    const users = getStorage<StoredUser[]>('medilink_users', SEED_USERS);
    const index = users.findIndex(u => u.uid === uid);
    if (index !== -1) {
      users[index].is_active = isActive;
      setStorage('medilink_users', users);
    }
  }
};

// --- DATABASE SERVICE ---
export const dbService = {
  // Donations
  getDonations: async (): Promise<Donation[]> => {
    return getStorage<Donation[]>('medilink_donations', SEED_DONATIONS);
  },
  
  // NOTE: Default status is now 'pending_admin_approval'
  addDonation: async (donation: Omit<Donation, 'id' | 'created_at'>): Promise<void> => {
    const donations = await dbService.getDonations();
    const newDonation: Donation = { 
        ...donation, 
        id: Math.random().toString(36).substr(2, 9), 
        created_at: Date.now(),
        // Override status to ensure Admin workflow
        status: 'pending_admin_approval' 
    };
    donations.unshift(newDonation); // Add to top
    setStorage('medilink_donations', donations);
  },
  
  // Admin routes the donation
  adminProcessDonation: async (id: string, destinationId: string, destinationName: string, type: 'ngo' | 'admin_stock' | 'bio-lab'): Promise<void> => {
    const donations = await dbService.getDonations();
    const index = donations.findIndex(d => d.id === id);
    if (index !== -1) {
        donations[index].status = 'pending'; // Now ready for delivery agent
        donations[index].route = type;
        donations[index].destination_id = destinationId;
        donations[index].destination_name = destinationName;
        setStorage('medilink_donations', donations);
    }
  },

  // Assign task to a specific delivery agent
  assignDonation: async (id: string, agentId: string, agentName: string): Promise<void> => {
    const donations = await dbService.getDonations();
    const index = donations.findIndex(d => d.id === id);
    if (index !== -1) {
      donations[index].status = 'assigned';
      donations[index].delivery_agent_id = agentId;
      
      // Initialize Phase 1 Tracking
      donations[index].tracking = {
        current_lat: 40.7306,
        current_lng: -73.9352,
        eta_mins: 10,
        last_updated: Date.now(),
        driver_name: agentName
      };
      
      setStorage('medilink_donations', donations);
    }
  },

  updateDonationStatus: async (id: string, status: DonationStatus): Promise<void> => {
    const donations = await dbService.getDonations();
    const index = donations.findIndex(d => d.id === id);
    if (index !== -1) {
      donations[index].status = status;
      
      // If delivering, update ETA to 0
      if (status === 'delivered' && donations[index].tracking) {
        donations[index].tracking!.eta_mins = 0;
      }
      setStorage('medilink_donations', donations);
    }
  },

  // NGO Verifies or Rejects - Handles Coins Logic
  processVerification: async (id: string, donorId: string, status: 'verified' | 'rejected', baseReward: number): Promise<void> => {
      const donations = await dbService.getDonations();
      const index = donations.findIndex(d => d.id === id);
      
      if (index !== -1) {
          donations[index].status = status;
          
          let finalReward = baseReward;
          // Emergency Logic: 2x Coins if donation was made during emergency
          if (donations[index].is_emergency && status === 'verified') {
              finalReward = baseReward * 2;
              console.log("Emergency Multiplier Applied! 2x Coins.");
          }

          setStorage('medilink_donations', donations);
          
          // Add coins to wallet
          await dbService.updateWallet(donorId, finalReward);
      }
  },
  
  // Verify Pickup Code
  verifyPickupCode: async (id: string, code: string, driverName: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const donations = getStorage<Donation[]>('medilink_donations', SEED_DONATIONS);
        const index = donations.findIndex(d => d.id === id);
        
        if (index !== -1) {
          if (donations[index].pickup_code === code) {
            // Code Matches: Update status and initialize Phase 2 Tracking (Donor -> NGO)
            donations[index].status = 'picked_up';
            donations[index].tracking = {
              current_lat: 40.7128, // Reset to Donor Location for start of leg 2
              current_lng: -74.0060,
              eta_mins: 25,
              last_updated: Date.now(), // Reset timestamp for animation
              driver_name: driverName
            };
            setStorage('medilink_donations', donations);
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          reject(new Error('Donation not found'));
        }
      }, 800);
    });
  },

  getDonationById: async (id: string): Promise<Donation | undefined> => {
    const donations = await dbService.getDonations();
    return donations.find(d => d.id === id);
  },

  // Requests
  getRequests: async (): Promise<MedicineRequest[]> => {
    return getStorage<MedicineRequest[]>('medilink_requests', SEED_REQUESTS);
  },
  
  addRequest: async (request: Omit<MedicineRequest, 'id' | 'created_at' | 'status'>): Promise<void> => {
    let donorName = '';
    // Logic for deducting coins ONLY if requester is a donor
    if (request.requester_type === 'donor') {
        const users = getStorage<StoredUser[]>('medilink_users', SEED_USERS);
        const userIndex = users.findIndex(u => u.uid === request.donor_id);
        
        if (userIndex === -1) throw new Error('User not found');
        if (users[userIndex].wallet_balance < request.cost) throw new Error('Insufficient funds');

        users[userIndex].wallet_balance -= request.cost;
        donorName = users[userIndex].name;
        setStorage('medilink_users', users);
    }

    const requests = await dbService.getRequests();
    const newRequest: MedicineRequest = {
      ...request,
      donor_name: donorName,
      id: Math.random().toString(36).substr(2, 9),
      created_at: Date.now(),
      status: 'pending'
    };
    requests.unshift(newRequest);
    setStorage('medilink_requests', requests);
  },

  // Admin assigns request to NGO
  assignRequest: async (requestId: string, ngoId: string, ngoName: string): Promise<void> => {
    const requests = await dbService.getRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      requests[index].status = 'assigned';
      requests[index].assigned_ngo_id = ngoId;
      requests[index].assigned_ngo_name = ngoName;
      setStorage('medilink_requests', requests);
    }
  },

  // NGO Fulfills the request
  fulfillRequest: async (requestId: string): Promise<void> => {
    const requests = await dbService.getRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index !== -1) {
      requests[index].status = 'fulfilled';
      setStorage('medilink_requests', requests);
    }
  },

  // Reject Request (Refund Coins)
  updateRequestStatus: async (requestId: string, status: RequestStatus): Promise<void> => {
    const requests = await dbService.getRequests();
    const index = requests.findIndex(r => r.id === requestId);
    
    if (index !== -1) {
      const request = requests[index];
      
      // If rejecting, refund the coins to donor
      if (status === 'rejected' && request.requester_type === 'donor' && request.cost > 0) {
        await dbService.updateWallet(request.donor_id, request.cost);
      }

      requests[index].status = status;
      setStorage('medilink_requests', requests);
    }
  },

  // Users / Wallet & Milestone Logic
  updateWallet: async (uid: string, amount: number): Promise<void> => {
    const users = getStorage<StoredUser[]>('medilink_users', SEED_USERS);
    const index = users.findIndex(u => u.uid === uid);
    
    if (index !== -1) {
      const oldBalance = users[index].wallet_balance;
      const newBalance = oldBalance + amount;
      
      // Check for 1000 coin milestone crossing (e.g. 950 -> 1050, or 1900 -> 2100)
      // We only care about adding milestones when balance increases
      if (amount > 0) {
         const oldMilestone = Math.floor(oldBalance / 1000);
         const newMilestone = Math.floor(newBalance / 1000);
         
         if (newMilestone > oldMilestone) {
            users[index].has_pending_milestone_reward = true;
         }
      }

      users[index].wallet_balance = newBalance;
      setStorage('medilink_users', users);
    }
  },
  
  // Handle Milestone Reward Choice
  resolveMilestoneReward: async (uid: string, choice: 'kit' | 'coins'): Promise<void> => {
    const users = getStorage<StoredUser[]>('medilink_users', SEED_USERS);
    const index = users.findIndex(u => u.uid === uid);
    
    if (index !== -1) {
       users[index].has_pending_milestone_reward = false;
       
       if (choice === 'coins') {
          users[index].wallet_balance += 20;
       } else {
          // 'kit': In a real app, create a shipping order. Here, we assume it's sent.
          console.log("First Aid Kit dispatched to user " + uid);
       }
       setStorage('medilink_users', users);
    }
  },

  getUser: async (uid: string): Promise<User | undefined> => {
    const users = getStorage<User[]>('medilink_users', SEED_USERS);
    return users.find(u => u.uid === uid);
  },

  // System Alerts
  getAlert: async (): Promise<SystemAlert> => {
    return getStorage<SystemAlert>('medilink_alert', SEED_ALERT);
  },
  toggleAlert: async (isActive: boolean, message: string = '', medicines: string = ''): Promise<void> => {
    const alert = await dbService.getAlert();
    alert.is_active = isActive;
    if (isActive) {
        alert.message = message;
        alert.required_medicines = medicines;
    }
    setStorage('medilink_alert', alert);
  }
};
