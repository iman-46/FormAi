import { useState } from 'react';
import { GitCompareArrows, Cloud, Play, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useHybridRunner } from '../hooks/useHybridRunner';
import { compareTwoDocuments } from '../services/hybridAIService';
import type { DocumentComparison } from '../types';

export default function ComparePage() {
  const {
    user,
    documents,
    comparisons,
    remoteConfig,
    saveComparison,
    loadCompetitionDemo,
  } = useApp();
  const { executeTrackedTask } = useHybridRunner();

  const [docAId, setDocAId] = useState<string>(documents[0]?.id || '');
  const [docBId, setDocBId] = useState<string>(documents[1]?.id || '');
  const [activeComparison, setActiveComparison] = useState<DocumentComparison | null>(
    comparisons[0] || null
  );
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedA = documents.find((d) => d.id === docAId) || documents[0];
  const selectedB = documents.find((d) => d.id === docBId) || documents[1];

  const handleSwap = () => {
    const prevA = selectedA?.id || '';
    const prevB = selectedB?.id || '';
    setDocAId(prevB);
    setDocBId(prevA);
  };

  const handleCompare = async () => {
    if (!selectedA || !selectedB) {
      setError('Select two documents to compare.');
      return;
    }
    if (selectedA.id === selectedB.id) {
      setError('Please choose two different documents.');
      return;
    }
    if (!selectedA.extractedText || !selectedB.extractedText) {
      setError('Both documents must have extracted text before comparing.');
      return;
    }

    setError(null);
    setRunning(true);
    try {
      const res = await executeTrackedTask({
        operation: 'compare',
        docId: selectedA.id,
        docTitle: `${selectedA.title} vs ${selectedB.title}`,
        requestedMode: 'only_in_cloud',
        requiresCloud: true,
        consentReason: `Comparing "${selectedA.title}" and "${selectedB.title}" requires Cloud Gemini reasoning via Firebase AI Logic.`,
        run: async () => {
          const out = await compareTwoDocuments({
            userId: user?.uid || 'guest',
            docAId: selectedA.id,
            docATitle: selectedA.title,
            docAText: selectedA.extractedText || '',
            docBId: selectedB.id,
            docBTitle: selectedB.title,
            docBText: selectedB.extractedText || '',
            remoteConfig,
          });
          return { data: out.comparison, meta: out.meta };
        },
      });

      if (res) {
        await saveComparison(res.data);
        setActiveComparison(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document comparison failed.');
    } finally {
      setRunning(false);
    }
  };

  const handleLoadDemoPair = async () => {
    await loadCompetitionDemo(true);
    setDocAId('demo_nit_admission_2027');
    setDocBId('demo_nit_addendum_2027');
  };

  const displayed = activeComparison || comparisons[0] || null;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Document Comparison
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Compare two versions or addenda using Cloud AI to detect changed deadlines, fee updates, and conflicting instructions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleLoadDemoPair()}
          className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap shrink-0"
        >
          <Play className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          Load Demo Notice + Addendum
        </button>
      </div>

      {!remoteConfig.enableDocumentCompare && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-800 dark:text-amber-300">
          Document comparison is currently disabled via Firebase Remote Config.
        </div>
      )}

      {/* Selector Bar */}
      <div className="rounded-2xl surface-sheet p-4 sm:p-5 grid md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4">
          <label htmlFor="compare-doc-a" className="block text-xs font-medium mb-1.5">
            Document A (Baseline)
          </label>
          <select
            id="compare-doc-a"
            value={selectedA?.id || ''}
            onChange={(e) => setDocAId(e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
          >
            {documents.length === 0 && <option value="">No documents available</option>}
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap baseline and revised documents"
            aria-label="Swap documents"
            className="w-full md:w-auto min-h-[40px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] transition-settle"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="md:hidden text-xs font-medium">Swap Baseline &amp; Revised</span>
          </button>
        </div>

        <div className="md:col-span-5">
          <label htmlFor="compare-doc-b" className="block text-xs font-medium mb-1.5">
            Document B (Revised / Addendum)
          </label>
          <select
            id="compare-doc-b"
            value={selectedB?.id || ''}
            onChange={(e) => setDocBId(e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
          >
            {documents.length === 0 && <option value="">No documents available</option>}
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <button
            type="button"
            disabled={running || documents.length < 2 || !remoteConfig.enableDocumentCompare}
            onClick={() => void handleCompare()}
            className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-settle whitespace-nowrap"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            {running ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {displayed ? (
        <div className="space-y-4">
          <div className="rounded-xl surface-sheet px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[var(--text-primary)]">
              {displayed.docATitle} <span className="text-[var(--text-muted)] font-normal">vs.</span>{' '}
              {displayed.docBTitle}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[var(--accent-primary)]">
              <Cloud className="w-3.5 h-3.5" />
              {displayed.inferenceSource.toUpperCase()}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <ComparisonSection title="Changed Deadlines" items={displayed.changedDeadlines} tone="amber" />
            <ComparisonSection title="Conflicting Instructions" items={displayed.conflictingInstructions} tone="rose" />
            <ComparisonSection title="Different Requirements" items={displayed.differentRequirements} tone="blue" />
            <ComparisonSection title="Important Changes" items={displayed.importantChanges} tone="indigo" />
            <ComparisonSection title="Key Differences" items={displayed.differences} tone="slate" />
            <ComparisonSection title="Similarities" items={displayed.similarities} tone="emerald" />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center">
          <GitCompareArrows className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">No comparisons run yet</p>
          <p className="text-xs text-[var(--text-muted)]">
            Upload two documents or click Load Demo Notice + Addendum to compare original rules against revised instructions.
          </p>
        </div>
      )}
    </div>
  );
}

function ComparisonSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'amber' | 'rose' | 'blue' | 'indigo' | 'slate' | 'emerald';
}) {
  const titleColors: Record<typeof tone, string> = {
    amber: 'text-amber-700 dark:text-amber-400',
    rose: 'text-rose-700 dark:text-rose-400',
    blue: 'text-blue-700 dark:text-blue-400',
    indigo: 'text-[var(--accent-primary)]',
    slate: 'text-[var(--text-primary)]',
    emerald: 'text-emerald-700 dark:text-emerald-400',
  };

  return (
    <section className="rounded-xl surface-sheet p-5">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-hairline)]">
        <h2 className={`font-display text-sm font-bold ${titleColors[tone]}`}>{title}</h2>
        <span className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">None identified between these documents.</p>
      ) : (
        <ul className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
          {items.map((item, idx) => (
            <li key={idx}>• {item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
