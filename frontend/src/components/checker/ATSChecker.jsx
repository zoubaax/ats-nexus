import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResumeUploader } from './ResumeUploader';
import { evaluateResume } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Award, Zap, BookOpen } from 'lucide-react';

export const ATSChecker = () => {
  const navigate = useNavigate();
  const { selectedProvider, getActiveKey } = useAuth();
  const [uploadedResume, setUploadedResume] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUploadSuccess = (resumeData) => {
    setUploadedResume(resumeData);
    if (resumeData.raw_markdown) {
      setResumeText(resumeData.raw_markdown);
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please paste a Job Description to compare against your CV.');
      return;
    }

    if (!uploadedResume && !resumeText.trim()) {
      setError('Please upload a PDF resume or paste raw resume text.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const evaluation = await evaluateResume(
        {
          resume_id: uploadedResume?.id,
          resume_text: resumeText,
          job_description: jobDescription,
          target_role: targetRole,
        },
        selectedProvider,
        getActiveKey()
      );
      setResult(evaluation);
    } catch (err) {
      setError(err.message || 'Evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-8 font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-indigo-400 hover:underline mb-2 cursor-pointer font-medium flex items-center gap-1"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            ATS Resume Checker & JD Matcher <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare your resume against any Job Description to uncover missing keywords & category scores.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Left Column: Upload & Job Description Form */}
        <div className="md:col-span-6 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white">1. Select or Upload Resume</h3>
            <ResumeUploader onUploadSuccess={handleUploadSuccess} />

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Job Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Full Stack Developer, DevOps Engineer"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                2. Paste Job Description (JD)
              </label>
              <textarea
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description requirements, responsibilities, and skills here..."
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3.5 outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Evaluate Resume Match</span>
                  <Zap className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Score & Breakdown Results */}
        <div className="md:col-span-6 space-y-6">
          {result ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Score Gauge Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Match Score</span>
                  <h2 className="text-3xl font-extrabold text-white mt-1">{result.target_role}</h2>
                  <p className="text-xs text-slate-400 mt-1">Evaluated using {result.provider_used.toUpperCase()} Engine</p>
                </div>
                <div className="w-24 h-24 rounded-full bg-indigo-600/10 border-4 border-indigo-500 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-indigo-400">{result.overall_score}%</span>
                  <span className="text-[9px] font-semibold text-indigo-300/80 uppercase">Match</span>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category Breakdown</h4>
                {Object.entries(result.breakdown).map(([category, data]) => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300 capitalize">{category.replace('_', ' ')}</span>
                      <span className="text-indigo-400 font-bold">{data.score}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${data.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Missing Keywords */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Missing Hard Skill Keywords
                </h4>
                {result.missing_keywords && result.missing_keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.missing_keywords.map((kw, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-medium">
                        + {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400">All key hard skills matched!</p>
                )}
              </div>

              {/* Actionable Tips */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Actionable Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.actionable_feedback.map((tip, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">No Evaluation Result Yet</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Upload your PDF resume on the left, paste a job description, and click <strong>Evaluate Resume Match</strong> to see your scores.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
