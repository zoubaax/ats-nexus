import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from '../components/auth/AuthPage';
import { Sidebar } from '../components/Sidebar';
import { DashboardView } from '../components/dashboard/DashboardView';
import { ATSChecker } from '../components/checker/ATSChecker';
import { MasterProfileEditor } from '../components/profile/MasterProfileEditor';
import { SettingsView } from '../components/settings/SettingsView';
import { CVBuilder } from '../components/builder/CVBuilder';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/checker" element={<ATSChecker />} />
          <Route path="/builder" element={<CVBuilder />} />
          <Route path="/profile" element={<MasterProfileEditor />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const AuthRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <AuthPage />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute />} />
      <Route path="/register" element={<AuthRoute />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
};
