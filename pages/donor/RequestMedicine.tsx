import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/firebaseService'; // UPDATED IMPORT
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Pill, AlertCircle, Check } from 'lucide-react';

const RequestMedicine = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    medicine_name: '',
    quantity: 1,
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  const COST_PER_UNIT = 50; // Simple mock cost
  const totalCost = formData.quantity * COST_PER_UNIT;
  const canAfford = user.wallet_balance >= totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!canAfford) {
      setError('Insufficient wallet balance.');
      return;
    }

    setLoading(true);
    try {
      await dbService.addRequest({
        donor_id: user.uid,
        requester_type: 'donor',
        medicine_name: formData.medicine_name,
        quantity: formData.quantity,
        reason: formData.reason,
        cost: totalCost
      });
      await refreshUser(); // Update wallet balance in context
      setSuccess(true);
      setTimeout(() => {
        navigate('/wallet');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
        <div className="bg-green-100 p-4 rounded-full mb-4">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Request Submitted!</h2>
        <p className="text-gray-500 mt-2">Coins deducted. You are being redirected to your wallet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-teal-600 p-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Request Supplies</h1>
            <p className="text-teal-100 text-sm">Use your earned coins to get essential medicines.</p>
          </div>
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="p-8">
           <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
             <span className="text-gray-600 font-medium">Your Balance</span>
             <span className={`font-bold text-xl ${canAfford ? 'text-teal-600' : 'text-red-500'}`}>
               {user.wallet_balance} Coins
             </span>
           </div>

           {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
              <div className="relative">
                <Pill className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. Insulin, Bandages..."
                  value={formData.medicine_name}
                  onChange={(e) => setFormData({...formData, medicine_name: e.target.value})}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                <div className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 font-bold">
                  {totalCost} Coins
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Request</label>
              <textarea
                required
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Briefly explain why you need this..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !canAfford}
              className={`w-full py-4 rounded-lg font-bold text-lg transition shadow-lg ${
                canAfford 
                  ? 'bg-gray-900 text-white hover:bg-black shadow-gray-900/20' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : canAfford ? 'Submit Request' : 'Insufficient Balance'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestMedicine;