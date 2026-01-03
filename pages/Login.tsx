
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { HeartHandshake, Eye, EyeOff, Key, Phone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/firebaseService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Verify, 2: New Password
  const [resetEmail, setResetEmail] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Handlers
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    try {
      const isVerified = await authService.verifyIdentity(resetEmail, phoneLast4);
      if (isVerified) {
        setResetStep(2);
      } else {
        setResetError('Verification failed. Email and Phone digits do not match our records.');
      }
    } catch (err) {
      setResetError('Error verifying identity.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    
    try {
      // Security Note: We cannot set the password directly via Client SDK for a non-logged-in user 
      // without the old password. We will trigger the email reset flow as the secure action.
      await authService.sendPasswordReset(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError('Failed to initiate password reset: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetStep(1);
    setResetEmail('');
    setPhoneLast4('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetSuccess(false);
    setResetError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-teal-600 p-8 text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
            <HeartHandshake className="text-white h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome Back!</h2>
          <p className="text-teal-100 mt-2">Sign in to continue your mission</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200 flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                placeholder="e.g. donor@test.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  Demo: donor@test.com / password123
                </div>
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-teal-600 font-semibold hover:underline">
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button onClick={closeForgotModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <EyeOff size={18} />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h3>
            
            {!resetSuccess ? (
              <>
                <div className="flex items-center space-x-2 mb-6 text-sm text-gray-500">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${resetStep === 1 ? 'bg-teal-600 text-white' : 'bg-green-100 text-green-700'}`}>1</span>
                  <span className={resetStep === 1 ? 'font-bold text-teal-700' : ''}>Verify</span>
                  <div className="w-8 h-px bg-gray-300"></div>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${resetStep === 2 ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</span>
                  <span className={resetStep === 2 ? 'font-bold text-teal-700' : ''}>Reset</span>
                </div>

                {resetError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {resetError}
                  </div>
                )}

                {resetStep === 1 ? (
                  <form onSubmit={handleVerifyIdentity} className="space-y-4">
                    <p className="text-sm text-gray-600">Enter your email and the <b>last 4 digits</b> of your registered mobile number.</p>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input
                        type="email"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone (Last 4 Digits)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="text"
                          required
                          maxLength={4}
                          className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono tracking-widest"
                          value={phoneLast4}
                          onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                          placeholder="XXXX"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={resetLoading}
                      className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition flex justify-center"
                    >
                      {resetLoading ? <Loader2 className="animate-spin" /> : 'Verify Identity'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                     <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 font-medium">
                       Identity Verified! Please set your new password.
                     </p>
                     <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                       <input
                         type="password"
                         required
                         className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         placeholder="New password"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm Password</label>
                       <input
                         type="password"
                         required
                         className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                         value={confirmNewPassword}
                         onChange={(e) => setConfirmNewPassword(e.target.value)}
                         placeholder="Confirm password"
                       />
                     </div>
                     <button 
                       type="submit" 
                       disabled={resetLoading}
                       className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition flex justify-center"
                     >
                       {resetLoading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                     </button>
                  </form>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                 <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-600 w-8 h-8" />
                 </div>
                 <h4 className="text-lg font-bold text-gray-900">Request Processed</h4>
                 <p className="text-sm text-gray-600 mt-2">
                   For your security, we have sent a <b>Password Reset Link</b> to <span className="font-semibold text-gray-800">{resetEmail}</span>.
                 </p>
                 <p className="text-xs text-gray-500 mt-4">Please check your inbox (and spam folder) to finalize the change.</p>
                 <button 
                   onClick={closeForgotModal}
                   className="mt-6 w-full bg-gray-900 text-white py-2 rounded-lg font-bold"
                 >
                   Back to Login
                 </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
