import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import { Package, Pill, Clock } from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  const { donations, requests } = useGlobal();
  const [activeTab, setActiveTab] = useState<'donations' | 'requests'>('donations');

  if (!user) return null;

  const myDonations = donations
    .filter(d => d.donor_id === user.uid)
    .sort((a, b) => b.created_at - a.created_at);
    
  const myRequests = requests
    .filter(r => r.donor_id === user.uid)
    .sort((a, b) => b.created_at - a.created_at);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Activity History</h1>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('donations')}
          className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'donations' 
              ? 'border-teal-600 text-teal-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Donations
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'requests' 
              ? 'border-teal-600 text-teal-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My Requests
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'donations' && (
          <div>
            {myDonations.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No donations yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myDonations.map((d) => (
                  <div key={d.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
                        <Package size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{d.medicine_name}</h3>
                        <p className="text-sm text-gray-500">Condition: {d.condition} • Route: {d.route}</p>
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <Clock size={12} className="mr-1" />
                          {new Date(d.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 ${getStatusColor(d.status)}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                      {d.status === 'pending' && (
                         <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">Code: {d.pickup_code}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            {myRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No medicine requests yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myRequests.map((r) => (
                  <div key={r.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                        <Pill size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{r.medicine_name} <span className="text-sm font-normal text-gray-500">(x{r.quantity})</span></h3>
                        <p className="text-sm text-gray-500">Reason: {r.reason}</p>
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <Clock size={12} className="mr-1" />
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                      <span className="font-bold text-gray-900">-{r.cost} Coins</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;