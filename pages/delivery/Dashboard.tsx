

import React, { useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { dbService } from '../../services/firebaseService'; // UPDATED IMPORT
import { useAuth } from '../../context/AuthContext';
import { MapPin, ArrowRight, Box, CheckSquare, Loader2, Navigation, History, Trophy, Clock, Building2, Image as ImageIcon, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Donation } from '../../types';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { donations, refreshData } = useGlobal();
  const navigate = useNavigate();

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [pickupCode, setPickupCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  // View Image
  const [viewImageDonation, setViewImageDonation] = useState<Donation | null>(null);

  if (!user) return null;

  // Filter Tasks: Only show 'pending' status (meaning Admin approved/assigned)
  const availableTasks = donations.filter(d => d.status === 'pending');
  // Assigned or Active for THIS user
  const myTasks = donations.filter(d => d.status === 'assigned' && d.delivery_agent_id === user.uid);
  const activeDeliveries = donations.filter(d => d.status === 'picked_up' && d.delivery_agent_id === user.uid);
  
  // Completed History for THIS user
  const completedDeliveries = donations.filter(d => 
    (d.status === 'delivered' || d.status === 'verified' || d.status === 'rejected') && 
    d.delivery_agent_id === user.uid
  ).sort((a, b) => b.created_at - a.created_at);

  const totalDeliveriesCount = completedDeliveries.length;

  const acceptTask = async (id: string) => {
    await dbService.assignDonation(id, user.uid, user.name);
    await refreshData();
  };

  const openPickupModal = (id: string) => {
    setSelectedDonationId(id);
    setPickupCode('');
    setError('');
    setVerifyModalOpen(true);
  };

  const handleVerifyPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonationId || !user) return;
    
    setVerifying(true);
    setError('');

    try {
      const isValid = await dbService.verifyPickupCode(selectedDonationId, pickupCode, user.name);
      
      if (isValid) {
        await refreshData();
        setVerifyModalOpen(false);
        // Navigate to tracking immediately after success
        navigate(`/track/${selectedDonationId}`);
      } else {
        setError('Invalid Pickup Code. Please ask the donor.');
      }
    } catch (err) {
      setError('System error.');
    } finally {
      setVerifying(false);
    }
  };

  const completeDelivery = async (id: string) => {
    await dbService.updateDonationStatus(id, 'delivered');
    await refreshData();
  };

  const renderTaskCard = (donation: Donation, type: 'available' | 'assigned' | 'active' | 'completed') => (
    <div key={donation.id} className={`bg-white p-4 rounded-xl shadow-sm border mb-4 ${type === 'completed' ? 'border-gray-100 opacity-80' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center">
            {donation.medicine_name}
            {donation.medicine_image_url && (
                <button 
                  onClick={() => setViewImageDonation(donation)} 
                  className="ml-2 text-blue-600 hover:text-blue-800"
                  title="View Image"
                >
                    <ImageIcon size={16} />
                </button>
            )}
          </h3>
          <p className="text-sm text-gray-500">From: {donation.donor_name}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded font-bold uppercase ${
          donation.route === 'bio-lab' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
        }`}>
          {donation.route === 'admin_stock' ? 'Warehouse' : donation.route}
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2 text-sm">
        <div className="flex items-start">
           <MapPin size={16} className="mr-2 text-gray-400 mt-0.5" />
           <span className="text-gray-600">Pickup: Donor Location</span>
        </div>
        <div className="flex items-start">
           <Building2 size={16} className="mr-2 text-teal-600 mt-0.5" />
           <div>
              <span className="text-gray-900 font-bold block">Drop: {donation.destination_name}</span>
              <span className="text-xs text-gray-500">Authorized by Admin</span>
           </div>
        </div>
      </div>

      {type === 'completed' && (
         <div className="flex items-center text-sm text-gray-500 mb-4">
             <Clock size={16} className="mr-1" />
             <span>Completed on {new Date(donation.created_at).toLocaleDateString()}</span>
         </div>
      )}

      {type === 'available' && (
        <button 
          onClick={() => acceptTask(donation.id)}
          className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-black transition flex items-center justify-center"
        >
          <span>Accept Task</span>
          <ArrowRight size={16} className="ml-2" />
        </button>
      )}

      {type === 'assigned' && (
        <div className="space-y-2">
           <button 
            onClick={() => navigate(`/track/${donation.id}`)}
            className="w-full bg-orange-100 text-orange-700 py-2 rounded-lg font-medium hover:bg-orange-200 transition flex items-center justify-center"
          >
            <Navigation size={16} className="mr-2" />
            <span>Navigate to Pickup</span>
          </button>
          <button 
            onClick={() => openPickupModal(donation.id)}
            className="w-full bg-teal-600 text-white py-2 rounded-lg font-medium hover:bg-teal-700 transition flex items-center justify-center"
          >
            <Box size={16} className="mr-2" />
            <span>Verify & Pickup</span>
          </button>
        </div>
      )}

      {type === 'active' && (
         <div className="flex space-x-2">
            <button 
              onClick={() => navigate(`/track/${donation.id}`)}
              className="flex-1 bg-blue-50 text-blue-700 border border-blue-200 py-2 rounded-lg font-medium hover:bg-blue-100 transition flex items-center justify-center"
            >
              <Navigation size={16} className="mr-2" />
              Live Map
            </button>
            <button 
              onClick={() => completeDelivery(donation.id)}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center"
            >
              <CheckSquare size={16} className="mr-2" />
              Delivered
            </button>
         </div>
      )}
      
      {type === 'completed' && (
        <div className="text-center text-sm font-bold text-green-600 bg-green-50 py-2 rounded-lg border border-green-100">
          Delivery Successful
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-xl font-bold text-gray-800">Hello, {user.name.split(' ')[0]}</h1>
           <p className="text-xs text-gray-500">Ready to deliver hope?</p>
        </div>
        <div className="bg-teal-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center">
           <Trophy size={16} className="mr-2 text-yellow-300" />
           <div className="text-center">
             <div className="text-xs text-teal-200 font-bold uppercase">Total</div>
             <div className="font-bold leading-none">{totalDeliveriesCount}</div>
           </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-gray-200 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('current')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'current' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Current Tasks
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
            activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History size={14} className="mr-1" /> History
        </button>
      </div>

      {activeTab === 'current' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {activeDeliveries.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center">
                <Navigation size={14} className="mr-1" />
                In Transit
              </h2>
              {activeDeliveries.map(d => renderTaskCard(d, 'active'))}
            </div>
          )}

          {myTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Pickups</h2>
              {myTasks.map(d => renderTaskCard(d, 'assigned'))}
            </div>
          )}

          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Available Near You (Admin Approved)</h2>
            {availableTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No pending tasks available.
              </div>
            ) : (
              availableTasks.map(d => renderTaskCard(d, 'available'))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
           {completedDeliveries.length === 0 ? (
             <div className="text-center py-12 text-gray-400">
               <History size={32} className="mx-auto mb-2 opacity-50" />
               <p>No delivery history yet.</p>
             </div>
           ) : (
             completedDeliveries.map(d => renderTaskCard(d, 'completed'))
           )}
        </div>
      )}

      {/* Verification Modal */}
      {verifyModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Verify Pickup</h2>
            <p className="text-gray-500 text-sm mb-6">Ask the donor for the 4-digit code.</p>
            
            <form onSubmit={handleVerifyPickup}>
               <div className="mb-4">
                 <input 
                   type="text" 
                   maxLength={4}
                   placeholder="0000"
                   className="w-full text-center text-4xl font-mono font-bold tracking-[0.5em] py-4 border-2 border-gray-300 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all uppercase"
                   value={pickupCode}
                   onChange={(e) => setPickupCode(e.target.value)}
                 />
               </div>

               {error && <p className="text-red-500 text-center text-sm font-bold mb-4">{error}</p>}

               <div className="flex space-x-3">
                 <button 
                   type="button"
                   onClick={() => setVerifyModalOpen(false)}
                   className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit"
                   disabled={verifying || pickupCode.length < 4}
                   className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition disabled:bg-gray-300 flex justify-center items-center"
                 >
                   {verifying ? <Loader2 className="animate-spin" /> : 'Confirm'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* View Medicine Image Modal */}
      {viewImageDonation && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                 <h3 className="font-bold flex items-center">
                    <ImageIcon className="mr-2" size={18} /> Package Verification
                 </h3>
                 <button onClick={() => setViewImageDonation(null)} className="hover:bg-blue-700 p-1 rounded"><XCircle /></button>
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

export default DeliveryDashboard;