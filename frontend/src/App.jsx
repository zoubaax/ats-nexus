import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/Sidebar';
import { ATSChecker } from './components/checker/ATSChecker';
import { MasterProfileEditor } from './components/profile/MasterProfileEditor';
import { Sparkles, FileText, CheckCircle2, UploadCloud, Search, ArrowRight, UserCheck, Settings } from 'lucide-react';

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

        {/* Card 3: ATS CV Builder */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">ATS CV Builder</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Build ATS-friendly PDFs using bullet point rewrites optimized for top AI parsers.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('builder')}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open CV Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

const SettingsView = () => {
  const { selectedProvider, setSelectedProvider } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-6 font-sans">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        AI Settings & BYOK (Bring Your Own Key) <Settings className="w-5 h-5 text-indigo-400" />
      </h1>
      <p className="text-xs text-slate-400">
        Choose your default AI Provider or configure custom API keys for zero-fee resume processing.
      </p>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Default AI Engine</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'groq', name: 'Groq', desc: 'Ultra-fast Llama-3 inference' },
            { id: 'nvidia', name: 'Nvidia NIM', desc: 'Enterprise AI models' },
            { id: 'gemini', name: 'Google Gemini', desc: 'Top tier reasoning' },
            { id: 'ollama', name: 'Local Ollama', desc: '100% private local models' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedProvider === p.id
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
              }`}
            >
              <p className="text-xs font-bold">{p.name}</p>
              <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
            </button>
          ))}
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
