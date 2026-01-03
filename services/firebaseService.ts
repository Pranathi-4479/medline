import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, 
  query, where, onSnapshot, runTransaction, orderBy
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut, updatePassword as firebaseUpdatePassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential
} from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { User, Donation, MedicineRequest, SystemAlert, UserRole, DonationStatus, RequestStatus } from "../types";

// Helper to convert File to Base64 string for storage
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// --- AUTH SERVICE ---
export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Fetch user details from Firestore
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      if (userData.is_active === false) {
        await signOut(auth);
        throw new Error('Account pending Admin approval. Please check back later.');
      }
      return userData;
    } else {
      throw new Error('User profile not found.');
    }
  },

  signup: async (
    name: string, 
    email: string, 
    phone: string, 
    password: string, 
    role: UserRole, 
    address: string, 
    location?: { lat: number, lng: number },
    govtIdFile?: File | null,
    ngoLicense?: string,
    vehicleNumber?: string
  ): Promise<User> => {
    
    // Convert ID File to Base64 string if present
    // Firestore requires null for empty values, not undefined
    let idImageUrl: string | null = null;
    if (govtIdFile) {
        try {
            idImageUrl = await fileToBase64(govtIdFile);
        } catch (e) {
            console.error("Error processing ID file", e);
        }
    }

    const locationData = location ? { location } : {};

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const isActive = false; // Default to inactive pending approval

    const newUser: User = { 
      uid, 
      name, 
      email,
      phone, 
      role, 
      wallet_balance: 0,
      address,
      is_active: isActive,
      has_pending_milestone_reward: false,
      govt_id_url: idImageUrl || undefined, // undefined works here if we want to omit, but for explicitly setting fields use null if required logic dictates
      // However, to fix the specific error, we ensure we don't pass explicit undefined in a way that breaks.
      // Ideally, if it's undefined, it shouldn't be in the object if using ignoreUndefinedProperties: false (default).
      // But let's use null to be safe if we want the field to exist.
      // Actually, let's keep it clean: spread only if defined, or use null.
      // Using null for Firestore is safer for "no value".
      ...(idImageUrl ? { govt_id_url: idImageUrl } : { govt_id_url: null }),
      ngo_license_number: ngoLicense,
      vehicle_number: vehicleNumber,
      ...locationData
    };

    // Store user profile in Firestore
    // Note: If fields are undefined, Firestore JS SDK might throw. 
    // We sanitize or use null.
    // Let's ensure undefined optional fields are handled.
    const sanitizedUser = JSON.parse(JSON.stringify(newUser)); // Quick hack to strip undefined, though nulls remain.
    // Actually, let's just rely on nulls where we initialized them.

    // A better approach for specific fields known to cause issues:
    const finalUserPayload = {
        ...newUser,
        govt_id_url: idImageUrl, // idImageUrl is string | null
        ngo_license_number: ngoLicense || null,
        vehicle_number: vehicleNumber || null
    };

    await setDoc(doc(db, "users", uid), finalUserPayload);
    return newUser;
  },

  logout: async () => {
    await signOut(auth);
  },

  updateUser: async (uid: string, data: Partial<User>): Promise<User> => {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, data);
    const updated = await getDoc(userRef);
    return updated.data() as User;
  },
  
  updatePassword: async (newPassword: string, oldPassword?: string): Promise<void> => {
    if (auth.currentUser) {
      if (oldPassword && auth.currentUser.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      await firebaseUpdatePassword(auth.currentUser, newPassword);
    } else {
      throw new Error("No user logged in");
    }
  },

  verifyIdentity: async (email: string, phoneLast4: string): Promise<boolean> => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return false;
    
    const user = snapshot.docs[0].data() as User;
    if (!user.phone) return false;
    
    return user.phone.slice(-4) === phoneLast4;
  },

  sendPasswordReset: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  getAllUsers: async (): Promise<User[]> => {
    const q = query(collection(db, "users"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as User);
  },

  toggleUserStatus: async (uid: string, isActive: boolean): Promise<void> => {
    await updateDoc(doc(db, "users", uid), { is_active: isActive });
  },

  seedDatabase: async (): Promise<string> => {
    // Seeding logic kept simple for brevity
    return "Seeding skipped for this update.";
  }
};

// --- DATABASE SERVICE ---
export const dbService = {
  getDonations: async (): Promise<Donation[]> => {
    const q = query(collection(db, "donations"), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
  },
  
  // UPDATED: Now accepts an optional imageFile
  addDonation: async (donation: Omit<Donation, 'id' | 'created_at'>, imageFile?: File): Promise<void> => {
    
    // Initialize as null (allowed in Firestore) instead of undefined (prohibited)
    let imageUrl: string | null = null;
    if (imageFile) {
        try {
            imageUrl = await fileToBase64(imageFile);
        } catch (e) {
            console.error("Error processing medicine image", e);
        }
    }

    await addDoc(collection(db, "donations"), {
      ...donation,
      medicine_image_url: imageUrl,
      created_at: Date.now(),
      status: 'pending_admin_approval',
      notes: donation.notes || null // Ensure notes isn't undefined
    });
  },
  
  adminProcessDonation: async (id: string, destinationId: string, destinationName: string, type: 'ngo' | 'admin_stock' | 'bio-lab'): Promise<void> => {
    await updateDoc(doc(db, "donations", id), {
      status: 'pending',
      route: type,
      destination_id: destinationId,
      destination_name: destinationName
    });
  },

  assignDonation: async (id: string, agentId: string, agentName: string): Promise<void> => {
    const agentDoc = await getDoc(doc(db, "users", agentId));
    let vehicle = "Unknown";
    if (agentDoc.exists()) {
       vehicle = (agentDoc.data() as User).vehicle_number || "Unknown";
    }

    await updateDoc(doc(db, "donations", id), {
      status: 'assigned',
      delivery_agent_id: agentId,
      tracking: {
        current_lat: 40.7306,
        current_lng: -73.9352,
        eta_mins: 10,
        last_updated: Date.now(),
        driver_name: agentName,
        vehicle_number: vehicle
      }
    });
  },

  updateDonationStatus: async (id: string, status: DonationStatus): Promise<void> => {
    await updateDoc(doc(db, "donations", id), { status });
  },

  processVerification: async (id: string, donorId: string, status: 'verified' | 'rejected', baseReward: number): Promise<void> => {
    await runTransaction(db, async (transaction) => {
      const donationRef = doc(db, "donations", id);
      const userRef = doc(db, "users", donorId);
      
      const donationSnap = await transaction.get(donationRef);
      const userSnap = await transaction.get(userRef);

      if (!donationSnap.exists() || !userSnap.exists()) {
        throw new Error("Document does not exist!");
      }

      const donationData = donationSnap.data() as Donation;
      const userData = userSnap.data() as User;

      let finalReward = baseReward;
      if (donationData.is_emergency && status === 'verified') {
        finalReward = baseReward * 2;
      }

      transaction.update(donationRef, { status });

      const newBalance = userData.wallet_balance + finalReward;
      const updates: any = { wallet_balance: newBalance };

      if (finalReward > 0) {
        const oldMilestone = Math.floor(userData.wallet_balance / 1000);
        const newMilestone = Math.floor(newBalance / 1000);
        if (newMilestone > oldMilestone) {
          updates.has_pending_milestone_reward = true;
        }
      }

      transaction.update(userRef, updates);
    });
  },
  
  verifyPickupCode: async (id: string, code: string, driverName: string): Promise<boolean> => {
    const donationRef = doc(db, "donations", id);
    const donationSnap = await getDoc(donationRef);
    
    if (donationSnap.exists()) {
      const data = donationSnap.data() as Donation;
      if (data.pickup_code === code) {
        await updateDoc(donationRef, {
          status: 'picked_up',
          tracking: {
            current_lat: 40.7128,
            current_lng: -74.0060,
            eta_mins: 25,
            last_updated: Date.now(),
            driver_name: driverName,
            vehicle_number: data.tracking?.vehicle_number || 'Unknown'
          }
        });
        return true;
      }
    }
    return false;
  },

  getDonationById: async (id: string): Promise<Donation | undefined> => {
    const snap = await getDoc(doc(db, "donations", id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Donation) : undefined;
  },

  getRequests: async (): Promise<MedicineRequest[]> => {
    const q = query(collection(db, "requests"), orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicineRequest));
  },
  
  addRequest: async (request: Omit<MedicineRequest, 'id' | 'created_at' | 'status'>): Promise<void> => {
    if (request.requester_type === 'donor') {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", request.donor_id);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        
        const userData = userSnap.data() as User;
        if (userData.wallet_balance < request.cost) throw new Error("Insufficient funds");

        transaction.update(userRef, { wallet_balance: userData.wallet_balance - request.cost });
        
        const newRequestRef = doc(collection(db, "requests"));
        transaction.set(newRequestRef, {
          ...request,
          donor_name: userData.name,
          created_at: Date.now(),
          status: 'pending'
        });
      });
    } else {
      await addDoc(collection(db, "requests"), {
         ...request,
         donor_name: '',
         created_at: Date.now(),
         status: 'pending'
      });
    }
  },

  assignRequest: async (requestId: string, ngoId: string, ngoName: string): Promise<void> => {
    await updateDoc(doc(db, "requests", requestId), {
      status: 'assigned',
      assigned_ngo_id: ngoId,
      assigned_ngo_name: ngoName
    });
  },

  fulfillRequest: async (requestId: string): Promise<void> => {
    await updateDoc(doc(db, "requests", requestId), { status: 'fulfilled' });
  },

  updateRequestStatus: async (requestId: string, status: RequestStatus): Promise<void> => {
    await runTransaction(db, async (transaction) => {
       const reqRef = doc(db, "requests", requestId);
       const reqSnap = await transaction.get(reqRef);
       if (!reqSnap.exists()) return;

       const reqData = reqSnap.data() as MedicineRequest;

       if (status === 'rejected' && reqData.requester_type === 'donor' && reqData.cost > 0) {
         const userRef = doc(db, "users", reqData.donor_id);
         const userSnap = await transaction.get(userRef);
         if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            transaction.update(userRef, { wallet_balance: userData.wallet_balance + reqData.cost });
         }
       }
       transaction.update(reqRef, { status });
    });
  },

  updateWallet: async (uid: string, amount: number): Promise<void> => {
     await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", uid);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
           const userData = userSnap.data() as User;
           const newBalance = userData.wallet_balance + amount;
           const updates: any = { wallet_balance: newBalance };
           if (amount > 0) {
              if (Math.floor(newBalance / 1000) > Math.floor(userData.wallet_balance / 1000)) {
                 updates.has_pending_milestone_reward = true;
              }
           }
           transaction.update(userRef, updates);
        }
     });
  },
  
  resolveMilestoneReward: async (uid: string, choice: 'kit' | 'coins'): Promise<void> => {
    await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", uid);
        const userSnap = await transaction.get(userRef);
        if (userSnap.exists()) {
           const userData = userSnap.data() as User;
           const updates: any = { has_pending_milestone_reward: false };
           if (choice === 'coins') {
              updates.wallet_balance = userData.wallet_balance + 20;
           }
           transaction.update(userRef, updates);
        }
    });
  },

  getUser: async (uid: string): Promise<User | undefined> => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? (snap.data() as User) : undefined;
  },

  getAlert: async (): Promise<SystemAlert> => {
    const snap = await getDoc(doc(db, "system", "alert"));
    if (snap.exists()) return { id: 'alert', ...snap.data() } as SystemAlert;
    return { id: 'config', is_active: false, message: '' };
  },

  toggleAlert: async (isActive: boolean, message: string = '', medicines: string = ''): Promise<void> => {
    await setDoc(doc(db, "system", "alert"), {
      is_active: isActive,
      message,
      required_medicines: medicines
    });
  }
};