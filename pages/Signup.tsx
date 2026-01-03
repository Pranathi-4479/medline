

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { User, Truck, Building2, ShieldCheck, Eye, EyeOff, AlertCircle, MapPin, Loader2, Navigation, Phone, FileText, UploadCloud } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('donor');
  
  // New Fields
  const [ngoLicense, setNgoLicense] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [govtIdFile, setGovtIdFile] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    setError('');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingLocation(false);
      },
      (err) => {
        setError('Unable to retrieve your location. Please check permissions.');
        setGettingLocation(false);
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGovtIdFile(e.target.files[0]);
    }
  };

  // Helper to get friendly error message
  const getErrorMessage = (errCode: string) => {
     if (errCode.includes('auth/email-already-in-use')) return "This email is already registered. Please sign in.";
     if (errCode.includes('auth/weak-password') || errCode.includes('auth/password-does-not-meet-requirements')) return "Password does not meet complexity requirements.";
     if (errCode.includes('auth/invalid-email')) return "Please enter a valid email address.";
     return "Failed to create account. Please check your connection and try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- Phone Number Validation ---
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    // --- Password Complexity Validation ---
    // At least 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 6 characters and include: 1 Uppercase, 1 Lowercase, 1 Number, and 1 Special Character (@$!%*?&).');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!address) {
      setError('Please enter your address.');
      return;
    }

    if (!govtIdFile) {
        setError('Government ID Proof is required for identity verification.');
        return;
    }

    if (role === 'ngo' && !ngoLicense) {
        setError('NGO License Number is required for verification.');
        return;
    }

    if (role === 'delivery' && !vehicleNumber) {
        setError('Vehicle Number is required for Delivery Agents.');
        return;
    }

    setLoading(true);
    try {
      await signup(name, email, phone, password, role, address, location, govtIdFile, ngoLicense, vehicleNumber);
      // Success! Redirect to Pending Approval page instead of dashboard
      navigate('/pending-approval');
    } catch (err: any) {
      console.error(err);
      setError(getErrorMessage(err.message || err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  const RoleOption = ({ value, icon: Icon, label, desc }: { value: UserRole, icon: any, label: string, desc: string }) => (
    <label className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${
      role === value 
        ? 'border-teal-600 bg-teal-50' 
        : 'border-gray-200 hover:border-teal-200'
    }`}>
      <input 
        type="radio" 
        name="role" 
        value={value} 
        checked={role === value}
        onChange={(e) => setRole(e.target.value as UserRole)}
        className="absolute opacity-0" 
      />
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
        role === value ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500'
      }`}>
        <Icon size={20} />
      </div>
      <span className={`font-bold ${role === value ? 'text-teal-900' : 'text-gray-900'}`}>{label}</span>
      <span className="text-xs text-gray-500 mt-1">{desc}</span>
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gray-900 p-8 text-center">
          <h2 className="text-3xl font-bold text-white">Join MediLink</h2>
          <p className="text-gray-400 mt-2">Secure Registration & Verification</p>
        </div>
        
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <RoleOption value="donor" icon={User} label="Donor" desc="Donate unused medicine." />
              <RoleOption value="ngo" icon={Building2} label="NGO" desc="Verify & distribute medicines." />
              <RoleOption value="delivery" icon={Truck} label="Delivery" desc="Pickup and drop-off donations." />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name {role === 'ngo' ? '(Organization Name)' : ''}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              {/* NGO Specific Field */}
              {role === 'ngo' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="block text-sm font-bold text-blue-900 mb-1">NGO License Number</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={ngoLicense}
                        onChange={(e) => setNgoLicense(e.target.value)}
                        placeholder="e.g. NGO-REG-123456"
                    />
                    <p className="text-xs text-blue-600 mt-1">Required for verification against government records.</p>
                </div>
              )}

              {/* Delivery Agent Specific Field */}
              {role === 'delivery' && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <label className="block text-sm font-bold text-orange-900 mb-1">Vehicle Number</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none uppercase"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g. NY-123-ABC"
                    />
                    <p className="text-xs text-orange-600 mt-1">Required for logistics tracking.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="tel"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits.</p>
                </div>
              </div>

              {/* Address and Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address & Location</label>
                <div className="flex flex-col space-y-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street Address, City, Zip Code"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className={`flex items-center justify-center px-4 py-3 rounded-lg border transition-all ${
                      location 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {gettingLocation ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Detecting Location...
                      </>
                    ) : location ? (
                      <>
                        <Navigation size={18} className="mr-2" />
                        Location Captured ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                      </>
                    ) : (
                      <>
                        <MapPin size={18} className="mr-2" />
                        Detect Current Location
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Government ID Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                    Government ID Proof <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition">
                    <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden" 
                        id="govt-id-upload"
                    />
                    <label htmlFor="govt-id-upload" className="cursor-pointer flex flex-col items-center">
                        <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-teal-600 hover:text-teal-700">
                            {govtIdFile ? govtIdFile.name : 'Click to upload ID (Aadhar, License, etc.)'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, PDF</span>
                    </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Min 6 chars: 1 Uppercase, 1 Lowercase, 1 Number, 1 Special.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 outline-none"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="******"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Create Account & Submit for Review'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
