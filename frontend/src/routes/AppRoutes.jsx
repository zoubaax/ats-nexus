import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from '../components/auth/AuthPage';
import { Sidebar } from '../components/Sidebar';
import { DashboardView } from '../components/dashboard/DashboardView';
import { ATSChecker } from '../components/checker/ATSChecker';
import { MasterProfileEditor } from '../components/profile/MasterProfileEditor';
import { SettingsView } from '../components/settings/SettingsView';
import { FileText } from 'lucide-react';

const BuilderPlaceholder = () => (
  <div className="max-w-4xl mx-auto py-12 px-6 font-sans space-y-4 text-center">
    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
      <FileText className="w-6 h-6" />
    </div>
    <h1 className="text-2xl font-bold text-white">ATS CV Builder</h1>
    <p className="text-xs text-slate-400 max-w-md mx-auto">
      Use your Master Experience Bank in Neon DB to generate AI-optimized bullet points and ATS-friendly PDF templates.
    </p>
  </div>
);

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
          <Route path="/builder" element={<BuilderPlaceholder />} />
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
