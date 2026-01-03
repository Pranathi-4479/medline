

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalProvider } from './context/GlobalContext';
import Layout from './components/Layout';
import { UserRole } from './types';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import PendingApproval from './pages/PendingApproval';
import DonorDashboard from './pages/donor/Dashboard';
import DonateForm from './pages/donor/DonateForm';
import NgoDashboard from './pages/ngo/Dashboard';
import DeliveryDashboard from './pages/delivery/Dashboard';
import AdminPanel from './pages/admin/Panel';
import Profile from './pages/Profile'; // Updated Import
import Wallet from './pages/donor/Wallet';
import History from './pages/donor/History';
import RequestMedicine from './pages/donor/RequestMedicine';
import Tracking from './pages/Tracking';

// Route Guard
const ProtectedRoute = ({ children, allowedRoles }: React.PropsWithChildren<{ allowedRoles: UserRole[] | 'all' }>) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles !== 'all' && !allowedRoles.includes(user.role)) {
    if (user.role === 'donor') return <Navigate to="/donor-dashboard" />;
    if (user.role === 'ngo') return <Navigate to="/ngo-dashboard" />;
    if (user.role === 'delivery') return <Navigate to="/delivery-dashboard" />;
    if (user.role === 'admin') return <Navigate to="/admin-panel" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
      <Route path="/pending-approval" element={<PendingApproval />} />

      <Route path="/" element={
        user ? (
          user.role === 'donor' ? <Navigate to="/donor-dashboard" /> :
          user.role === 'ngo' ? <Navigate to="/ngo-dashboard" /> :
          user.role === 'delivery' ? <Navigate to="/delivery-dashboard" /> :
          <Navigate to="/admin-panel" />
        ) : <Landing />
      } />

      {/* Shared Route */}
      <Route path="/track/:id" element={
        <ProtectedRoute allowedRoles="all">
          <Tracking />
        </ProtectedRoute>
      } />
      
      {/* Profile: Accessible to All */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles="all">
          <Profile />
        </ProtectedRoute>
      } />

      {/* Donor Routes */}
      <Route path="/donor-dashboard" element={
        <ProtectedRoute allowedRoles={['donor']}>
          <DonorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/donate" element={
        <ProtectedRoute allowedRoles={['donor']}>
          <DonateForm />
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute allowedRoles={['donor']}>
          <Wallet />
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute allowedRoles={['donor']}>
          <History />
        </ProtectedRoute>
      } />
      <Route path="/request-medicine" element={
        <ProtectedRoute allowedRoles={['donor']}>
          <RequestMedicine />
        </ProtectedRoute>
      } />

      {/* Other Roles */}
      <Route path="/ngo-dashboard" element={
        <ProtectedRoute allowedRoles={['ngo']}>
          <NgoDashboard />
        </ProtectedRoute>
      } />

      <Route path="/delivery-dashboard" element={
        <ProtectedRoute allowedRoles={['delivery']}>
          <DeliveryDashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin-panel" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminPanel />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <GlobalProvider>
        <Router>
          <Layout>
            <AppRoutes />
          </Layout>
        </Router>
      </GlobalProvider>
    </AuthProvider>
  );
}

export default App;
