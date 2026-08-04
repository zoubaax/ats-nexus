import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Key, Eye, EyeOff, Save, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export const SettingsView = () => {
  const { selectedProvider, setSelectedProvider, aiKeys, saveAiKeys } = useAuth();
  const [localKeys, setLocalKeys] = useState(aiKeys);
  const [showKeys, setShowKeys] = useState({ groq: false, nvidia: false, gemini: false, openai: false });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setLocalKeys(aiKeys);
  }, [aiKeys]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await saveAiKeys(localKeys, selectedProvider);
      setSuccessMsg('AI Provider & BYOK Keys saved directly to your Neon PostgreSQL database!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleShow = (keyName) => {
    setShowKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          AI Settings & BYOK (Bring Your Own Key) <Settings className="w-5 h-5 text-indigo-400" />
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure your AI engine & saved API keys in Neon PostgreSQL for zero-fee resume evaluations across all your devices.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section 1: Active AI Engine Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Active AI Engine</span>
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { id: 'groq', name: 'Groq', desc: 'Ultra-fast Llama 3.3 70B inference' },
            { id: 'nvidia', name: 'Nvidia NIM', desc: 'Enterprise-grade NIM acceleration' },
            { id: 'gemini', name: 'Google Gemini', desc: 'Top tier reasoning & extraction' },
            { id: 'ollama', name: 'Local Ollama', desc: '100% private local execution' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                selectedProvider === p.id
                  ? 'border-indigo-500 bg-indigo-600/10 text-white shadow-md'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{p.name}</span>
                {selectedProvider === p.id && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: BYOK Custom API Key Inputs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>Bring Your Own API Keys (Saved in Neon DB)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Keys are saved to your Neon PostgreSQL tenant account and synced across all devices.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Neon DB Encrypted</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Groq Key */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Groq API Key (gsk_...)</label>
            <div className="relative">
              <input
                type={showKeys.groq ? 'text' : 'password'}
                placeholder="gsk_..."
                value={localKeys.groq || ''}
                onChange={(e) => setLocalKeys({ ...localKeys, groq: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => toggleShow('groq')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showKeys.groq ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nvidia NIM Key */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Nvidia NIM API Key (nvapi-...)</label>
            <div className="relative">
              <input
                type={showKeys.nvidia ? 'text' : 'password'}
                placeholder="nvapi-..."
                value={localKeys.nvidia || ''}
                onChange={(e) => setLocalKeys({ ...localKeys, nvidia: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => toggleShow('nvidia')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showKeys.nvidia ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Google Gemini Key */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Google Gemini API Key (AIzaSy...)</label>
            <div className="relative">
              <input
                type={showKeys.gemini ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={localKeys.gemini || ''}
                onChange={(e) => setLocalKeys({ ...localKeys, gemini: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl pl-3.5 pr-10 py-2.5 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => toggleShow('gemini')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Ollama Local URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Local Ollama Endpoint URL</label>
            <input
              type="text"
              placeholder="http://localhost:11434"
              value={localKeys.ollama_url || 'http://localhost:11434'}
              onChange={(e) => setLocalKeys({ ...localKeys, ollama_url: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Keys to Neon DB</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
