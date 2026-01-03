
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle, Home } from 'lucide-react';

const PendingApproval = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8">
        <div className="mx-auto bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <ShieldAlert className="text-orange-600 h-10 w-10" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
        <p className="text-gray-500 mb-6 leading-relaxed">
          Your account has been created successfully! <br/>
          To ensure the safety of our platform, an Admin must verify your <b>Government ID Proof</b> and details before activating your access.
        </p>

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-8 text-left flex items-start">
           <CheckCircle className="text-teal-600 h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
           <div>
             <h4 className="font-bold text-teal-800 text-sm">What happens next?</h4>
             <p className="text-xs text-teal-700 mt-1">
               1. Admin reviews your submitted ID.<br/>
               2. Once approved, you will be able to log in.<br/>
               3. Please check back later.
             </p>
           </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition flex items-center justify-center"
        >
          <Home className="mr-2" size={18} /> Return to Home
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
