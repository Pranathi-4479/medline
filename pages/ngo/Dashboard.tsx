

import React, { useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/firebaseService'; // UPDATED IMPORT
import { Check, X, Package, Navigation, Clock, Activity, Archive, Truck, PlusCircle, TrendingUp, Users, Siren, Gift, ClipboardCheck, ArrowUpRight, Image as ImageIcon, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Donation } from '../../types';

const NgoDashboard = () => {
  const { user } = useAuth();
  const { donations, requests, refreshData, alert } = useGlobal();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'incoming' | 'inventory' | 'requests' | 'fulfillment'>('incoming');
  const [viewImageDonation, setViewImageDonation] = useState<Donation | null>(null);
  
  // Request Form State
  const [requestForm, setRequestForm] = useState({ medicine_name: '', quantity: 1, reason: '' });
  const [requestSuccess, setRequestSuccess] = useState(false);

  if (!user) return null;

  // --- Filter Data ---
  // Ensure we only see donations explicitly assigned to this NGO (destination_id)
  const allNgoDonations = donations.filter(d => d.destination_id === user.uid);
  
  const incomingShipments = allNgoDonations.filter(d => 
    d.status === 'pending' || d.status === 'assigned' || d.status === 'picked_up' || d.status === 'delivered'
  );

  const inventoryStock = allNgoDonations.filter(d => d.status === 'verified');

  const myRequests = requests.filter(r => r.donor_id === user.uid && r.requester_type === 'ngo');

  // Requests assigned to this NGO by Admin for fulfillment
  const assignedRequests = requests.filter(r => r.assigned_ngo_id === user.uid && r.status === 'assigned');

  // --- Analytics ---
  const totalDonationsReceived = allNgoDonations.length;
  const verifiedMedicinesCount = inventoryStock.length;
  // Mock logic: Assume each verified medicine serves ~3 patients + base count
  const patientsServedCount = 1240 + (verifiedMedicinesCount * 3);

  // --- Chart Data (Mock Historical Data for Visualization) ---
  const chartData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 70 },
    { month: 'May', value: 65 },
    { month: 'Jun', value: 95 },
  ];
  
  const maxChartValue = Math.max(...chartData.map(d => d.value)) + 10;
  
  // Helper to calculate SVG points
  const getSvgPoints = () => {
    const width = 100; // viewbox units
    const height = 40; // viewbox units
    const step = width / (chartData.length - 1);
    
    return chartData.map((d, i) => {
      const x = i * step;
      const y = height - ((d.value / maxChartValue) * height);
      return `${x},${y}`;
    }).join(' ');
  };

  // --- Handlers ---
  const handleVerify = async (id: string, donorId: string, reward: number) => {
    // UPDATED: Use processVerification which handles emergency multiplier automatically in backend
    await dbService.processVerification(id, donorId, 'verified', reward);
    await refreshData();
  };

  const handleReject = async (id: string, donorId: string) => {
    await dbService.processVerification(id, donorId, 'rejected', 2);
    await refreshData();
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await dbService.addRequest({
        donor_id: user.uid,
        requester_type: 'ngo',
        medicine_name: requestForm.medicine_name,
        quantity: requestForm.quantity,
        reason: requestForm.reason,
        cost: 0 // Free for NGOs
    });
    await refreshData();
    setRequestForm({ medicine_name: '', quantity: 1, reason: '' });
    setRequestSuccess(true);
    setTimeout(() => setRequestSuccess(false), 3000);
  };

  const handleFulfillRequest = async (requestId: string) => {
    await dbService.fulfillRequest(requestId);
    await refreshData();
  };

  const handleRejectRequest = async (requestId: string) => {
      if (window.confirm("Rejecting this request will refund the donor's coins. Continue?")) {
          await dbService.updateRequestStatus(requestId, 'rejected');
          await refreshData();
      }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

       {/* Disaster Alert Banner */}
       {alert.is_active && (
        <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl border-l-8 border-red-800 relative overflow-hidden animate-pulse-slow">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div className="flex items-start">
                <div className="bg-red-800 p-3 rounded-full mr-4">
                  <Siren className="h-8 w-8 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-xl uppercase tracking-wider mb-1">Emergency Alert Active</h3>
                  <p className="font-medium text-lg text-red-100">{alert.message}</p>
                </div>
             </div>
             {alert.required_medicines && (
                <div className="bg-white/10 p-4 rounded-xl border border-white/20 min-w-[250px]">
                   <p className="text-xs font-bold uppercase text-red-200 mb-2">Inventory Needed:</p>
                   <p className="font-bold text-sm leading-relaxed">{alert.required_medicines}</p>
                </div>
             )}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">NGO Operations Center</h1>
           <p className="text-gray-500">Manage verification, inventory, and distribution.</p>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-teal-50 rounded-full text-teal-600">
                    <Gift size={20} />
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-sm">Total Donations</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalDonationsReceived} Received</h3>
            </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                    <Check size={20} />
                </div>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">Stock Available</span>
            </div>
            <div>
                <p className="text-gray-500 text-sm">Verified Medicines</p>
                <h3 className="text-2xl font-bold text-gray-800">{verifiedMedicinesCount} Units</h3>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
             <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                    <Users size={20} />
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-sm">Patients Served</p>
                <h3 className="text-2xl font-bold text-gray-800">{patientsServedCount.toLocaleString()}</h3>
            </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-1 relative overflow-hidden">
             <div className="flex items-center justify-between mb-2">
                 <h4 className="font-bold text-gray-700 text-sm">Medicines Shipped</h4>
                 <TrendingUp size={16} className="text-teal-600" />
             </div>
             <p className="text-3xl font-bold text-gray-900 mb-4">375 <span className="text-sm font-normal text-gray-400">units</span></p>
             
             {/* SVG Chart */}
             <div className="w-full h-16 relative">
                 <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible preserve-3d">
                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#0d9488" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Area Fill */}
                    <path 
                      d={`M0,40 L${getSvgPoints()} L100,40 Z`} 
                      fill="url(#chartGradient)" 
                    />
                    
                    {/* Line Stroke */}
                    <polyline 
                       fill="none" 
                       stroke="#0d9488" 
                       strokeWidth="2" 
                       points={getSvgPoints()} 
                       strokeLinecap="round" 
                       strokeLinejoin="round"
                    />

                    {/* Points */}
                    {chartData.map((d, i) => {
                       const x = i * (100 / (chartData.length - 1));
                       const y = 40 - ((d.value / maxChartValue) * 40);
                       return (
                         <circle key={i} cx={x} cy={y} r="1.5" fill="white" stroke="#0d9488" strokeWidth="1" />
                       );
                    })}
                 </svg>
                 {/* X Axis Labels */}
                 <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium">
                    {chartData.map((d, i) => <span key={i}>{d.month}</span>)}
                 </div>
             </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-full md:w-fit overflow-x-auto">
        <button 
          onClick={() => setActiveTab('incoming')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'incoming' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Incoming & Tracking
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Inventory Stock
        </button>
        <button 
          onClick={() => setActiveTab('fulfillment')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'fulfillment' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Patient Fulfillment <span className="ml-1 bg-red-100 text-red-600 px-1.5 rounded-full text-xs">{assignedRequests.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'requests' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Request Supplies
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-h-[400px]">
        
        {/* TAB 1: INCOMING & TRACKING */}
        {activeTab === 'incoming' && (
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead className="bg-gray-50 border-b border-gray-200">
                 <tr>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Medicine</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Donor</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Tracking</th>
                   <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Verification</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {incomingShipments.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No incoming shipments assigned to your NGO.</td></tr>
                 ) : (
                   incomingShipments.map((d) => (
                     <tr key={d.id} className="hover:bg-gray-50">
                       <td className="px-6 py-4">
                         <div className="font-bold text-gray-900">{d.medicine_name}</div>
                         <div className="text-xs text-gray-500 flex items-center gap-1">
                            {d.condition} 
                            {d.medicine_image_url && (
                               <button 
                                 onClick={() => setViewImageDonation(d)}
                                 className="ml-2 text-teal-600 hover:text-teal-800"
                                 title="View Image"
                               >
                                 <ImageIcon size={14} />
                               </button>
                            )}
                         </div>
                       </td>
                       <td className="px-6 py-4 text-gray-600">{d.donor_name}</td>
                       <td className="px-6 py-4">
                         <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${
                           d.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                           d.status === 'picked_up' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {d.status.replace('_', ' ')}
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         {(d.status === 'picked_up' || d.status === 'assigned') ? (
                           <button 
                             onClick={() => navigate(`/track/${d.id}`)}
                             className="flex items-center text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition"
                           >
                             <Navigation size={12} className="mr-1 animate-pulse" />
                             Track Agent
                           </button>
                         ) : (
                           <span className="text-gray-400 text-xs">-</span>
                         )}
                       </td>
                       <td className="px-6 py-4 text-right space-x-2">
                         {d.status === 'delivered' ? (
                           <>
                             <button onClick={() => handleReject(d.id, d.donor_id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><X size={18} /></button>
                             <button onClick={() => handleVerify(d.id, d.donor_id, d.potential_reward)} className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg flex items-center inline-flex"><Check size={18} className="mr-1"/> Verify</button>
                           </>
                         ) : (
                           <span className="text-xs text-gray-400 italic">Wait for arrival</span>
                         )}
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        )}

        {/* TAB 2: INVENTORY STOCK */}
        {activeTab === 'inventory' && (
            <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Medicine Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Condition</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Expiry Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Source</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Stock ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventoryStock.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Inventory is empty.</td></tr>
                ) : (
                  inventoryStock.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{d.medicine_name}</td>
                      <td className="px-6 py-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{d.condition}</span></td>
                      <td className="px-6 py-4 text-gray-600">{d.expiry_date}</td>
                      <td className="px-6 py-4 text-gray-600">{d.donor_name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{d.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* TAB 3: FULFILLMENT (Assigned by Admin) */}
        {activeTab === 'fulfillment' && (
            <div className="overflow-x-auto">
              <div className="p-6 border-b border-gray-200 bg-orange-50/50">
                  <h3 className="text-lg font-bold text-orange-900 flex items-center"><ClipboardCheck className="mr-2" /> Pending Assignments</h3>
                  <p className="text-sm text-orange-700">Requests assigned to you by Admin. Verify stock and dispatch.</p>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient / Donor</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Needs</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignedRequests.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No pending assignments.</td></tr>
                  ) : (
                    assignedRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{r.donor_name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-500">ID: {r.donor_id}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-bold text-teal-700">{r.medicine_name}</div>
                            <div className="text-xs text-gray-500">Qty: {r.quantity}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm max-w-xs">{r.reason}</td>
                        <td className="px-6 py-4 text-right space-x-3">
                           <button 
                             onClick={() => handleRejectRequest(r.id)}
                             className="text-red-600 text-sm font-bold hover:underline"
                           >
                             Reject (Out of Stock)
                           </button>
                           <button 
                             onClick={() => handleFulfillRequest(r.id)}
                             className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-md"
                           >
                             Dispatch Medicine
                           </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        )}

        {/* TAB 4: REQUEST SUPPLIES */}
        {activeTab === 'requests' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Request from Central Admin</h3>
                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                            <input type="text" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Antibiotics" value={requestForm.medicine_name} onChange={e => setRequestForm({...requestForm, medicine_name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input type="number" min="1" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={requestForm.quantity} onChange={e => setRequestForm({...requestForm, quantity: parseInt(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Urgency</label>
                            <textarea required rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Explain the need..." value={requestForm.reason} onChange={e => setRequestForm({...requestForm, reason: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition flex items-center justify-center">
                            <PlusCircle className="mr-2" size={18} /> Submit Request
                        </button>
                        {requestSuccess && <p className="text-green-600 text-center font-bold text-sm">Request submitted successfully!</p>}
                    </form>
                </div>

                <div className="border-l border-gray-100 pl-0 md:pl-12">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">My Request History</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {myRequests.length === 0 ? (
                            <p className="text-gray-400 text-sm">No requests made yet.</p>
                        ) : (
                            myRequests.map(r => (
                                <div key={r.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-900">{r.medicine_name} <span className="text-gray-500 text-sm">(x{r.quantity})</span></h4>
                                        <span className={`px-2 py-0.5 text-xs rounded font-bold uppercase ${r.status === 'approved' || r.status === 'fulfilled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{r.reason}</p>
                                    <div className="flex items-center text-xs text-gray-400">
                                        <Clock size={12} className="mr-1" /> {new Date(r.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
      
      {/* View Medicine Image Modal */}
      {viewImageDonation && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-teal-600 p-4 text-white flex justify-between items-center">
                 <h3 className="font-bold flex items-center">
                    <ImageIcon className="mr-2" size={18} /> Medicine Check
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
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NgoDashboard;