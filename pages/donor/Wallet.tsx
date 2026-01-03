import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import { Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react';

const DonorWallet = () => {
  const { user } = useAuth();
  const { donations, requests } = useGlobal();

  if (!user) return null;

  // Filter for current user
  const myDonations = donations.filter(d => d.donor_id === user.uid && (d.status === 'verified' || d.status === 'rejected'));
  const myRequests = requests.filter(r => r.donor_id === user.uid);

  // Merge and sort transactions
  const transactions = [
    ...myDonations.map(d => ({
      id: d.id,
      type: 'credit',
      title: `Donation Reward: ${d.medicine_name}`,
      amount: d.status === 'verified' ? d.potential_reward : 2,
      date: d.created_at, // Ideally we would have a 'verified_at' timestamp, but created_at works for mock
      status: d.status
    })),
    ...myRequests.map(r => ({
      id: r.id,
      type: 'debit',
      title: `Medicine Request: ${r.medicine_name}`,
      amount: r.cost,
      date: r.created_at,
      status: r.status
    }))
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Wallet</h1>

      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between">
        <div>
          <p className="text-teal-100 font-medium mb-1">Available Balance</p>
          <div className="text-5xl font-bold">{user.wallet_balance}</div>
          <p className="text-sm text-teal-200 mt-2">Use coins to request medical supplies.</p>
        </div>
        <div className="mt-6 md:mt-0 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
          <Wallet size={48} className="text-white" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
           <h3 className="font-bold text-gray-800">Transaction History</h3>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${
                    t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {t.type === 'credit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t.title}</h4>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Clock size={12} className="mr-1" />
                      {new Date(t.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={`font-bold text-lg ${
                  t.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {t.type === 'credit' ? '+' : '-'}{t.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorWallet;