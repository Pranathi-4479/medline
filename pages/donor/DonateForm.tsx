

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../../services/firebaseService'; // UPDATED IMPORT
import { useAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext'; 
import { MedicineCondition } from '../../types';
import { AlertCircle, CheckCircle, Loader2, ScanLine, Wallet, X, Check, Clipboard, Siren } from 'lucide-react'; 

const DonateForm = () => {
  const { user } = useAuth();
  // Renamed alert to systemAlert to avoid shadowing global window.alert
  const { alert: systemAlert } = useGlobal(); 
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    medicine_name: '',
    expiry_date: '',
    condition: 'Sealed' as MedicineCondition,
    notes: ''
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [medicineImageFile, setMedicineImageFile] = useState<File | null>(null);
  
  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedPickupCode, setGeneratedPickupCode] = useState('');
  const [donationId, setDonationId] = useState('');

  if (!user) return null;

  // Mock OCR Functionality + Image Capture
  const handleOCRScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMedicineImageFile(file); // Store file for upload
      setScanning(true);
      
      // Simulate API processing delay for OCR
      setTimeout(() => {
        // Mock extracted data
        setFormData({
          ...formData,
          medicine_name: 'Amoxicillin 500mg', 
          expiry_date: '2025-08-15',          
          condition: 'Sealed'
        });
        setScanning(false);
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);

    // Business Logic Engine
    const today = new Date();
    const expiry = new Date(formData.expiry_date);
    const isExpired = expiry < today;
    const isOpened = formData.condition === 'Opened';

    // Determining Route and Reward Logic (Initial estimation only, Admin finalizes)
    const estimatedRoute = (isExpired || isOpened) ? 'bio-lab' : 'ngo';
    const potentialReward = estimatedRoute === 'ngo' ? 50 : 2;

    // Generate Pickup Code
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedPickupCode(pickupCode);

    try {
      // Pass the file as the second argument
      await dbService.addDonation({
        donor_id: user.uid,
        donor_name: user.name,
        medicine_name: formData.medicine_name,
        expiry_date: formData.expiry_date,
        condition: formData.condition,
        notes: formData.notes,
        route: estimatedRoute, 
        status: 'pending_admin_approval',
        potential_reward: potentialReward,
        pickup_code: pickupCode,
        is_emergency: systemAlert.is_active 
      }, medicineImageFile || undefined);
      
      setDonationId(`D-${Math.floor(Math.random() * 10000)}`);
      setAnalyzing(false);
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
      setAnalyzing(false);
      alert("Error submitting donation");
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate('/donor-dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Header with Wallet Display */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Donate Medicine</h1>
          <p className="text-gray-500 text-sm">Fill details manually or scan the strip.</p>
        </div>
        <div className="bg-teal-50 border border-teal-100 px-4 py-2 rounded-xl flex items-center shadow-sm">
          <div className="bg-teal-100 p-2 rounded-full mr-3">
            <Wallet className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <p className="text-xs text-teal-600 font-bold uppercase">My Wallet</p>
            <p className="text-lg font-bold text-teal-800">{user.wallet_balance} Coins</p>
          </div>
        </div>
      </div>

      {/* Emergency Bonus Badge */}
      {systemAlert.is_active && (
        <div className="mb-6 bg-red-100 border border-red-200 text-red-800 p-3 rounded-xl flex items-center animate-pulse">
            <Siren className="mr-3 h-5 w-5" />
            <span className="font-bold text-sm">Emergency Alert Active: 2x Coin Rewards applied for this donation!</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {analyzing ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800">Submitting & Uploading...</h3>
            <p className="text-gray-500">Sending details and image to Admin for approval.</p>
          </div>
        ) : (
          <div className="p-8">
            {/* OCR Scan Section */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 mb-3">Medicine Image / Scan</label>
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*" 
                capture="environment"
                className="hidden"
                onChange={handleOCRScan}
              />
              
              <button
                type="button"
                onClick={() => !scanning && fileInputRef.current?.click()}
                disabled={scanning}
                className={`w-full relative group overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ${
                  scanning 
                    ? 'border-teal-400 bg-teal-50 cursor-wait' 
                    : 'border-gray-300 hover:border-teal-500 hover:bg-gray-50'
                }`}
              >
                <div className="p-8 flex flex-col items-center justify-center">
                  {scanning ? (
                    <>
                      <Loader2 className="h-10 w-10 text-teal-600 animate-spin mb-3" />
                      <h3 className="text-teal-800 font-bold">Scanning...</h3>
                    </>
                  ) : medicineImageFile ? (
                    <>
                      <div className="bg-green-100 p-4 rounded-full mb-3">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-gray-800 font-bold text-lg">Image Captured</h3>
                      <p className="text-gray-500 text-sm mt-1">{medicineImageFile.name}</p>
                      <p className="text-xs text-teal-600 font-bold mt-2">Click to Retake</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-teal-100 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <ScanLine className="h-8 w-8 text-teal-600" />
                      </div>
                      <h3 className="text-gray-800 font-bold text-lg">Scan / Upload Image</h3>
                      <p className="text-gray-500 text-sm mt-1">Required for verification</p>
                    </>
                  )}
                </div>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm text-gray-400 font-medium">DETAILS</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow"
                  placeholder="e.g. Dolo 650"
                  value={formData.medicine_name}
                  onChange={(e) => setFormData({...formData, medicine_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, condition: 'Sealed'})}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                      formData.condition === 'Sealed' 
                        ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600 ring-offset-2' 
                        : 'border-gray-200 text-gray-500 hover:border-teal-200 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle className={`mb-2 h-6 w-6 ${formData.condition === 'Sealed' ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span className="font-bold">Sealed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, condition: 'Opened'})}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                      formData.condition === 'Opened' 
                        ? 'border-red-500 bg-red-50 text-red-800 ring-2 ring-red-500 ring-offset-2' 
                        : 'border-gray-200 text-gray-500 hover:border-red-200 hover:bg-gray-50'
                    }`}
                  >
                    <AlertCircle className={`mb-2 h-6 w-6 ${formData.condition === 'Opened' ? 'text-red-500' : 'text-gray-400'}`} />
                    <span className="font-bold">Opened/Used</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <span className="font-bold text-teal-600 mr-1">Note:</span> 
                  Sealed items earn {systemAlert.is_active ? 100 : 50} Coins. Opened items earn {systemAlert.is_active ? 4 : 2} Coins.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none transition-shadow"
                  placeholder="e.g. Keep in cool place, Handle with care..."
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-teal-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Confirm Donation
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Success Modal with Pickup Code */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden text-center relative">
            <div className="bg-teal-600 h-24 flex items-center justify-center">
              <div className="bg-white p-3 rounded-full shadow-lg mt-10">
                <Check className="h-10 w-10 text-teal-600" strokeWidth={3} />
              </div>
            </div>
            
            <div className="px-6 pb-8 pt-8">
              <h2 className="text-2xl font-bold text-gray-800">Donation Sent for Approval!</h2>
              <p className="text-gray-500 text-sm mt-2 mb-6">
                Admin will review and assign your donation to the nearest NGO or Warehouse. Please keep this code safe.
              </p>

              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 mb-6">
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">PICKUP CODE</p>
                 <div className="text-4xl font-mono font-bold text-teal-700 tracking-[0.2em]">
                    {generatedPickupCode}
                 </div>
                 <div className="text-xs text-gray-400 mt-2">ID: {donationId}</div>
              </div>

              <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg text-left mb-6 flex items-start">
                <Clipboard className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                 Take a screenshot of this code. You will need it once the delivery agent arrives.
              </div>

              <button 
                onClick={handleCloseSuccess}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonateForm;