import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useHybridRunner } from '../hooks/useHybridRunner';
import { extractDocumentRequirements } from '../services/hybridAIService';
import type { RequirementStatus } from '../types';

const STATUS_OPTIONS: Array<{ value: RequirementStatus; label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'missing', label: 'Missing' },
  { value: 'needs_verification', label: 'Needs verification' },
  { value: 'not_applicable', label: 'Not applicable' },
];

export default function ChecklistPage() {
  const {
    user,
    activeDoc,
    requirements,
    preferences,
    remoteConfig,
    replaceRequirements,
    updateRequirementStatus,
  } = useApp();
  const { executeTrackedTask } = useHybridRunner();

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeDoc) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center max-w-xl mx-auto">
        <p className="text-sm font-medium mb-2">Select or upload a document first</p>
        <Link
          to="/upload"
          className="inline-flex px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
        >
          Upload Document
        </Link>
      </div>
    );
  }

  const handleScan = async () => {
    if (!activeDoc.extractedText) {
      setError('No extracted text available for this document.');
      return;
    }
    setError(null);
    setScanning(true);
    try {
      const res = await executeTrackedTask({
        operation: 'requirements',
        docId: activeDoc.id,
        docTitle: activeDoc.title,
        requestedMode: preferences.defaultInferenceMode,
        consentReason: `Identify mandatory and optional supporting documents from "${activeDoc.title}".`,
        run: async (effectiveMode) => {
          const out = await extractDocumentRequirements({
            userId: user?.uid || 'guest',
            docId: activeDoc.id,
            documentText: activeDoc.extractedText || '',
            mode: effectiveMode,
            remoteConfig,
          });
          return { data: out.requirements, meta: out.meta };
        },
      });
      if (res) {
        await replaceRequirements(activeDoc.id, res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Requirement scan failed.');
    } finally {
      setScanning(false);
    }
  };

  const mandatoryCount = requirements.filter((r) => r.mandatory).length;
  const readyCount = requirements.filter((r) => r.status === 'available').length;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{activeDoc.title}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Document Requirement Checker</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
            {requirements.length} items detected ({mandatoryCount} mandatory) · {readyCount} marked available
          </p>
        </div>

        <button
          type="button"
          disabled={scanning}
          onClick={() => void handleScan()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {scanning ? 'Scanning Requirements...' : requirements.length > 0 ? 'Re-scan Documents' : 'Extract Required Documents'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {requirements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center">
          <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No supporting documents listed yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan your document to separate mandatory certificates and IDs from optional or conditional items.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requirements.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 flex flex-wrap items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`font-semibold ${
                      item.mandatory
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.mandatory ? 'Mandatory' : 'Optional / Conditional'}
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</h2>
                {item.sourceQuote && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Source wording: "{item.sourceQuote}"
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.notes}</p>
                )}
              </div>

              <div className="shrink-0">
                <label className="sr-only" htmlFor={`req-status-${item.id}`}>
                  Status for {item.name}
                </label>
                <select
                  id={`req-status-${item.id}`}
                  value={item.status}
                  onChange={(e) =>
                    void updateRequirementStatus(
                      activeDoc.id,
                      item.id,
                      e.target.value as RequirementStatus
                    )
                  }
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
