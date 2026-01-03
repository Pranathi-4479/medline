import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Wallet } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-teal-600 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-2 shadow-lg">
              <div className="w-full h-full bg-teal-100 rounded-full flex items-center justify-center text-teal-600">
                <User size={40} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500 capitalize">{user.role}</p>

          <div className="mt-8 grid gap-6">
            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Mail className="text-teal-600 mr-4" size={24} />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-semibold text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Shield className="text-teal-600 mr-4" size={24} />
              <div>
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-semibold text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Wallet className="text-teal-600 mr-4" size={24} />
              <div>
                <p className="text-sm text-gray-500">Wallet Balance</p>
                <p className="font-semibold text-gray-900">{user.wallet_balance} Coins</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-black transition">
              Edit Profile
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition">
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;