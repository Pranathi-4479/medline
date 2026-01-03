import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Donation, SystemAlert, MedicineRequest } from '../types';
import { db } from '../firebaseConfig';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

interface GlobalContextType {
  donations: Donation[];
  requests: MedicineRequest[];
  alert: SystemAlert;
  refreshData: () => Promise<void>; // Kept for compatibility, though snapshots handle auto-refresh
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [alert, setAlert] = useState<SystemAlert>({ id: 'config', is_active: false, message: '' });

  useEffect(() => {
    // 1. Listen to Donations
    const qDonations = query(collection(db, "donations"), orderBy("created_at", "desc"));
    const unsubDonations = onSnapshot(qDonations, (snapshot) => {
      const d = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
      setDonations(d);
    });

    // 2. Listen to Requests
    const qRequests = query(collection(db, "requests"), orderBy("created_at", "desc"));
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const r = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicineRequest));
      setRequests(r);
    });

    // 3. Listen to System Alert
    const unsubAlert = onSnapshot(doc(db, "system", "alert"), (doc) => {
      if (doc.exists()) {
        setAlert({ id: 'alert', ...doc.data() } as SystemAlert);
      } else {
        setAlert({ id: 'config', is_active: false, message: '' });
      }
    });

    return () => {
      unsubDonations();
      unsubRequests();
      unsubAlert();
    };
  }, []);

  const refreshData = async () => {
    // No-op: Realtime listeners handle this
  };

  return (
    <GlobalContext.Provider value={{ donations, requests, alert, refreshData }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error('useGlobal must be used within a GlobalProvider');
  return context;
};