
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, Truck, Users, ArrowRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 relative">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <HeartHandshake className="h-8 w-8 text-teal-600" />
              <span className="text-2xl font-bold text-gray-900 tracking-tight">MediLink</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-teal-600 font-medium px-3 py-2 transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-teal-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium border border-teal-100">
            <span className="flex h-2 w-2 rounded-full bg-teal-500 mr-2"></span>
            Connecting Compassion with Cure
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900">
            Don't let medicine <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
              go to waste.
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
            MediLink connects donors with NGOs and Bio-Labs to ensure unused medicine saves lives instead of expiring in a cabinet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-teal-600 text-white rounded-full font-bold text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 flex items-center justify-center"
            >
              Start Donating
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
             <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Feature Cards Visual */}
        <div className="flex-1 relative w-full max-w-md md:max-w-full">
           <div className="absolute top-0 right-0 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
           <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
           
           <div className="relative grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-50 transform translate-y-8">
                <div className="h-12 w-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 mb-4">
                  <Users size={24} />
                </div>
                <h3 className="font-bold text-lg mb-1">Donor Platform</h3>
                <p className="text-sm text-gray-500">Easy uploads & reward points.</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-50">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-bold text-lg mb-1">NGO Verified</h3>
                <p className="text-sm text-gray-500">Trusted network of partners.</p>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-teal-600 to-teal-800 p-6 rounded-2xl shadow-xl text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl">Fast Delivery</h3>
                  <p className="text-teal-100 text-sm">Real-time tracking for agents.</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                   <Truck size={24} />
                </div>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
