import React, { useState, useEffect } from 'react';
import { getProfile, optimizeBulletPoint, tailorProfileForJD, saveCVToHost, getResumes, deleteResume } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Printer,
  FileText,
  Wand2,
  Check,
  CheckCircle2,
  Save,
  Folder,
  ExternalLink,
  Trash2,
  Download
} from 'lucide-react';

export const CVBuilder = () => {
  const { selectedProvider, getActiveKey, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [template, setTemplate] = useState('modern'); // 'modern' | 'executive'
  const [targetRole, setTargetRole] = useState('Full-Stack & GenAI / DevOps Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [matchedKeywords, setMatchedKeywords] = useState([]);

  // Server PDF Storage State
  const [savingHost, setSavingHost] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savedResumes, setSavedResumes] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);

  // AI Bullet Rewriter Modal State
  const [rewritingIndex, setRewritingIndex] = useState(null); // { workIdx, bulletIdx }
  const [originalBullet, setOriginalBullet] = useState('');
  const [variations, setVariations] = useState([]);
  const [optimizing, setOptimizing] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    loadProfile();
    loadSavedResumesList();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile for CV Builder:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedResumesList = async () => {
    try {
      const list = await getResumes();
      setSavedResumes(list || []);
    } catch (err) {
      console.error('Failed to load saved resumes:', err);
    }
  };

  const handleGenerateTailoredCV = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      alert('Please paste a Job Description to generate a tailored CV.');
      return;
    }

    setGenerating(true);

    try {
      const tailoredData = await tailorProfileForJD(
        jobDescription,
        targetRole,
        selectedProvider,
        getActiveKey()
      );
      setProfile(tailoredData);
      setMatchedKeywords(tailoredData.matched_keywords || []);
    } catch (err) {
      console.error('Failed to generate tailored CV:', err);
      alert('Failed to generate tailored CV. Please check your AI API key in Settings.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveCVToHostServer = async () => {
    if (!profile) return;
    setSavingHost(true);
    setSaveSuccessMsg('');

    try {
      const titleName = `${targetRole || 'Tailored'} Resume (${new Date().toLocaleDateString()})`;
      const res = await saveCVToHost(titleName, targetRole, profile);
      setSaveSuccessMsg('CV & PDF saved directly to Server Host & Neon DB!');
      await loadSavedResumesList();
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save CV to host:', err);
      alert('Failed to save CV to server host.');
    } finally {
      setSavingHost(false);
    }
  };

  const handleDeleteSavedCV = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this stored CV from server?')) return;
    try {
      await deleteResume(resumeId);
      await loadSavedResumesList();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const handleRewriteBullet = async (bulletText, workIdx, bulletIdx) => {
    setOriginalBullet(bulletText);
    setRewritingIndex({ workIdx, bulletIdx });
    setOptimizing(true);
    setVariations([]);

    try {
      const res = await optimizeBulletPoint(
        bulletText,
        targetRole,
        jobDescription,
        selectedProvider,
        getActiveKey()
      );
      setVariations(res.variations || []);
    } catch (err) {
      console.error('Failed to rewrite bullet:', err);
    } finally {
      setOptimizing(false);
    }
  };

  const applyVariation = (newBulletText) => {
    if (!rewritingIndex || !profile) return;
    const updatedWork = [...profile.work_history];
    const { workIdx } = rewritingIndex;

    const lines = updatedWork[workIdx].description.split('\n');
    lines[rewritingIndex.bulletIdx] = `• ${newBulletText.replace(/^[•\-\s]+/, '')}`;
    updatedWork[workIdx].description = lines.join('\n');

    setProfile({ ...profile, work_history: updatedWork });
    setRewritingIndex(null);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Format single-line contact bar with clickable links
  const contactParts = [];
  if (profile?.location) contactParts.push({ label: profile.location, href: null });
  if (profile?.phone) contactParts.push({ label: profile.phone, href: null });
  if (profile?.links?.github) contactParts.push({ label: profile.links.github.replace('https://', ''), href: profile.links.github.startsWith('http') ? profile.links.github : `https://${profile.links.github}` });
  if (profile?.links?.linkedin) contactParts.push({ label: profile.links.linkedin.replace('https://', ''), href: profile.links.linkedin.startsWith('http') ? profile.links.linkedin : `https://${profile.links.linkedin}` });
  if (profile?.links?.portfolio) contactParts.push({ label: profile.links.portfolio.replace('https://', ''), href: profile.links.portfolio.startsWith('http') ? profile.links.portfolio : `https://${profile.links.portfolio}` });

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 font-sans">
      
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            ATS CV Builder & AI Tailoring Engine <FileText className="w-5 h-5 text-purple-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Builds an AI-tailored resume based on your Master Profile in Neon DB & Target Job Description.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Saved Server Resumes Drawer Trigger */}
          <button
            onClick={() => setShowSavedModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Folder className="w-4 h-4 text-indigo-400" />
            <span>Saved Resumes ({savedResumes.length})</span>
          </button>

          {/* Save CV to Host Server Button */}
          <button
            onClick={handleSaveCVToHostServer}
            disabled={savingHost}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {savingHost ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving to Server...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save CV to Server</span>
              </>
            )}
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Export A4 PDF</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn print:hidden">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Target JD & AI Tailoring Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Job Title / Position</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Full-Stack Developer & GenAI Engineer"
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 md:pt-6">
            <button
              onClick={handleGenerateTailoredCV}
              disabled={generating}
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Tailoring Technical CV with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>⚡ Generate AI Tailored Resume</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Job Description (JD)</label>
          <textarea
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target Job Description here to extract technical keywords and STAR bullet points..."
            className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 resize-none font-mono"
          />
        </div>

        {matchedKeywords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mr-2">Keywords Integrated:</span>
            {matchedKeywords.map((kw, kIdx) => (
              <span key={kIdx} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] rounded-md font-semibold flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Live A4 CV Document Preview Canvas */}
      <div className="flex justify-center bg-slate-950 p-2 md:p-6 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto print:p-0 print:bg-white print:border-none">
        
        <div
          id="cv-print-area"
          className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[14mm_16mm] shadow-2xl text-[11px] font-sans leading-[1.45] print:w-[210mm] print:h-auto print:p-0 print:shadow-none"
        >
          
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-2.5 mb-4 text-center">
            <h1 className="text-xl font-extrabold tracking-wide text-slate-900 uppercase">
              ZOUBAA MOHAMMED
            </h1>
            <p className="text-[11px] font-bold text-slate-700 mt-0.5 uppercase tracking-wider">
              {targetRole || profile?.headline || 'Full-Stack & GenAI / DevOps Engineer'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-2 text-[10px] text-slate-600 mt-1.5 font-medium">
              {contactParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  {part.href ? (
                    <a href={part.href} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">{part.label}</a>
                  ) : (
                    <span>{part.label}</span>
                  )}
                  {idx < contactParts.length - 1 && <span className="text-slate-400 font-bold">•</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Profile Summary */}
          {profile?.summary && (
            <div className="mb-4">
              <h2 className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                Profil Professionnel
              </h2>
              <p className="text-[11px] text-slate-800 leading-[1.45] text-justify">{profile.summary}</p>
            </div>
          )}

          {/* Work Experience / Stage */}
          {profile?.work_history && profile.work_history.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-2">
                Expériences Professionnelles & Stages
              </h2>
              <div className="space-y-2.5">
                {profile.work_history.map((work, wIdx) => (
                  <div key={wIdx}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-[11px] text-slate-900">
                        {work.title} <span className="font-semibold text-slate-700">| {work.company}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 font-mono">
                        {work.start_month || work.dates} {work.end_month ? `- ${work.end_month}` : work.is_current ? '- Present' : ''}
                      </span>
                    </div>

                    <div className="mt-1 space-y-0.5 pl-1">
                      {work.description.split('\n').map((line, bIdx) => {
                        if (!line.trim()) return null;
                        const formattedLine = line.startsWith('•') ? line : `• ${line}`;
                        return (
                          <div key={bIdx} className="group/bullet flex items-start justify-between text-[11px] text-slate-800 leading-[1.4]">
                            <span>{formattedLine}</span>
                            
                            {/* AI Rewrite Action Trigger */}
                            <button
                              onClick={() => handleRewriteBullet(line, wIdx, bIdx)}
                              title="AI STAR Rewrite"
                              className="opacity-0 group-hover/bullet:opacity-100 ml-2 px-1.5 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[9px] rounded font-semibold transition-opacity cursor-pointer print:hidden flex-shrink-0"
                            >
                              ⚡ Rewrite
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects & Products */}
          {profile?.projects && profile.projects.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-2">
                Projets Réalisés & Products
              </h2>
              <div className="space-y-2.5">
                {profile.projects.map((proj, pIdx) => (
                  <div key={pIdx}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-[11px] text-slate-900">
                        {proj.title}
                      </span>
                      {proj.demo_url && (
                        <a href={proj.demo_url.startsWith('http') ? proj.demo_url : `https://${proj.demo_url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-indigo-700 font-semibold hover:underline">{proj.demo_url.replace('https://', '')}</a>
                      )}
                    </div>
                    {proj.tech_stack && (
                      <p className="text-[10px] font-semibold text-slate-700 mt-0.5">
                        <strong className="text-slate-900">Stack:</strong> {proj.tech_stack}
                      </p>
                    )}
                    {proj.description && (
                      <div className="text-[11px] text-slate-800 mt-0.5 pl-1 space-y-0.5 leading-[1.4]">
                        {proj.description.split('\n').map((pLine, plIdx) => (
                          <p key={plIdx}>{pLine.startsWith('•') ? pLine : `• ${pLine}`}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education & Formations */}
          {profile?.education && profile.education.length > 0 && (
            <div className="mb-4">
              <h2 className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                Formations & Diplômes
              </h2>
              <div className="space-y-1.5">
                {profile.education.map((edu, eIdx) => (
                  <div key={eIdx} className="flex justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-slate-900">{edu.field_of_study || edu.degree}</span>
                      <span className="text-slate-700 font-medium"> — {edu.school}</span>
                    </div>
                    <span className="text-slate-600 font-semibold font-mono">
                      {edu.start_year || edu.dates} {edu.end_year ? `- ${edu.end_year}` : edu.is_current ? '- en cours' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Certifications Grid */}
          <div className="grid grid-cols-2 gap-5 pt-1">
            {profile?.skills && profile.skills.length > 0 && (
              <div>
                <h2 className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                  Compétences Techniques
                </h2>
                <p className="text-[10.5px] text-slate-800 leading-[1.4] font-medium">
                  {profile.skills.join(', ')}
                </p>
              </div>
            )}

            {profile?.certifications && profile.certifications.length > 0 && (
              <div>
                <h2 className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-400 pb-0.5 mb-1.5">
                  Certifications
                </h2>
                <ul className="text-[10.5px] text-slate-800 space-y-0.5 font-medium">
                  {profile.certifications.map((cert, cIdx) => (
                    <li key={cIdx}>• {cert.title} ({cert.issuer})</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Saved Resumes Server Drawer Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>Saved Server CVs & PDFs (Host Storage)</span>
              </h3>
              <button
                onClick={() => setShowSavedModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {savedResumes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No saved resumes stored on server host yet. Click "Save CV to Server" to store your first resume!
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {savedResumes.map((item) => {
                  const hostPdfUrl = `${API_BASE_URL}/api/v1/resumes/${item.id}/pdf`;
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <h4 className="font-bold text-white text-xs">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Saved: {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* View PDF */}
                        <a
                          href={hostPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" /> View Hosted PDF
                        </a>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteSavedCV(item.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-lg cursor-pointer transition-all"
                          title="Delete CV"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Rewrite Modal */}
      {rewritingIndex && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span>AI STAR Technical Bullet Optimizer</span>
              </h3>
              <button
                onClick={() => setRewritingIndex(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Original Bullet</label>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono">
                {originalBullet}
              </div>
            </div>

            {optimizing ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-purple-300 font-medium">Generating ATS STAR technical variations with {selectedProvider.toUpperCase()}...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-wider">Select Technical Variation to Apply</label>
                {variations.map((varText, vIdx) => (
                  <button
                    key={vIdx}
                    onClick={() => applyVariation(varText)}
                    className="w-full text-left p-3.5 bg-slate-950 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/50 rounded-xl text-xs text-slate-200 transition-all flex items-start justify-between gap-3 group cursor-pointer"
                  >
                    <span>{varText}</span>
                    <span className="px-2 py-1 bg-purple-600 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                      <Check className="w-3 h-3" /> Apply
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
