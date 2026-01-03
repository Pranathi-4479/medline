import React, { useState } from 'react'; // Added useState
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import { dbService } from '../../services/firebaseService'; // UPDATED IMPORT
import { useNavigate } from 'react-router-dom';
import { Wallet, Gift, AlertTriangle, PlusCircle, Clock, CheckCircle, XCircle, Truck, Package, Navigation, ArrowRight, MapPin, Building2, FlaskConical, Siren, Award, Briefcase } from 'lucide-react'; 

const DonorDashboard = () => {
  const { user, refreshUser } = useAuth(); 
  const { alert, donations } = useGlobal();
  const navigate = useNavigate();
  const [bonusLoading, setBonusLoading] = useState(false); 

  if (!user) return null;

  const progress = Math.min((user.wallet_balance / 500) * 100, 100);

  // Filter and sort donations for the specific donor
  const myDonations = donations
    .filter(d => d.donor_id === user.uid)
    .sort((a, b) => b.created_at - a.created_at);

  // Helper for status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'assigned': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'picked_up': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'delivered': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'verified': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleBonusChoice = async (choice: 'kit' | 'coins') => {
      setBonusLoading(true);
      await dbService.resolveMilestoneReward(user.uid, choice);
      await refreshUser();
      setBonusLoading(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {/* Milestone Bonus Modal */}
      {user.has_pending_milestone_reward && (
         <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
             <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-center relative border-4 border-yellow-400">
                 <div className="bg-yellow-400 p-6">
                    <div className="bg-white w-20 h-20 rounded-full mx-auto flex items-center justify-center shadow-lg mb-2">
                        <Award className="h-10 w-10 text-yellow-500" />
                    </div>
                    <h2 className="text-2xl font-black text-yellow-900 uppercase tracking-wide">Milestone Reached!</h2>
                    <p className="text-yellow-900 font-medium">You've hit a 1000-Coin Milestone.</p>
                 </div>
                 
                 <div className="p-8">
                     <p className="text-gray-600 mb-6">
                         The Admin wants to send you a <b>First Aid Kit</b> as a bonus! If you don't need it, you can take <b>20 Coins</b> instead.
                     </p>
                     
                     <div className="grid grid-cols-1 gap-4">
                         <button 
                           onClick={() => handleBonusChoice('kit')}
                           disabled={bonusLoading}
                           className="bg-teal-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition shadow-md flex items-center justify-center group"
                         >
                            <Briefcase className="mr-2 group-hover:scale-110 transition" /> Accept First Aid Kit
                         </button>
                         <button 
                            onClick={() => handleBonusChoice('coins')}
                            disabled={bonusLoading}
                            className="bg-white border-2 border-gray-200 text-gray-600 p-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition flex items-center justify-center"
                         >
                            <Wallet className="mr-2 text-yellow-500" /> No Thanks, take 20 Coins
                         </button>
                     </div>
                 </div>
             </div>
         </div>
      )}

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
                  <span className="inline-block mt-2 bg-white text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">2x Coin Rewards Active</span>
                </div>
             </div>
             {alert.required_medicines && (
                <div className="bg-white/10 p-4 rounded-xl border border-white/20 min-w-[250px]">
                   <p className="text-xs font-bold uppercase text-red-200 mb-2">Urgent Needs:</p>
                   <p className="font-bold text-sm leading-relaxed">{alert.required_medicines}</p>
                </div>
             )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Hello, {user.name}</h1>
          <p className="text-gray-500">Your contributions allow us to save lives.</p>
        </div>
        <button 
          onClick={() => navigate('/donate')}
          className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-teal-700 transition flex items-center"
        >
          <PlusCircle className="mr-2" />
          Donate Medicine
        </button>
      </div>

      {/* Stats & Gamification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
            <Wallet size={150} />
          </div>
          <div className="relative z-10">
            <h3 className="text-teal-100 font-medium mb-1">Wallet Balance</h3>
            <div className="text-4xl font-bold mb-6">{user.wallet_balance} Coins</div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-teal-100 mb-1">
                <span>Progress to Next Milestone</span>
                <span>{(user.wallet_balance % 1000)} / 1000</span>
              </div>
              <div className="w-full bg-teal-900/30 rounded-full h-3">
                <div 
                  className="bg-white h-3 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(user.wallet_balance % 1000) / 10}%` }}
                ></div>
              </div>
            </div>

            {user.wallet_balance >= 500 && user.wallet_balance < 1000 && (
              <button className="mt-6 w-full bg-white text-teal-700 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-md">
                Claim Standard First Aid Kit (500 Coins)
              </button>
            )}
          </div>
        </div>

        {/* Impact Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="bg-orange-100 p-4 rounded-full mb-4">
                <Gift className="text-orange-500 h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Rewards Program</h3>
            <p className="text-gray-500 mt-2 max-w-sm">
                Get <span className="font-bold text-teal-600">50 Coins</span> for valid medicines (NGO Verified) and <span className="font-bold text-teal-600">2 Coins</span> for expired medicines (Bio-Lab Disposal).
            </p>
            <p className="text-xs text-orange-600 font-bold mt-2">Every 1000 Coins: Bonus First Aid Kit from Admin!</p>
        </div>
      </div>

      {/* Tracking & History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
           <h3 className="font-semibold text-gray-700 flex items-center">
             <Truck size={18} className="mr-2 text-teal-600" />
             Tracking & History
           </h3>
           <span className="text-xs text-gray-500">{myDonations.length} Records</span>
        </div>
        
        {myDonations.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center">
             <div className="bg-gray-100 p-4 rounded-full mb-3">
               <Package className="h-8 w-8 text-gray-400" />
             </div>
             <p className="text-gray-500">You haven't made any donations yet.</p>
             <button 
                onClick={() => navigate('/donate')}
                className="mt-4 text-teal-600 font-semibold hover:underline"
             >
                Start Donating Now
             </button>
           </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {myDonations.map((donation) => (
              <div key={donation.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Left: Info & Route Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-gray-900 text-lg">{donation.medicine_name}</h4>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border uppercase ${getStatusColor(donation.status)}`}>
                        {donation.status.replace('_', ' ')}
                      </span>
                      {donation.is_emergency && (
                         <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-bold border border-red-200 flex items-center">
                            <Siren size={10} className="mr-1" /> Emergency
                         </span>
                      )}
                    </div>
                    
                    {/* Route Visualization */}
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg inline-block mb-3 border border-gray-100 w-full sm:w-auto">
                      <div className="flex items-center font-medium">
                        <MapPin size={14} className="text-teal-600 mr-1" />
                        <span>Home</span>
                      </div>
                      <ArrowRight size={14} className="mx-3 text-gray-400" />
                      <div className="flex items-center font-medium">
                        {donation.route === 'ngo' ? (
                          <>
                            <Building2 size={14} className="text-blue-600 mr-1" />
                            <span>NGO Hub</span>
                          </>
                        ) : (
                          <>
                            <FlaskConical size={14} className="text-purple-600 mr-1" />
                            <span>Bio-Lab</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        Created: {new Date(donation.created_at).toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <Package size={12} className="mr-1" />
                        Condition: {donation.condition}
                      </div>
                    </div>
                  </div>

                  {/* Right: Pickup Code or Outcome */}
                  <div className="flex flex-col items-end min-w-[140px] mt-2 sm:mt-0">
                    {(donation.status === 'picked_up' || donation.status === 'assigned') && (
                       <button 
                         onClick={() => navigate(`/track/${donation.id}`)}
                         className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm shadow-md transition mb-2 w-full justify-center
                           ${donation.status === 'assigned' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white'}
                         `}
                       >
                         <Navigation size={14} className="mr-2 animate-pulse" />
                         {donation.status === 'assigned' ? 'Track Agent' : 'Track Delivery'}
                       </button>
                    )}

                    {(donation.status === 'pending' || donation.status === 'assigned') ? (
                      <div className="text-center bg-teal-50 border border-teal-100 p-3 rounded-lg w-full">
                        <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mb-1">Pickup Code</p>
                        <p className="text-2xl font-mono font-bold text-teal-800 tracking-widest leading-none">
                          {donation.pickup_code}
                        </p>
                      </div>
                    ) : null}

                    {(donation.status === 'verified' || donation.status === 'rejected') && (
                      <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                         {donation.status === 'verified' && (
                           <div className="text-green-600 font-bold flex items-center">
                             <CheckCircle size={16} className="mr-1" /> +{donation.is_emergency ? donation.potential_reward * 2 : donation.potential_reward} Coins
                           </div>
                         )}
                         {donation.status === 'rejected' && (
                           <div className="text-red-600 font-bold flex items-center">
                             <XCircle size={16} className="mr-1" /> Rejected
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;