import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../lib/api';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  User,
  Briefcase,
  Code,
  FolderGit2,
  GraduationCap,
  Award,
  Globe,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';

export const MasterProfileEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basics');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState(null);

  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [phoneCode, setPhoneCode] = useState('+212');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [links, setLinks] = useState({ github: '', linkedin: '', portfolio: '' });

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');

  const [workHistory, setWorkHistory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setHeadline(data.headline || '');
      setSummary(data.summary || '');
      setPhone(data.phone || '');

      if (data.phone) {
        const parts = data.phone.trim().split(' ');
        if (parts.length > 1 && parts[0].startsWith('+')) {
          setPhoneCode(parts[0]);
          setPhoneNumber(parts.slice(1).join(' '));
        } else {
          setPhoneNumber(data.phone);
        }
      }

      setLocation(data.location || '');
      setSkills(data.skills || []);
      setWorkHistory(data.work_history || []);
      setProjects(data.projects || []);
      setEducation(data.education || []);
      setCertifications(data.certifications || []);
      setLanguages(data.languages || []);
      setLinks(data.links || { github: '', linkedin: '', portfolio: '' });
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load master profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
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
        education,
        certifications,
        languages,
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

  const removeSkill = (skillToRemove) => setSkills(skills.filter((s) => s !== skillToRemove));

  const addWorkEntry = () => {
    setWorkHistory([
      ...workHistory,
      {
        type: 'Full-time',
        title: '',
        company: '',
        location: '',
        start_month: '',
        end_month: '',
        is_current: false,
        description: ''
      },
    ]);
  };

  const addProjectEntry = () => {
    setProjects([
      ...projects,
      { title: '', role: '', tech_stack: '', description: '', github_url: '', demo_url: '' },
    ]);
  };

  const addEducationEntry = () => {
    setEducation([
      ...education,
      {
        school: '',
        degree: "Bachelor's Degree",
        field_of_study: '',
        location: '',
        start_year: '',
        end_year: '',
        is_current: false,
        gpa: ''
      },
    ]);
  };

  const addCertEntry = () => {
    setCertifications([
      ...certifications,
      { title: '', issuer: '', issue_date: '', credential_url: '' },
    ]);
  };

  const addLanguageEntry = () => {
    setLanguages([
      ...languages,
      { language: 'English', proficiency: 'Fluent' },
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const subTabs = [
    { id: 'basics', label: 'Personal & Contact', icon: User },
    { id: 'work', label: 'Work & Stage', icon: Briefcase, count: workHistory.length },
    { id: 'projects', label: 'Projects & Products', icon: FolderGit2, count: projects.length },
    { id: 'education', label: 'Education & Schools', icon: GraduationCap, count: education.length },
    { id: 'certs', label: 'Certifications', icon: Award, count: certifications.length },
    { id: 'skills', label: 'Skills & Languages', icon: Code, count: skills.length + languages.length },
  ];

  const autofillZoubaaProfile = () => {
    setHeadline("Full-Stack Developer & GenAI / DevOps Engineer");
    setSummary("Étudiant en 1ère année de Cycle d'Ingénieur (Génie Informatique), spécialisé en Full-Stack avec une expertise en IA Générative et en culture DevOps. Passionné par la conception de solutions sécurisées et performantes, je recherche un stage PFA en DevOps ou Développement de Solutions GenAI pour apporter une valeur technique immédiate à vos projets innovants.");
    setPhoneCode("+212");
    setPhoneNumber("701230904");
    setPhone("+212 701230904");
    setLocation("Fès, Maroc");
    setLinks({
      github: "https://github.com/zoubaax",
      linkedin: "https://linkedin.com/in/zoubaa-mohammed",
      portfolio: "https://zoubaa.dev"
    });

    setWorkHistory([
      {
        type: "Internship / Stage",
        title: "Full-Stack Developer (Stage)",
        company: "Le Centre d'E-Learning, de Simulation et de Télémédecine",
        location: "Fès, Maroc",
        start_month: "2024-09",
        end_month: "2024-10",
        is_current: false,
        description: "Plateforme e-learning interactive basée sur une architecture MVC pour la formation médicale.\n• Architecture: Conception UML complète et implémentation d'une API RESTful pour la gestion des cours.\n• Développement: Création de fonctionnalités interactives (Quiz, exercices) avec interface responsive.\n• Méthodologie: Gestion collaborative en mode Agile (Sprints, stand-ups).\n• Stack: React.js, Tailwind CSS, API RESTful, Express.js, PostgreSQL, Figma, Postman."
      },
      {
        type: "Internship / Stage",
        title: "Full-Stack Developer (Stage)",
        company: "NewDev Maroc",
        location: "Maroc",
        start_month: "2025-02",
        end_month: "2025-04",
        is_current: false,
        description: "Système de gestion médicale sécurisé avec contrôle d'accès multi-rôles et administration centralisée.\n• Architecture: Conception UML d'un système à 4 rôles utilisateurs via une API RESTful sécurisée.\n• Développement: Implémentation de la prise de rendez-vous en ligne et du suivi patient en temps réel.\n• DevOps: Mise en œuvre de pipelines CI/CD avec Docker pour le déploiement continu et la maintenance.\n• Stack: React.js, Tailwind CSS, API RESTful, Express.js, MySQL, Docker, CI/CD, Postman."
      }
    ]);

    setProjects([
      {
        title: "Smart University : ERP Universitaire & Intelligence Artificielle (RAG)",
        role: "Full-Stack & GenAI Engineer",
        tech_stack: "React, React Native (Expo), Node.js, Express, Neon, Gemini AI, Tailwind CSS, Vercel, Git",
        description: "Solution Cross-platform (Web/Mobile) d'intelligence institutionnelle basée sur une architecture MVC et un pipeline d'IA générative.\n• Ingénierie IA: Pipeline RAG (Gemini 2.5 Flash): génération d'emplois du temps, synthèse PDF to Quiz.\n• Architecture: API RESTful sécurisée via Middleware RBAC (5+ rôles) et conception UI via Atomic Design.\n• DevOps: Déploiement automatisé (CI/CD) sur Vercel avec GitHub Actions et persistance managée sur PostgreSQL (Neon).",
        github_url: "https://github.com/zoubaax",
        demo_url: "https://university-management-lqrz.vercel.app"
      },
      {
        title: "Maliki AI : Assistant de Recherche Fiqhi (RAG & NLP)",
        role: "AI & Backend Lead",
        tech_stack: "Python, FastAPI, React, PostgreSQL (pgvector), Docker, Gemini AI, Hugging Face, Git",
        description: "Système expert spécialisé (Fiqh Malékite) basé sur un pipeline RAG traitant 4 000+ extraits sourcés.\n• Pipeline IA: Pipeline NLP Arabe (PyMuPDF): normalisation Unicode et correction des inversions de texte (RTL).\n• IA & Backend: Recherche sémantique via Vector Embeddings (pgvector sur Neon) et génération de réponses sourcées (Gemini 2.5 Flash).\n• DevOps: Backend FastAPI (Docker) hébergé sur Hugging Face et frontend React sur Vercel.",
        github_url: "https://github.com/zoubaax",
        demo_url: "https://maliki-ai-assistant.vercel.app"
      },
      {
        title: "TaskMaster : Dashboard de gestion de tâches (Full-Stack)",
        role: "Full-Stack Engineer",
        tech_stack: "Java, Spring Boot 3.4, JPA/Hibernate, API REST, Spring Security, React, PostgreSQL",
        description: "Dashboard de gestion de tâches (Full-Stack) avec architecture N-Tier et sécurité JWT/RBAC.",
        github_url: "https://github.com/zoubaax",
        demo_url: ""
      }
    ]);

    setEducation([
      {
        school: "Université Privée De Fès",
        degree: "Master's Degree",
        field_of_study: "Cycle d'Ingénieur en Informatique (Génie Informatique)",
        location: "Fès, Maroc",
        start_year: "2025-09",
        end_year: "",
        is_current: true,
        gpa: ""
      },
      {
        school: "École Privée des Techniques Économiques et Commerciales",
        degree: "Bachelor's Degree",
        field_of_study: "Technicien spécialisé en développement informatique",
        location: "Maroc",
        start_year: "2023-09",
        end_year: "2025-07",
        is_current: false,
        gpa: ""
      },
      {
        school: "Etablissement Masar El Hikma",
        degree: "High School / Baccalaureate",
        field_of_study: "Baccalauréat scientifique - option Sciences Physiques",
        location: "Maroc",
        start_year: "2021-09",
        end_year: "2022-07",
        is_current: false,
        gpa: ""
      }
    ]);

    setCertifications([
      {
        title: "Datacamp - AI Engineer For Developers Associate",
        issuer: "Datacamp",
        issue_date: "2024-05",
        credential_url: "https://datacamp.com"
      },
      {
        title: "Datacamp - AWS Concepts",
        issuer: "Datacamp",
        issue_date: "2024-03",
        credential_url: "https://datacamp.com"
      },
      {
        title: "Datacamp - Object-Oriented Programming in Java",
        issuer: "Datacamp",
        issue_date: "2024-01",
        credential_url: "https://datacamp.com"
      }
    ]);

    setLanguages([
      { language: "Arabic", proficiency: "Native" },
      { language: "French", proficiency: "Intermediate" },
      { language: "English", proficiency: "Intermediate" }
    ]);

    setSkills([
      "JavaScript", "TypeScript", "Java", "PHP", "Python",
      "React", "React Native", "Node.js", "Express.js", "FastAPI", "Spring Boot", "Tailwind CSS",
      "PostgreSQL", "pgvector", "Neon", "Supabase", "MySQL", "SQL Server",
      "Docker", "GitHub Actions (CI/CD)", "Vercel", "Hugging Face", "n8n (Automation)", "Figma", "Postman"
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-8 font-sans">
      
      {/* Header & Main Save Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Master Candidate Experience Bank <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Structured candidate experience bank in Neon DB for AI CV generation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={autofillZoubaaProfile}
            type="button"
            className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Autofill My CV Data</span>
          </button>

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
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn">
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

      {/* Sub-Tab Navigation Bar */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto gap-1">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal & Contact */}
      {activeTab === 'basics' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 animate-fadeIn">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Personal & Contact Information</span>
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={phoneCode}
                  onChange={(e) => {
                    setPhoneCode(e.target.value);
                    setPhone(`${e.target.value} ${phoneNumber}`.trim());
                  }}
                  className="bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-3 outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                >
                  <option value="+212">🇲🇦 +212 (Morocco)</option>
                  <option value="+33">🇫🇷 +33 (France)</option>
                  <option value="+1">🇺🇸 +1 (USA/Canada)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+971">🇦🇪 +971 (UAE)</option>
                  <option value="+966">🇸🇦 +966 (Saudi Arabia)</option>
                  <option value="+49">🇩🇪 +49 (Germany)</option>
                  <option value="+34">🇪🇸 +34 (Spain)</option>
                  <option value="+31">🇳🇱 +31 (Netherlands)</option>
                  <option value="+974">🇶🇦 +974 (Qatar)</option>
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhone(`${phoneCode} ${e.target.value}`.trim());
                  }}
                  placeholder="06 12 34 56 78"
                  className="flex-1 bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Location (City, Country)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Paris, France or Remote"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">GitHub URL</label>
              <input
                type="url"
                value={links.github || ''}
                onChange={(e) => setLinks({ ...links, github: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">LinkedIn URL</label>
              <input
                type="url"
                value={links.linkedin || ''}
                onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Portfolio URL</label>
              <input
                type="url"
                value={links.portfolio || ''}
                onChange={(e) => setLinks({ ...links, portfolio: e.target.value })}
                placeholder="https://myportfolio.dev"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Professional Bio Summary</label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Write a compelling professional summary highlighting your technical expertise..."
              className="w-full bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Work & Stage (Date & Selector UX) */}
      {activeTab === 'work' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <span>Work Experience & Internships (Stage)</span>
            </h3>
            <button
              onClick={addWorkEntry}
              className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Position / Stage</span>
            </button>
          </div>

          {workHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No work history added yet. Click <strong>Add Position / Stage</strong> to add your first position!
            </div>
          ) : (
            workHistory.map((work, idx) => (
              <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4 relative group">
                <button
                  onClick={() => setWorkHistory(workHistory.filter((_, i) => i !== idx))}
                  className="absolute right-3 top-3 text-slate-500 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Position Type</label>
                    <select
                      value={work.type || 'Full-time'}
                      onChange={(e) => {
                        const updated = [...workHistory];
                        updated[idx].type = e.target.value;
                        setWorkHistory(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-semibold cursor-pointer"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Internship / Stage">Internship / Stage</option>
                      <option value="Contract">Contract</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Job Title</label>
                    <input
                      type="text"
                      value={work.title || ''}
                      onChange={(e) => {
                        const updated = [...workHistory];
                        updated[idx].title = e.target.value;
                        setWorkHistory(updated);
                      }}
                      placeholder="e.g. Software Engineer Intern"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={work.company || ''}
                      onChange={(e) => {
                        const updated = [...workHistory];
                        updated[idx].company = e.target.value;
                        setWorkHistory(updated);
                      }}
                      placeholder="e.g. Google / Tech Startup"
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
                    />
                  </div>
                </div>

                {/* Month/Year Date Pickers UX */}
                <div className="grid md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">Start Month & Year</label>
                    <input
                      type="month"
                      value={work.start_month || ''}
                      onChange={(e) => {
                        const updated = [...workHistory];
                        updated[idx].start_month = e.target.value;
                        setWorkHistory(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">End Month & Year</label>
                    <input
                      type="month"
                      disabled={work.is_current}
                      value={work.is_current ? '' : (work.end_month || '')}
                      onChange={(e) => {
                        const updated = [...workHistory];
                        updated[idx].end_month = e.target.value;
                        setWorkHistory(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono disabled:opacity-40"
                    />
                  </div>

                  <div className="pb-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={work.is_current || false}
                        onChange={(e) => {
                          const updated = [...workHistory];
                          updated[idx].is_current = e.target.checked;
                          if (e.target.checked) updated[idx].end_month = '';
                          setWorkHistory(updated);
                        }}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                      <span>Currently Working Here (Present)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Bullet Accomplishments</label>
                  <textarea
                    rows={3}
                    value={work.description || ''}
                    onChange={(e) => {
                      const updated = [...workHistory];
                      updated[idx].description = e.target.value;
                      setWorkHistory(updated);
                    }}
                    placeholder="• Built FastAPI services handling 10k requests/sec&#10;• Refactored database queries resulting in 35% speedup"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none resize-none font-mono"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Projects & Products */}
      {activeTab === 'projects' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-purple-400" />
              <span>Projects, Products & Open Source</span>
            </h3>
            <button
              onClick={addProjectEntry}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          {projects.map((proj, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 relative">
              <button
                onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                className="absolute right-3 top-3 text-slate-500 hover:text-red-400 p-1 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={proj.title || ''}
                  onChange={(e) => {
                    const updated = [...projects];
                    updated[idx].title = e.target.value;
                    setProjects(updated);
                  }}
                  placeholder="Project Name (e.g. ATS Nexus)"
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-semibold"
                />
                <input
                  type="text"
                  value={proj.tech_stack || ''}
                  onChange={(e) => {
                    const updated = [...projects];
                    updated[idx].tech_stack = e.target.value;
                    setProjects(updated);
                  }}
                  placeholder="Tech Stack (e.g. Python, React, PostgreSQL)"
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
                />
                <input
                  type="url"
                  value={proj.github_url || ''}
                  onChange={(e) => {
                    const updated = [...projects];
                    updated[idx].github_url = e.target.value;
                    setProjects(updated);
                  }}
                  placeholder="GitHub Repo URL"
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
                />
              </div>

              <textarea
                rows={2}
                value={proj.description || ''}
                onChange={(e) => {
                  const updated = [...projects];
                  updated[idx].description = e.target.value;
                  setProjects(updated);
                }}
                placeholder="Project description, architecture details, and impact..."
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Education & Schools (Degree Select & Year Pickers UX) */}
      {activeTab === 'education' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Education & Schools</span>
            </h3>
            <button
              onClick={addEducationEntry}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Education</span>
            </button>
          </div>

          {education.map((edu, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4 relative">
              <button
                onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                className="absolute right-3 top-3 text-slate-500 hover:text-red-400 p-1 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">School / University</label>
                  <input
                    type="text"
                    value={edu.school || ''}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].school = e.target.value;
                      setEducation(updated);
                    }}
                    placeholder="e.g. Stanford University"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Degree Level</label>
                  <select
                    value={edu.degree || "Bachelor's Degree"}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].degree = e.target.value;
                      setEducation(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-semibold cursor-pointer"
                  >
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="Ph.D. / Doctorate">Ph.D. / Doctorate</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="High School / Baccalaureate">High School / Baccalaureate</option>
                    <option value="Bootcamp / Certificate">Bootcamp / Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Field of Study / Major</label>
                  <input
                    type="text"
                    value={edu.field_of_study || ''}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].field_of_study = e.target.value;
                      setEducation(updated);
                    }}
                    placeholder="e.g. Computer Science, Software Engineering"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              {/* Month/Year Education Pickers */}
              <div className="grid md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Start Year</label>
                  <input
                    type="month"
                    value={edu.start_year || ''}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].start_year = e.target.value;
                      setEducation(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">Graduation Year</label>
                  <input
                    type="month"
                    disabled={edu.is_current}
                    value={edu.is_current ? '' : (edu.end_year || '')}
                    onChange={(e) => {
                      const updated = [...education];
                      updated[idx].end_year = e.target.value;
                      setEducation(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono disabled:opacity-40"
                  />
                </div>

                <div className="pb-2">
                  <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={edu.is_current || false}
                      onChange={(e) => {
                        const updated = [...education];
                        updated[idx].is_current = e.target.checked;
                        if (e.target.checked) updated[idx].end_year = '';
                        setEducation(updated);
                      }}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span>Currently Studying Here</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Certifications */}
      {activeTab === 'certs' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Professional Certifications</span>
            </h3>
            <button
              onClick={addCertEntry}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Certification</span>
            </button>
          </div>

          {certifications.map((cert, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 relative">
              <button
                onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                className="absolute right-3 top-3 text-slate-500 hover:text-red-400 p-1 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={cert.title || ''}
                  onChange={(e) => {
                    const updated = [...certifications];
                    updated[idx].title = e.target.value;
                    setCertifications(updated);
                  }}
                  placeholder="Certificate Title (e.g. AWS Solutions Architect)"
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-semibold"
                />
                <input
                  type="text"
                  value={cert.issuer || ''}
                  onChange={(e) => {
                    const updated = [...certifications];
                    updated[idx].issuer = e.target.value;
                    setCertifications(updated);
                  }}
                  placeholder="Issuer (e.g. AWS, Meta, Coursera)"
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none"
                />
                <input
                  type="month"
                  value={cert.issue_date || ''}
                  onChange={(e) => {
                    const updated = [...certifications];
                    updated[idx].issue_date = e.target.value;
                    setCertifications(updated);
                  }}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-mono"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 6: Skills & Languages (Language & Level Selectors) */}
      {activeTab === 'skills' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Languages Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Spoken Languages</span>
              </h3>
              <button
                onClick={addLanguageEntry}
                className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Language</span>
              </button>
            </div>

            {languages.map((lang, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <select
                  value={lang.language || 'English'}
                  onChange={(e) => {
                    const updated = [...languages];
                    updated[idx].language = e.target.value;
                    setLanguages(updated);
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-semibold cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Spanish">Spanish</option>
                  <option value="German">German</option>
                  <option value="Mandarin">Mandarin</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={lang.proficiency || 'Fluent'}
                  onChange={(e) => {
                    const updated = [...languages];
                    updated[idx].proficiency = e.target.value;
                    setLanguages(updated);
                  }}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-semibold cursor-pointer"
                >
                  <option value="Native">Native / Bilingual</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Basic">Basic</option>
                </select>
                <button
                  onClick={() => setLanguages(languages.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Technical Skills Bank Section */}
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
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl flex items-center gap-2 group hover:border-slate-700 font-mono"
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
        </div>
      )}

    </div>
  );
};
