
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/firebaseService';
import { 
  User as UserIcon, Mail, Phone, MapPin, Shield, 
  Wallet, FileText, Truck, Save, X, Key, Navigation, Loader2 
} from 'lucide-react';

const Profile = () => {
  const { user, refreshUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passError, setPassError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    location: user?.location
  });

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
          setMessage('Location updated! Click Save to confirm.');
        },
        (error) => setMessage('Error detecting location.')
      );
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await authService.updateUser(user.uid, formData);
      await refreshUser();
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } catch (e) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters.');
      return;
    }
    
    setLoading(true);
    try {
      // Pass current password for re-authentication before updating
      await authService.updatePassword(newPassword, currentPassword);
      
      setNewPassword('');
      setCurrentPassword('');
      setShowPasswordModal(false);
      
      // Auto Logout to force new credentials
      alert("Password changed successfully! Please log in with your new password.");
      await logout();
      
    } catch (e: any) {
       if (e.code === 'auth/wrong-password') {
          setPassError('Incorrect current password.');
       } else if (e.code === 'auth/requires-recent-login') {
          setPassError('Please log out and log in again to change your password.');
       } else {
          setPassError('Failed to update password. ' + e.message);
       }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
         <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
         {message && <div className="text-sm bg-teal-50 text-teal-700 px-3 py-1 rounded-lg border border-teal-200 animate-pulse">{message}</div>}
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-2 shadow-lg">
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <UserIcon size={40} />
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 right-8 flex space-x-3">
             {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-50 transition"
                >
                  Edit Details
                </button>
             ) : (
                <div className="flex space-x-2">
                   <button 
                      onClick={() => setIsEditing(false)}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold shadow hover:bg-red-100 transition flex items-center"
                    >
                      <X size={16} className="mr-1" /> Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition flex items-center"
                    >
                      {loading ? <Loader2 className="animate-spin mr-1" /> : <Save size={16} className="mr-1" />} Save
                    </button>
                </div>
             )}
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
          <div className="mb-6">
             <h2 className="text-2xl font-bold text-gray-900">{formData.name}</h2>
             <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    user.role === 'admin' ? 'bg-gray-200 text-gray-800' :
                    user.role === 'ngo' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'delivery' ? 'bg-orange-100 text-orange-700' :
                    'bg-teal-100 text-teal-700'
                }`}>
                    {user.role}
                </span>
                {user.role === 'donor' && (
                    <span className="flex items-center text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                        <Wallet size={12} className="mr-1" /> {user.wallet_balance} Coins
                    </span>
                )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
             {/* --- EDITABLE FIELDS --- */}
             <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2">Contact Info</h3>
                
                <div className="flex items-start">
                  <UserIcon className="text-gray-400 mt-2.5 mr-3" size={20} />
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Full Name</label>
                    {isEditing ? (
                        <input 
                           name="name"
                           value={formData.name}
                           onChange={handleInputChange}
                           className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    ) : (
                        <p className="mt-1 text-gray-900">{user.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="text-gray-400 mt-2.5 mr-3" size={20} />
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                    {isEditing ? (
                        <input 
                           name="phone"
                           value={formData.phone || ''}
                           onChange={handleInputChange}
                           className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                    ) : (
                        <p className="mt-1 text-gray-900">{user.phone || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="text-gray-400 mt-2.5 mr-3" size={20} />
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Address</label>
                    {isEditing ? (
                        <div className="space-y-2">
                             <input 
                                name="address"
                                value={formData.address || ''}
                                onChange={handleInputChange}
                                className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
                             />
                             <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded border border-gray-200">
                                <span className="text-gray-500">
                                   Coords: {formData.location ? `${formData.location.lat.toFixed(4)}, ${formData.location.lng.toFixed(4)}` : 'Not Set'}
                                </span>
                                <button type="button" onClick={detectLocation} className="text-blue-600 font-bold hover:underline flex items-center">
                                    <Navigation size={12} className="mr-1" /> Update
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div>
                            <p className="mt-1 text-gray-900">{user.address || 'N/A'}</p>
                            {user.location && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Lat: {user.location.lat.toFixed(4)}, Lng: {user.location.lng.toFixed(4)}
                                </p>
                            )}
                        </div>
                    )}
                  </div>
                </div>
             </div>

             {/* --- READ ONLY FIELDS --- */}
             <div className="space-y-4">
                <h3 className="font-bold text-gray-900 border-b pb-2">Account Details (Read-Only)</h3>

                <div className="flex items-start">
                  <Mail className="text-gray-400 mt-1 mr-3" size={20} />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Email Address</label>
                    <p className="mt-1 text-gray-900 font-medium">{user.email}</p>
                    <p className="text-xs text-gray-400">Cannot be changed.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <FileText className="text-gray-400 mt-1 mr-3" size={20} />
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Govt ID Proof</label>
                    <p className="mt-1 text-gray-900 font-mono text-sm truncate w-48">
                        {user.govt_id_url || 'Not Uploaded'}
                    </p>
                    <p className="text-xs text-green-600 font-bold flex items-center mt-1">
                       <Shield size={12} className="mr-1" /> Verified by Admin
                    </p>
                  </div>
                </div>

                {user.role === 'ngo' && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">NGO License</label>
                        <p className="text-blue-900 font-bold font-mono">{user.ngo_license_number}</p>
                    </div>
                )}

                {user.role === 'delivery' && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-center">
                        <Truck className="text-orange-600 mr-3" />
                        <div>
                            <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Vehicle Number</label>
                            <p className="text-orange-900 font-bold font-mono">{user.vehicle_number}</p>
                        </div>
                    </div>
                )}
             </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
             <h3 className="font-bold text-gray-900 mb-4">Security</h3>
             <button 
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium transition"
             >
                <Key size={18} className="mr-2" /> Change Password
             </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Update Password</h2>
              <form onSubmit={handleChangePassword}>
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="******"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                 </div>

                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input 
                      type="password"
                      required
                      placeholder="******"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters.</p>
                 </div>
                 
                 {passError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{passError}</p>}

                 <div className="flex space-x-3">
                    <button 
                      type="button" 
                      onClick={() => setShowPasswordModal(false)}
                      className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition flex justify-center"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'Update & Logout'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
