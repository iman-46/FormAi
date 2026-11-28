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
  { value: 'needs_verification', label: 'Verify' },
  { value: 'not_applicable', label: 'N/A' },
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
  const [filter, setFilter] = useState<'all' | 'mandatory' | 'missing'>('all');

  if (!activeDoc) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center max-w-xl mx-auto">
        <p className="text-sm font-semibold mb-2">Select or upload a document first</p>
        <Link
          to="/upload"
          className="inline-flex px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold"
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
  const missingCount = requirements.filter((r) => r.status === 'missing').length;

  const visibleItems = requirements.filter((item) => {
    if (filter === 'mandatory') return item.mandatory;
    if (filter === 'missing') return item.status === 'missing';
    return true;
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)]">{activeDoc.title}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
            Document Requirement Checker
          </h1>
        </div>

        <button
          type="button"
          disabled={scanning}
          onClick={() => void handleScan()}
          className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-settle shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {scanning ? 'Scanning Requirements...' : requirements.length > 0 ? 'Re-scan Documents' : 'Extract Required Documents'}
        </button>
      </div>

      {requirements.length > 0 && (
        <div className="rounded-xl surface-sheet p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-5 gap-y-2 text-xs tabular-nums">
            <div>
              <span className="text-[var(--text-muted)]">Detected: </span>
              <span className="font-mono font-semibold">{requirements.length}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Mandatory: </span>
              <span className="font-mono font-semibold text-rose-700 dark:text-rose-400">
                {mandatoryCount}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Available: </span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {readyCount}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Missing: </span>
              <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                {missingCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
            {(
              [
                ['all', 'All'],
                ['mandatory', 'Mandatory'],
                ['missing', 'Missing'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilter(val)}
                className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-settle whitespace-nowrap text-center ${
                  filter === val
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {requirements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 sm:p-12 text-center">
          <ClipboardCheck className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">No supporting documents listed yet</p>
          <p className="text-xs text-[var(--text-muted)]">
            Scan your document to separate mandatory certificates and IDs from optional or conditional items.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl surface-sheet divide-y divide-[var(--border-hairline)] overflow-hidden">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 sm:gap-4 hover:bg-[var(--bg-canvas)]/40 transition-settle"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p
                  className={`text-xs font-semibold ${
                    item.mandatory
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {item.mandatory ? 'Mandatory Requirement' : 'Optional / Conditional'}
                </p>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</h2>
                {item.sourceQuote && (
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Source wording: "{item.sourceQuote}"
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs text-[var(--text-secondary)]">{item.notes}</p>
                )}
              </div>

              <div
                className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] shrink-0"
                role="group"
                aria-label={`Status for ${item.name}`}
              >
                {STATUS_OPTIONS.map((opt) => {
                  const active = item.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        void updateRequirementStatus(activeDoc.id, item.id, opt.value)
                      }
                      className={`min-h-[38px] px-2 sm:px-2.5 py-1.5 text-xs font-medium rounded-md transition-settle whitespace-nowrap text-center ${
                        active
                          ? opt.value === 'available'
                            ? 'bg-emerald-600 text-white'
                            : opt.value === 'missing'
                              ? 'bg-rose-600 text-white'
                              : opt.value === 'needs_verification'
                                ? 'bg-amber-600 text-white'
                                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
