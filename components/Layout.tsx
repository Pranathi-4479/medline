
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Truck, ShieldAlert, HeartHandshake, Menu, X, User, Wallet, History, Pill } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import MediBot from './MediBot';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return (
    <>
      {children}
      <MediBot />
    </>
  );

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <button
        onClick={() => {
          navigate(to);
          setIsMobileMenuOpen(false);
        }}
        className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-teal-700 text-white' : 'text-teal-100 hover:bg-teal-800'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-teal-900 text-white p-6 shadow-xl z-20 sticky top-0 h-screen">
        <div className="flex items-center space-x-2 mb-10">
          <HeartHandshake size={32} className="text-teal-400" />
          <h1 className="text-2xl font-bold tracking-tight">MediLink</h1>
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto">
          {user.role === 'donor' && (
            <>
              <NavItem to="/donor-dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/donate" icon={HeartHandshake} label="Donate Now" />
              <NavItem to="/request-medicine" icon={Pill} label="Request Medicine" />
              <NavItem to="/wallet" icon={Wallet} label="My Wallet" />
              <NavItem to="/history" icon={History} label="History" />
            </>
          )}
          {user.role === 'ngo' && <NavItem to="/ngo-dashboard" icon={ShieldAlert} label="Verification" />}
          {user.role === 'delivery' && <NavItem to="/delivery-dashboard" icon={Truck} label="My Tasks" />}
          {user.role === 'admin' && <NavItem to="/admin-panel" icon={ShieldAlert} label="Admin Panel" />}
          
          <div className="pt-4 mt-4 border-t border-teal-800">
             <NavItem to="/profile" icon={User} label="My Profile" />
          </div>
        </nav>

        <div className="pt-6 border-t border-teal-800 mt-auto">
          <div className="mb-4">
            <p className="text-sm text-teal-300">Signed in as</p>
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-teal-400 capitalize">{user.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-teal-200 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-teal-900 text-white p-4 flex justify-between items-center shadow-md z-30 sticky top-0">
        <div className="flex items-center space-x-2">
          <HeartHandshake size={24} className="text-teal-400" />
          <span className="font-bold text-lg">MediLink</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-teal-900 z-20 pt-20 px-6 md:hidden overflow-y-auto">
           <nav className="flex flex-col space-y-4">
            {user.role === 'donor' && (
              <>
                <NavItem to="/donor-dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem to="/donate" icon={HeartHandshake} label="Donate Now" />
                <NavItem to="/request-medicine" icon={Pill} label="Request Medicine" />
                <NavItem to="/wallet" icon={Wallet} label="My Wallet" />
                <NavItem to="/history" icon={History} label="History" />
              </>
            )}
            {user.role === 'ngo' && <NavItem to="/ngo-dashboard" icon={ShieldAlert} label="Verification" />}
            {user.role === 'delivery' && <NavItem to="/delivery-dashboard" icon={Truck} label="My Tasks" />}
            {user.role === 'admin' && <NavItem to="/admin-panel" icon={ShieldAlert} label="Admin Panel" />}
            
            <div className="border-t border-teal-800 my-2 pt-2">
               <NavItem to="/profile" icon={User} label="My Profile" />
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-teal-100 hover:bg-teal-800 rounded-lg mt-4"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-64px)] md:h-screen relative">
        {children}
      </main>
      
      {/* Chatbot Overlay */}
      <MediBot />
    </div>
  );
};

export default Layout;
