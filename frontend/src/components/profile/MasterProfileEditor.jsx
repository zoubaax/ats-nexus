import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../lib/api';
import { Sparkles, Save, Plus, Trash2, User, Briefcase, Code, FolderGit2, CheckCircle2, AlertCircle } from 'lucide-react';

export const MasterProfileEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState(null);

  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [workHistory, setWorkHistory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [links, setLinks] = useState({ github: '', linkedin: '', portfolio: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setHeadline(data.headline || '');
      setSummary(data.summary || '');
      setPhone(data.phone || '');
      setLocation(data.location || '');
      setSkills(data.skills || []);
      setWorkHistory(data.work_history || []);
      setProjects(data.projects || []);
      setLinks(data.links || { github: '', linkedin: '', portfolio: '' });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load master profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setError(null);

    try {
      await updateProfile({
        headline,
        summary,
        phone,
        location,
        skills,
        work_history: workHistory,
        projects,
        education: [],
        links,
      });
      setSuccessMsg('Master Profile updated successfully in Neon DB!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const addWorkEntry = () => {
    setWorkHistory([
      ...workHistory,
      { title: '', company: '', dates: '', description: '' },
    ]);
  };

  const removeWorkEntry = (idx) => {
    setWorkHistory(workHistory.filter((_, i) => i !== idx));
  };

  const addProjectEntry = () => {
    setProjects([
      ...projects,
      { title: '', tech_stack: '', description: '', link: '' },
    ]);
  };

  const removeProjectEntry = (idx) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 font-sans">
      
      {/* Header & Save Button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Master Candidate Experience Bank <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Store your complete work history, skills, and projects in Neon DB for AI CV generation & tailoring.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Master Profile</span>
            </>
          )}
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Personal Basics */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <User className="w-4 h-4 text-indigo-400" />
          <span>Candidate Basic Info</span>
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Headline / Professional Title</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer (Python & React)"
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone / Location</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-1234 • San Francisco, CA"
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Professional Summary</label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Write a brief 3-sentence summary of your technical expertise and career achievements..."
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">GitHub URL</label>
            <input
              type="text"
              value={links.github || ''}
              onChange={(e) => setLinks({ ...links, github: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">LinkedIn URL</label>
            <input
              type="text"
              value={links.linkedin || ''}
              onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Portfolio URL</label>
            <input
              type="text"
              value={links.portfolio || ''}
              onChange={(e) => setLinks({ ...links, portfolio: e.target.value })}
              placeholder="https://myportfolio.com"
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Technical Skills Bank */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Code className="w-4 h-4 text-purple-400" />
          <span>Technical Skills Bank</span>
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Type a skill (e.g. Python, Docker, PostgreSQL) and press Add"
            className="flex-1 bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-purple-500"
          />
          <button
            onClick={addSkill}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl flex items-center gap-2 group hover:border-slate-700"
            >
              <span>{skill}</span>
              <button
                onClick={() => removeSkill(skill)}
                className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Section 3: Work History Bank */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-cyan-400" />
            <span>Work Experience History</span>
          </h3>
          <button
            onClick={addWorkEntry}
            className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Position</span>
          </button>
        </div>

        {workHistory.map((work, idx) => (
          <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3 relative group">
            <button
              onClick={() => removeWorkEntry(idx)}
              className="absolute right-3 top-3 text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="text"
                value={work.title}
                onChange={(e) => {
                  const updated = [...workHistory];
                  updated[idx].title = e.target.value;
                  setWorkHistory(updated);
                }}
                placeholder="Job Title (e.g. Software Engineer)"
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
              />
              <input
                type="text"
                value={work.company}
                onChange={(e) => {
                  const updated = [...workHistory];
                  updated[idx].company = e.target.value;
                  setWorkHistory(updated);
                }}
                placeholder="Company Name"
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
              />
              <input
                type="text"
                value={work.dates}
                onChange={(e) => {
                  const updated = [...workHistory];
                  updated[idx].dates = e.target.value;
                  setWorkHistory(updated);
                }}
                placeholder="Dates (e.g. Jan 2022 - Present)"
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
              />
            </div>

            <textarea
              rows={3}
              value={work.description}
              onChange={(e) => {
                const updated = [...workHistory];
                updated[idx].description = e.target.value;
                setWorkHistory(updated);
              }}
              placeholder="Bullet point accomplishments & achievements..."
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none resize-none"
            />
          </div>
        ))}
      </div>

    </div>
  );
};
