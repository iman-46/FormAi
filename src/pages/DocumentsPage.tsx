import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Search, Trash2, ArrowRight, Upload, Eye } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatBytes } from '../services/documentService';

export default function DocumentsPage() {
  const { documents, activeDocId, setActiveDocId, removeDocument } = useApp();
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.fileName.toLowerCase().includes(search.toLowerCase())
  );

  const previewDoc = documents.find((d) => d.id === previewId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">My Documents</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage uploaded paperwork, inspect extracted text, or permanently delete saved records.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Document
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents by title or filename..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center">
          <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">
            {documents.length === 0 ? 'No documents uploaded yet' : 'No matching documents'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Upload a PDF, DOCX, or TXT file to begin extracting requirements and timelines.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
          >
            Go to Upload
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 font-medium">Document</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Last AI Source</th>
                  <th className="py-3 px-4 font-medium text-right">Size</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className={d.id === activeDocId ? 'bg-violet-50/40 dark:bg-violet-950/20' : ''}
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{d.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {d.fileName} · {d.pageCount} {d.pageCount === 1 ? 'page' : 'pages'}
                        {d.isDemo ? ' · Fictional Demo' : ''}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      {d.extractionStatus.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {d.lastInferenceSource && d.lastInferenceSource !== 'none'
                        ? d.lastInferenceSource.toUpperCase()
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {formatBytes(d.fileSize)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewId(previewId === d.id ? null : d.id)}
                          className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Preview extracted text"
                          aria-label="Preview extracted text"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDocId(d.id);
                            navigate('/analysis');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white font-medium"
                        >
                          Analyze
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeDocument(d.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                          title="Delete document"
                          aria-label="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewDoc && (
        <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Extracted Text Preview — {previewDoc.title}</h2>
            <button
              type="button"
              onClick={() => setPreviewId(null)}
              className="text-xs text-slate-500 hover:text-[var(--text-primary)]"
            >
              Close
            </button>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-lg p-4 max-h-80 overflow-y-auto text-slate-700 dark:text-slate-300">
            {previewDoc.extractedText || 'No extracted text stored for this document.'}
          </pre>
        </section>
      )}
    </div>
  );
}
