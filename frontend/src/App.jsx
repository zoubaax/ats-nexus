import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/Sidebar';
import { ATSChecker } from './components/checker/ATSChecker';
import { MasterProfileEditor } from './components/profile/MasterProfileEditor';
import { SettingsView } from './components/settings/SettingsView';
import { Sparkles, FileText, CheckCircle2, Search, ArrowRight, UserCheck, Settings } from 'lucide-react';

const DashboardView = ({ setActiveTab }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto py-8 px-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-purple-900/20 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Welcome back, {user?.full_name || 'Candidate'}! <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Your tenant workspace is isolated & saved in Neon PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('checker')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Launch ATS Checker</span>
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Card 1: ATS CV Checker */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">ATS CV Checker</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Compare your resume against any Job Description. Uncover keyword gaps and category scores.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('checker')}
            className="w-full py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Launch Checker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: CV Maker Info Bank */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">CV Maker Info Bank</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Store your complete work history, skills, and projects in Neon DB for instant AI CV generation.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Manage Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: AI Settings & BYOK */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">AI Settings & BYOK</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Configure your Groq, Nvidia, Gemini, or Ollama keys for zero platform fees.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open AI Settings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

const Layout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView setActiveTab={setActiveTab} />;
      case 'checker':
        return <ATSChecker onBack={() => setActiveTab('dashboard')} />;
      case 'profile':
        return <MasterProfileEditor />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

const MainContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return user ? <Layout /> : <AuthPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
