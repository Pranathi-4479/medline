
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { dbService, authService } from '../../services/firebaseService';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { User, MedicineRequest, Donation } from '../../types';
import { 
  ShieldAlert, Users, Activity, 
  CheckCircle, XCircle, Search, AlertTriangle, 
  Package, Share2, HeartHandshake, ArrowRight, Pill,
  FileText, Siren, Eye, UserCheck, Image as ImageIcon
} from 'lucide-react';

const AdminPanel = () => {
  const { alert, donations, requests, refreshData } = useGlobal();
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'routing' | 'users' | 'inventory' | 'requests'>('dashboard');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'valid' | 'expired'>('all');
  const [userSearch, setUserSearch] = useState('');

  // Emergency Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    message: '',
    medicines: ''
  });

  // ID Verification Modal State
  const [viewProofUser, setViewProofUser] = useState<User | null>(null);

  // Request Assignment State
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [selectedNgo, setSelectedNgo] = useState('');

  // Donation Routing State
  const [routingDonation, setRoutingDonation] = useState<Donation | null>(null);
  const [routeDestination, setRouteDestination] = useState('');
  // View Medicine Image
  const [viewImageDonation, setViewImageDonation] = useState<Donation | null>(null);

  // Real-time User Listener for Notifications
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => doc.data() as User);
      setUsers(allUsers);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleClick = async () => {
    if (alert.is_active) {
        await dbService.toggleAlert(false);
        await refreshData();
    } else {
        setEmergencyForm({ message: '', medicines: '' });
        setShowEmergencyModal(true);
    }
  };

  const submitEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.toggleAlert(true, emergencyForm.message, emergencyForm.medicines);
    await refreshData();
    setShowEmergencyModal(false);
  };

  const handleUserStatusChange = async (uid: string, currentStatus: boolean | undefined) => {
    await authService.toggleUserStatus(uid, !currentStatus);
    if (viewProofUser && viewProofUser.uid === uid) {
        setViewProofUser(null); // Close modal if acting from within it
    }
  };

  // --- Routing Logic ---
  const handleRoutingSubmit = async () => {
    if (!routingDonation || !routeDestination) return;

    if (routeDestination === 'admin_stock') {
        await dbService.adminProcessDonation(routingDonation.id, 'admin', 'Central Warehouse', 'admin_stock');
    } else if (routeDestination === 'bio-lab') {
        await dbService.adminProcessDonation(routingDonation.id, 'bio-lab', 'City Bio-Lab', 'bio-lab');
    } else {
        const ngo = users.find(u => u.uid === routeDestination);
        if (ngo) {
            await dbService.adminProcessDonation(routingDonation.id, ngo.uid, ngo.name, 'ngo');
        }
    }
    await refreshData();
    setRoutingDonation(null);
    setRouteDestination('');
  };

  // --- Request Logic ---
  const handleAssignRequest = async (requestId: string) => {
    if (!selectedNgo) return;
    const ngo = users.find(u => u.uid === selectedNgo);
    if (ngo) {
      await dbService.assignRequest(requestId, ngo.uid, ngo.name);
      await refreshData();
      setSelectedRequest(null);
      setSelectedNgo('');
    }
  };

  // --- Derived Data ---
  const incomingDonations = donations.filter(d => d.status === 'pending_admin_approval');
  const ngoList = users.filter(u => u.role === 'ngo' && u.is_active);
  const pendingRequests = requests.filter(r => r.status === 'pending' && r.requester_type === 'donor');
  const pendingUsers = users.filter(u => !u.is_active && u.role !== 'admin'); // Don't count admin as pending
  
  const getInventoryData = () => {
    const today = new Date();
    return donations.filter(d => {
      if (d.status === 'pending_admin_approval') return false; 
      const expiry = new Date(d.expiry_date);
      const isExpired = expiry < today;
      if (inventoryFilter === 'valid') return !isExpired && d.condition === 'Sealed';
      if (inventoryFilter === 'expired') return isExpired || d.condition === 'Opened';
      return true;
    });
  };

  const filteredInventory = getInventoryData();
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
           <p className="text-gray-500">System-wide monitoring and administration.</p>
        </div>
        
        <div className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
          alert.is_active ? 'bg-red-50 border-red-500 shadow-red-100 shadow-lg' : 'bg-white border-gray-200'
        }`} onClick={handleToggleClick}>
           <div className={`p-2 rounded-full mr-3 ${alert.is_active ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
              <ShieldAlert size={20} />
           </div>
           <div className="mr-4">
              <p className={`text-sm font-bold leading-tight ${alert.is_active ? 'text-red-700' : 'text-gray-700'}`}>
                Emergency Protocol
              </p>
              <p className="text-xs text-gray-500">{alert.is_active ? 'Status: ACTIVE' : 'Status: Normal'}</p>
           </div>
           <div className={`w-11 h-6 rounded-full relative transition-colors ${alert.is_active ? 'bg-red-600' : 'bg-gray-200'}`}>
              <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform ${alert.is_active ? 'translate-x-full border-white' : ''}`}></div>
           </div>
        </div>
      </div>

      {/* New User Notification Banner */}
      {pendingUsers.length > 0 && (
         <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center">
               <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <UserCheck className="h-5 w-5 text-orange-600 animate-pulse" />
               </div>
               <div>
                  <h3 className="text-orange-900 font-bold">New Registration Alert</h3>
                  <p className="text-sm text-orange-700">{pendingUsers.length} user(s) waiting for ID Verification & Approval.</p>
               </div>
            </div>
            <button 
              onClick={() => setActiveTab('users')}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 transition"
            >
               Review Now
            </button>
         </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-fit overflow-x-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Activity size={16} className="mr-2" /> Overview
        </button>
        <button onClick={() => setActiveTab('routing')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center whitespace-nowrap ${activeTab === 'routing' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Share2 size={16} className="mr-2" /> Routing <span className={`ml-2 px-1.5 rounded-full text-xs ${incomingDonations.length > 0 ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{incomingDonations.length}</span>
        </button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center whitespace-nowrap ${activeTab === 'users' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Users size={16} className="mr-2" /> Users <span className={`ml-2 px-1.5 rounded-full text-xs ${pendingUsers.length > 0 ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{pendingUsers.length}</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center whitespace-nowrap ${activeTab === 'inventory' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Package size={16} className="mr-2" /> Records
        </button>
        <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center whitespace-nowrap ${activeTab === 'requests' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          <HeartHandshake size={16} className="mr-2" /> Request Hub
        </button>
      </div>

      {/* --- TAB 1: DASHBOARD --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500 font-medium mb-1">Incoming Donations</p>
                <h3 className="text-3xl font-bold text-gray-900">{incomingDonations.length}</h3>
                <p className="text-xs text-orange-500 mt-2 font-bold">Awaiting Routing</p>
             </div>
             
             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500 font-medium mb-1">Medicines Collected</p>
                <h3 className="text-3xl font-bold text-teal-600">{donations.filter(d => d.status !== 'pending_admin_approval').length}</h3>
                <p className="text-xs text-gray-400 mt-2">Processed units</p>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500 font-medium mb-1">Pending Requests</p>
                <h3 className="text-3xl font-bold text-orange-600">{pendingRequests.length}</h3>
                <p className="text-xs text-gray-400 mt-2">Needs Assignment</p>
             </div>

             <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500 font-medium mb-1">Bio-Lab Disposal</p>
                <h3 className="text-3xl font-bold text-purple-600">{donations.filter(d => d.route === 'bio-lab').length}</h3>
                <p className="text-xs text-gray-400 mt-2">Expired/Opened items</p>
             </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ROUTING --- */}
      {activeTab === 'routing' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
             <div className="p-6 border-b border-gray-100 bg-teal-50">
               <h3 className="font-bold text-teal-900 text-lg flex items-center">
                 <Share2 className="mr-2 text-teal-600" /> Incoming Donations Routing
               </h3>
               <p className="text-sm text-teal-700">Assign new donations to the most appropriate NGO based on location and need, or store in Central Warehouse.</p>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-200">
                   <tr>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Medicine</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Condition/Expiry</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Proof</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Assign Destination</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {incomingDonations.length === 0 ? (
                       <tr><td colSpan={4} className="p-12 text-center text-gray-400">No new donations pending approval.</td></tr>
                    ) : (
                      incomingDonations.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                             <div className="font-bold text-gray-900">{d.medicine_name}</div>
                             <div className="text-xs text-gray-500">{d.donor_name} • {new Date(d.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded text-xs font-bold mr-2 ${d.condition === 'Sealed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.condition}</span>
                             <span className="text-xs text-gray-600">{d.expiry_date}</span>
                          </td>
                          <td className="px-6 py-4">
                             {d.medicine_image_url ? (
                                <button onClick={() => setViewImageDonation(d)} className="text-blue-600 text-xs font-bold flex items-center hover:underline">
                                    <ImageIcon size={14} className="mr-1" /> View Image
                                </button>
                             ) : (
                                <span className="text-gray-400 text-xs italic">No Image</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             {routingDonation?.id === d.id ? (
                                <div className="flex items-center justify-end space-x-2">
                                  <select 
                                    className="text-sm border border-gray-300 rounded-lg p-2 outline-none w-48"
                                    value={routeDestination}
                                    onChange={(e) => setRouteDestination(e.target.value)}
                                  >
                                    <option value="">Select Destination...</option>
                                    <optgroup label="Internal">
                                        <option value="admin_stock">Central Warehouse (Stock)</option>
                                        <option value="bio-lab">City Bio-Lab (Disposal)</option>
                                    </optgroup>
                                    <optgroup label="Registered NGOs">
                                        {ngoList.map(ngo => (
                                          <option key={ngo.uid} value={ngo.uid}>{ngo.name}</option>
                                        ))}
                                    </optgroup>
                                  </select>
                                  <button 
                                    onClick={handleRoutingSubmit}
                                    disabled={!routeDestination}
                                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    title="Confirm Assignment"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                  <button 
                                    onClick={() => setRoutingDonation(null)}
                                    className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </div>
                             ) : (
                                <button 
                                  onClick={() => setRoutingDonation(d)}
                                  className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-700 transition"
                                >
                                  Route
                                </button>
                             )}
                          </td>
                        </tr>
                      ))
                    )}
                 </tbody>
               </table>
             </div>
        </div>
      )}

      {/* --- TAB 3: USER MANAGEMENT --- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
           <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="font-bold text-gray-800 text-lg">Registered Users</h3>
              <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                   type="text" 
                   className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 outline-none"
                   placeholder="Search users..."
                   value={userSearch}
                   onChange={(e) => setUserSearch(e.target.value)}
                 />
              </div>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                   <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User Profile</th>
                   <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role</th>
                   <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Details & Proof</th>
                   <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                   <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className={`hover:bg-gray-50 ${!u.is_active && u.role !== 'admin' ? 'bg-orange-50/50' : ''}`}>
                      <td className="px-6 py-4">
                         <div className="font-bold text-gray-900">{u.name}</div>
                         <div className="text-xs text-gray-500">{u.email}</div>
                         <div className="text-xs text-gray-400 font-mono mt-1">ID: {u.uid.substring(0,6)}...</div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                           u.role === 'admin' ? 'bg-gray-200 text-gray-800' :
                           u.role === 'ngo' ? 'bg-blue-100 text-blue-700' :
                           u.role === 'delivery' ? 'bg-orange-100 text-orange-700' :
                           'bg-teal-100 text-teal-700'
                         }`}>
                           {u.role}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                         <button 
                             onClick={() => setViewProofUser(u)}
                             className="flex items-center text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 mb-1"
                         >
                             <Eye size={12} className="mr-1" /> View Full Profile
                         </button>
                         {u.govt_id_url && (
                             <div className="text-[10px] text-green-600 flex items-center">
                                 <CheckCircle size={10} className="mr-1"/> ID Uploaded
                             </div>
                         )}
                         {u.ngo_license_number && (
                             <div className="text-xs font-mono bg-gray-100 px-1 rounded inline-block mt-1">
                                 Lic: {u.ngo_license_number}
                             </div>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         {u.is_active ? (
                            <span className="flex items-center text-green-600 text-xs font-bold uppercase">
                              <CheckCircle size={14} className="mr-1" /> Active
                            </span>
                         ) : (
                            <span className="flex items-center text-orange-500 text-xs font-bold uppercase">
                              <AlertTriangle size={14} className="mr-1" /> Pending
                            </span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         {u.role !== 'admin' && (
                           <button 
                             onClick={() => handleUserStatusChange(u.uid, u.is_active)}
                             className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                               u.is_active 
                                 ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                 : 'bg-green-600 text-white hover:bg-green-700 border-transparent shadow-sm'
                             }`}
                           >
                             {u.is_active ? 'Block' : 'Approve'}
                           </button>
                         )}
                      </td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* --- TAB 4: INVENTORY RECORDS --- */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
           {/* Filters */}
           <div className="flex space-x-2">
              <button onClick={() => setInventoryFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${inventoryFilter === 'all' ? 'bg-white border-gray-300 text-gray-900 shadow-sm' : 'border-transparent text-gray-500 hover:bg-white'}`}>
                All Records
              </button>
              <button onClick={() => setInventoryFilter('valid')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${inventoryFilter === 'valid' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent text-gray-500 hover:bg-white'}`}>
                Valid & Distributed
              </button>
              <button onClick={() => setInventoryFilter('expired')} className={`px-4 py-2 rounded-lg text-sm font-bold border ${inventoryFilter === 'expired' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-transparent text-gray-500 hover:bg-white'}`}>
                Expired / Bio-Lab
              </button>
           </div>

           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-200">
                   <tr>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Medicine Details</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Donor</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Destination</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Route / Status</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {filteredInventory.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center text-gray-400">No records found matching filters.</td></tr>
                    ) : (
                      filteredInventory.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50">
                           <td className="px-6 py-4">
                              <div className="font-bold text-gray-900">{d.medicine_name}</div>
                              <div className="text-xs text-gray-400 font-mono">ID: {d.id}</div>
                           </td>
                           <td className="px-6 py-4 text-gray-600">
                              {d.donor_name}
                           </td>
                           <td className="px-6 py-4 text-gray-900 font-medium">
                              {d.destination_name || 'Pending'}
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${d.route === 'ngo' ? 'bg-blue-100 text-blue-700' : d.route === 'admin_stock' ? 'bg-gray-200 text-gray-700' : 'bg-purple-100 text-purple-700'}`}>
                                  {d.route === 'admin_stock' ? 'Warehouse' : d.route}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                  d.status === 'verified' ? 'bg-green-100 text-green-700' : 
                                  d.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {d.status}
                                </span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(d.created_at).toLocaleDateString()}
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {/* --- TAB 5: REQUEST HUB --- */}
      {activeTab === 'requests' && (
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
               <h3 className="font-bold text-gray-800 text-lg flex items-center">
                 <Pill className="mr-2 text-teal-600" /> Donor Request Management
               </h3>
               <p className="text-sm text-gray-500">Assign pending medicine requests to NGOs for fulfillment.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Medicine Needed</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Requested By</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {pendingRequests.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center text-gray-400">No pending requests from donors.</td></tr>
                   ) : (
                     pendingRequests.map(r => (
                       <tr key={r.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{r.medicine_name}</div>
                            <div className="text-xs text-gray-500">Qty: {r.quantity}</div>
                         </td>
                         <td className="px-6 py-4 text-gray-700">
                            {r.donor_name || r.donor_id}
                         </td>
                         <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {r.reason}
                         </td>
                         <td className="px-6 py-4">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold uppercase">Pending</span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           {selectedRequest?.id === r.id ? (
                             <div className="flex items-center justify-end space-x-2">
                               <select 
                                 className="text-sm border border-gray-300 rounded-lg p-2 outline-none"
                                 value={selectedNgo}
                                 onChange={(e) => setSelectedNgo(e.target.value)}
                               >
                                 <option value="">Select NGO</option>
                                 {ngoList.map(ngo => (
                                   <option key={ngo.uid} value={ngo.uid}>{ngo.name}</option>
                                 ))}
                               </select>
                               <button 
                                 onClick={() => handleAssignRequest(r.id)}
                                 disabled={!selectedNgo}
                                 className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                               >
                                 <CheckCircle size={18} />
                               </button>
                               <button 
                                 onClick={() => setSelectedRequest(null)}
                                 className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300"
                               >
                                 <XCircle size={18} />
                               </button>
                             </div>
                           ) : (
                             <button 
                               onClick={() => setSelectedRequest(r)}
                               className="text-teal-600 hover:text-teal-800 font-bold text-sm flex items-center justify-end ml-auto"
                             >
                               Assign to NGO <ArrowRight size={16} className="ml-1" />
                             </button>
                           )}
                         </td>
                       </tr>
                     ))
                   )}
                </tbody>
              </table>
            </div>
         </div>
      )}

      {/* Emergency Protocol Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border-2 border-red-500">
            <div className="bg-red-600 p-6 text-white flex items-center space-x-3">
              <Siren size={32} className="animate-pulse" />
              <div>
                <h2 className="text-xl font-bold">Activate Emergency Protocol</h2>
                <p className="text-red-100 text-sm">This will broadcast an alert to all Donors and NGOs.</p>
              </div>
            </div>
            
            <form onSubmit={submitEmergency} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Alert Message (Reason/Region)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Flash Floods in District 9 - Immediate Support Needed"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={emergencyForm.message}
                  onChange={e => setEmergencyForm({...emergencyForm, message: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Required Medicines (Comma Separated)</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="e.g. Amoxicillin, Bandages, Insulin, ORS Packets"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={emergencyForm.medicines}
                  onChange={e => setEmergencyForm({...emergencyForm, medicines: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">These will be highlighted in the Donor Dashboard.</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowEmergencyModal(false)}
                  className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/30"
                >
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View ID Proof Modal */}
      {viewProofUser && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
                 <h3 className="font-bold flex items-center">
                    <FileText className="mr-2" size={18} /> User Profile & Verification
                 </h3>
                 <button onClick={() => setViewProofUser(null)} className="hover:bg-gray-700 p-1 rounded"><XCircle /></button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto bg-gray-100 text-center">
                 <div className="bg-white p-4 rounded-lg shadow-sm mb-4 text-left border border-gray-200">
                    <h4 className="font-bold text-gray-800 text-lg mb-1">{viewProofUser.name}</h4>
                    <p className="text-sm text-gray-500 mb-2">{viewProofUser.role.toUpperCase()} Account Application</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                       <div>
                         <span className="block font-bold text-gray-500 text-xs uppercase">Phone</span>
                         <span className="text-gray-900 font-medium">{viewProofUser.phone || 'N/A'}</span>
                       </div>
                       <div>
                         <span className="block font-bold text-gray-500 text-xs uppercase">Email</span>
                         <span className="text-gray-900 font-medium break-all">{viewProofUser.email || 'N/A'}</span>
                       </div>
                       <div className="col-span-1 sm:col-span-2">
                         <span className="block font-bold text-gray-500 text-xs uppercase">Address</span>
                         <span className="text-gray-900 font-medium">{viewProofUser.address || 'N/A'}</span>
                       </div>
                       
                       {viewProofUser.ngo_license_number && (
                         <div className="col-span-1 sm:col-span-2">
                           <span className="block font-bold text-blue-800 text-xs uppercase">NGO License</span>
                           <span className="text-blue-900 font-bold font-mono bg-blue-50 px-2 py-1 rounded inline-block">
                             {viewProofUser.ngo_license_number}
                           </span>
                         </div>
                       )}
                       
                       {viewProofUser.vehicle_number && (
                          <div className="col-span-1 sm:col-span-2">
                            <span className="block font-bold text-orange-800 text-xs uppercase">Vehicle Number</span>
                            <span className="text-orange-900 font-bold font-mono bg-orange-50 px-2 py-1 rounded inline-block">
                              {viewProofUser.vehicle_number}
                            </span>
                          </div>
                       )}
                    </div>
                 </div>

                 {/* Document Viewer */}
                 <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-200 min-h-[300px] flex flex-col items-center justify-center relative group overflow-hidden">
                    {viewProofUser.govt_id_url ? (
                        <img 
                            src={viewProofUser.govt_id_url} 
                            alt="Govt ID Proof" 
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center">
                            <FileText size={64} className="text-gray-400 mb-4" />
                            <p className="text-gray-500 font-bold">No Document Uploaded</p>
                            <p className="text-xs text-gray-400 mt-2 max-w-xs">User created before ID verification requirement or image failed to load.</p>
                        </div>
                    )}
                 </div>
              </div>

              <div className="p-4 bg-white border-t border-gray-200 flex space-x-4">
                 <button 
                   onClick={() => setViewProofUser(null)}
                   className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition"
                 >
                    Close
                 </button>
                 {!viewProofUser.is_active && (
                    <button 
                        onClick={() => handleUserStatusChange(viewProofUser.uid, false)}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center transition"
                    >
                        <CheckCircle className="mr-2" size={20} /> Verify & Approve
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* View Medicine Image Modal */}
      {viewImageDonation && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-teal-600 p-4 text-white flex justify-between items-center">
                 <h3 className="font-bold flex items-center">
                    <ImageIcon className="mr-2" size={18} /> Medicine Verification
                 </h3>
                 <button onClick={() => setViewImageDonation(null)} className="hover:bg-teal-700 p-1 rounded"><XCircle /></button>
              </div>
              <div className="p-4 bg-gray-100 flex-1 overflow-auto flex items-center justify-center">
                  <img 
                    src={viewImageDonation.medicine_image_url} 
                    alt={viewImageDonation.medicine_name}
                    className="max-w-full max-h-full rounded-lg shadow-md" 
                  />
              </div>
              <div className="p-4 bg-white text-center">
                 <p className="font-bold text-gray-800">{viewImageDonation.medicine_name}</p>
                 <p className="text-sm text-gray-500">Donated by {viewImageDonation.donor_name}</p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
