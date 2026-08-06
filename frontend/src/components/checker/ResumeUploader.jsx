import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResumeUploader = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const handleFile = async (selectedFile) => {
    if (!selectedFile || !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF resume file.');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('ats_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/resumes/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse uploaded PDF.');
      }

      const data = await response.json();
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          id="resume-file-input"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-indigo-400">Parsing PDF & Extracting Text...</p>
          </div>
        ) : file ? (
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB • PDF</p>
              </div>
            </div>
            <label
              htmlFor="resume-file-input"
              className="text-[10px] text-indigo-400 hover:underline cursor-pointer font-medium"
            >
              Change
            </label>
          </div>
        ) : (
          <label htmlFor="resume-file-input" className="cursor-pointer flex flex-col items-center py-4">
            <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">
              Drag & Drop your Resume PDF here
            </p>
            <p className="text-[10px] text-slate-400">Supported format: .PDF (Max 10MB)</p>
          </label>
        )}
      </div>

      {error && (
        <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
