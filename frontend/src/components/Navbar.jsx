import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, User as UserIcon, Cpu, ChevronDown } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, selectedProvider, setSelectedProvider } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const providers = [
    { id: 'groq', label: 'Groq (Ultra-Fast)' },
    { id: 'nvidia', label: 'Nvidia NIM' },
    { id: 'gemini', label: 'Google Gemini' },
    { id: 'ollama', label: 'Local Ollama' },
  ];

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">ATS Nexus</span>
        </div>

        {/* AI Provider Selector & User Profile */}
        <div className="flex items-center gap-4">
          
          {/* AI Provider Badge */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400 hidden sm:inline">Engine:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Account Dropdown */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs py-1.5 px-3 rounded-xl transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-[10px]">
                  {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                </div>
                <span className="font-medium max-w-[120px] truncate">{user.full_name || user.email}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1 text-xs z-50">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-slate-200 truncate">{user.full_name || 'Candidate'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

        </div>

      </div>
    </nav>
  );
};
