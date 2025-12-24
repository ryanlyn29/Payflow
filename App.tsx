
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { EnterpriseLayout } from './components/Layout';
import { AuthProvider, useAuth } from './components/AuthContext';
import Overview from './pages/Overview';
import PaymentsExplorer from './pages/PaymentsExplorer';
import Alerts from './pages/Alerts';
import IncidentReplay from './pages/IncidentReplay';
import Automation from './pages/Automation';
import SystemHealth from './pages/SystemHealth';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Profile from './pages/Profile';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-enterprise-bg-dark">
      <div className="text-brand-500 animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">PaySignal Handshake</span>
      </div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <EnterpriseLayout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><PaymentsExplorer /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/incidents" element={<ProtectedRoute><IncidentReplay /></ProtectedRoute>} />
          <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
          <Route path="/health" element={<ProtectedRoute><SystemHealth /></ProtectedRoute>} />
          <Route path="/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </EnterpriseLayout>
    </AuthProvider>
  );
};

export default App;
