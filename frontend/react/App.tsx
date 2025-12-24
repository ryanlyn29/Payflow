
import React from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { EnterpriseLayout } from './components/Layout';
import { AuthProvider, useAuth } from './components/AuthContext';
import { NotificationProvider } from './components/NotificationSystem';
import { DemoProvider } from './components/DemoContext';
import Overview from './pages/Overview';
import PaymentsExplorer from './pages/PaymentsExplorer';
import Alerts from './pages/Alerts';
import IncidentReplay from './pages/IncidentReplay';
import Automation from './pages/Automation';
import SystemHealth from './pages/SystemHealth';
import BatchJobs from './pages/BatchJobs';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import Onboarding from './components/Onboarding';
import OAuthCallback from './pages/OAuthCallback';

// ProtectedRoute component - must be used within AuthProvider
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="text-[#2563eb] animate-pulse flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]">PayFlow Handshake</span>
      </div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      {children}
      <Onboarding />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <DemoProvider>
          <Routes>
          {/* Public routes - no layout */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Protected routes - with EnterpriseLayout */}
          <Route element={<EnterpriseLayout><Outlet /></EnterpriseLayout>}>
            <Route path="/dashboard" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentsExplorer /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute><IncidentReplay /></ProtectedRoute>} />
            <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
            <Route path="/health" element={<ProtectedRoute><SystemHealth /></ProtectedRoute>} />
            <Route path="/batch-jobs" element={<ProtectedRoute><BatchJobs /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DemoProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
