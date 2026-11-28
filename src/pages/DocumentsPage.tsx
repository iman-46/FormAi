import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Search, Trash2, ArrowRight, Upload, Eye, Copy, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatBytes } from '../services/documentService';

export default function DocumentsPage() {
  const { documents, activeDocId, setActiveDocId, removeDocument } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'needs_ocr'>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ? true : d.extractionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const previewDoc = documents.find((d) => d.id === previewId) ?? null;

  const handleCopyText = async (id: string, text?: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">My Documents</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Manage uploaded paperwork, inspect extracted source text, or switch your active workspace file.
          </p>
        </div>
        <Link
          to="/upload"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 min-h-[42px] py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Document
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by title or filename..."
            className="w-full min-h-[42px] pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 sm:inline-flex p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] w-full sm:w-auto">
          {(
            [
              ['all', `All (${documents.length})`],
              ['ready', 'Ready'],
              ['needs_ocr', 'Needs OCR'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-settle whitespace-nowrap text-center ${
                statusFilter === val
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 sm:p-12 text-center">
          <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">
            {documents.length === 0 ? 'No documents uploaded yet' : 'No matching documents'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Upload a PDF, DOCX, or TXT file to begin extracting requirements and timelines.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold"
          >
            Go to Upload
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Card List (no horizontal table scroll) */}
          <div className="sm:hidden rounded-2xl surface-sheet divide-y divide-[var(--border-hairline)] overflow-hidden">
            {filtered.map((d) => {
              const isSelected = d.id === activeDocId;
              return (
                <div
                  key={d.id}
                  className={`p-4 space-y-3 ${
                    isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {d.title}
                      </p>
                      {isSelected && (
                        <span className="text-[11px] font-medium text-[var(--accent-primary)] shrink-0">
                          · Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums truncate">
                      {d.fileName} · {formatBytes(d.fileSize)} · {d.pageCount}{' '}
                      {d.pageCount === 1 ? 'page' : 'pages'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 capitalize font-mono">
                      {d.extractionStatus.replace('_', ' ')}
                      {d.lastInferenceSource && d.lastInferenceSource !== 'none'
                        ? ` · ${d.lastInferenceSource.toUpperCase()}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDocId(d.id);
                        navigate('/analysis');
                      }}
                      className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold"
                    >
                      Analyze
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewId(previewId === d.id ? null : d.id)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)]"
                      aria-label="Preview extracted text"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeDocument(d.id)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-rose-600"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block rounded-xl surface-sheet overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-muted)]">
                    <th className="py-3 px-4 font-medium">Document</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Last AI Source</th>
                    <th className="py-3 px-4 font-medium text-right">Size</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {filtered.map((d) => {
                    const isSelected = d.id === activeDocId;
                    return (
                      <tr
                        key={d.id}
                        className={`transition-settle ${
                          isSelected
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                            : 'hover:bg-[var(--bg-canvas)]/70'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-[var(--text-primary)]">{d.title}</p>
                            {isSelected && (
                              <span className="text-[11px] font-medium text-[var(--accent-primary)]">
                                · Active
                              </span>
                            )}
                          </div>
                          <p className="text-[var(--text-muted)] mt-0.5 tabular-nums">
                            {d.fileName} · {d.pageCount} {d.pageCount === 1 ? 'page' : 'pages'}
                            {d.isDemo ? ' · Fictional Demo' : ''}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 capitalize text-[var(--text-secondary)]">
                          {d.extractionStatus.replace('_', ' ')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">
                          {d.lastInferenceSource && d.lastInferenceSource !== 'none'
                            ? d.lastInferenceSource.toUpperCase()
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-[var(--text-muted)]">
                          {formatBytes(d.fileSize)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewId(previewId === d.id ? null : d.id)}
                              className="p-1.5 rounded-lg border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)] transition-settle"
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white font-semibold hover:opacity-90 transition-settle"
                            >
                              Analyze
                              <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeDocument(d.id)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 transition-settle"
                              title="Delete document"
                              aria-label="Delete document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {previewDoc && (
        <section className="rounded-xl surface-sheet p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold truncate max-w-full">
              Extracted Text Preview — {previewDoc.title}
            </h2>
            <div className="flex items-center gap-2">
              {previewDoc.extractedText && (
                <button
                  type="button"
                  onClick={() => void handleCopyText(previewDoc.id, previewDoc.extractedText)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[var(--border-hairline)] text-xs hover:bg-[var(--bg-subtle)] transition-settle"
                >
                  {copiedId === previewDoc.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Text
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewId(null)}
                className="px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-lg p-4 max-h-80 overflow-y-auto text-[var(--text-secondary)]">
            {previewDoc.extractedText || 'No extracted text stored for this document.'}
          </pre>
        </section>
      )}
    </div>
  );
}
