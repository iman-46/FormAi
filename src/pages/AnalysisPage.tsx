import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  CheckSquare,
  CalendarClock,
  ClipboardCheck,
  MessageSquareText,
  Cpu,
  Cloud,
  AlertCircle,
  FileText,
  Languages,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useHybridRunner } from '../hooks/useHybridRunner';
import {
  generateSummaryAndSimplification,
  generateActionPlanItems,
  extractDocumentDeadlines,
  extractDocumentRequirements,
} from '../services/hybridAIService';
import { AIStatusBadge } from '../components/ai/AIStatusBadge';
import type {
  HybridInferenceMode,
  SimplificationLevel,
  SupportedLanguage,
  WorkspaceDocument,
} from '../types';

export default function AnalysisPage() {
  const {
    user,
    activeDoc,
    tasks,
    deadlines,
    requirements,
    preferences,
    remoteConfig,
    addOrUpdateDocument,
    replaceActionPlan,
    replaceDeadlines,
    replaceRequirements,
  } = useApp();
  const { executeTrackedTask } = useHybridRunner();

  const [level, setLevel] = useState<SimplificationLevel>(
    activeDoc?.simplificationLevel || 'standard'
  );
  const [language, setLanguage] = useState<SupportedLanguage>(
    (activeDoc?.simplifiedLanguage as SupportedLanguage) || preferences.preferredLanguage
  );
  const [inferenceMode, setInferenceMode] = useState<HybridInferenceMode>(
    preferences.defaultInferenceMode
  );
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!activeDoc) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center max-w-2xl mx-auto">
        <FileText className="w-9 h-9 text-[var(--text-muted)] mx-auto mb-3" />
        <h1 className="font-display text-xl font-bold mb-1.5">No Document Selected</h1>
        <p className="text-xs text-[var(--text-muted)] mb-5 max-w-md mx-auto">
          Upload a document or load the fictional competition demo notice to run hybrid AI simplification and workflow extraction.
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold"
        >
          Upload or Load Demo
        </Link>
      </div>
    );
  }

  const runSimplifier = async (overrideMode?: HybridInferenceMode) => {
    if (!activeDoc.extractedText) {
      setError('This document has no extracted text yet. Run Cloud OCR on the Upload page first.');
      return;
    }
    setError(null);
    setRunningStep('simplifier');
    const chosenMode = overrideMode ?? inferenceMode;

    try {
      const res = await executeTrackedTask({
        operation: language === 'Simple English' ? 'simplify' : 'translate',
        docId: activeDoc.id,
        docTitle: activeDoc.title,
        requestedMode: chosenMode,
        consentReason: `Analyze and simplify "${activeDoc.title}" in ${language}. If Chrome's on-device model is unavailable, Firebase AI Logic will fall back to cloud inference.`,
        run: async (effectiveMode) => {
          const out = await generateSummaryAndSimplification({
            documentText: activeDoc.extractedText || '',
            level,
            language,
            mode: effectiveMode,
            remoteConfig,
          });
          return { data: out, meta: out.meta };
        },
      });

      if (res) {
        const updated: WorkspaceDocument = {
          ...activeDoc,
          summary: res.data.summary,
          simplifiedClauses: res.data.clauses,
          simplificationLevel: level,
          simplifiedLanguage: language,
          lastInferenceSource: res.meta.inferenceSource,
        };
        await addOrUpdateDocument(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simplification failed.');
    } finally {
      setRunningStep(null);
    }
  };

  const runFullSuite = async () => {
    if (!activeDoc.extractedText) {
      setError('This document has no extracted text yet.');
      return;
    }
    setError(null);
    const uid = user?.uid || 'guest';

    try {
      setRunningStep('Simplifying clauses...');
      await runSimplifier();

      setRunningStep('Generating action plan...');
      const planRes = await executeTrackedTask({
        operation: 'action_plan',
        docId: activeDoc.id,
        docTitle: activeDoc.title,
        requestedMode: inferenceMode,
        consentReason: `Generate ordered action plan steps from "${activeDoc.title}".`,
        run: async (effectiveMode) => {
          const out = await generateActionPlanItems({
            userId: uid,
            docId: activeDoc.id,
            documentText: activeDoc.extractedText || '',
            mode: effectiveMode,
            remoteConfig,
          });
          return { data: out.tasks, meta: out.meta };
        },
      });
      if (planRes) {
        await replaceActionPlan(activeDoc.id, planRes.data);
      }

      setRunningStep('Extracting deadlines...');
      const dlRes = await executeTrackedTask({
        operation: 'deadlines',
        docId: activeDoc.id,
        docTitle: activeDoc.title,
        requestedMode: inferenceMode,
        consentReason: `Extract verified dates and timelines from "${activeDoc.title}".`,
        run: async (effectiveMode) => {
          const out = await extractDocumentDeadlines({
            userId: uid,
            docId: activeDoc.id,
            documentText: activeDoc.extractedText || '',
            mode: effectiveMode,
            remoteConfig,
          });
          return { data: out.deadlines, meta: out.meta };
        },
      });
      if (dlRes) {
        await replaceDeadlines(activeDoc.id, dlRes.data);
      }

      setRunningStep('Checking required documents...');
      const reqRes = await executeTrackedTask({
        operation: 'requirements',
        docId: activeDoc.id,
        docTitle: activeDoc.title,
        requestedMode: inferenceMode,
        consentReason: `Identify mandatory vs optional supporting documents in "${activeDoc.title}".`,
        run: async (effectiveMode) => {
          const out = await extractDocumentRequirements({
            userId: uid,
            docId: activeDoc.id,
            documentText: activeDoc.extractedText || '',
            mode: effectiveMode,
            remoteConfig,
          });
          return { data: out.requirements, meta: out.meta };
        },
      });
      if (reqRes) {
        await replaceRequirements(activeDoc.id, reqRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Workflow extraction encountered an error.');
    } finally {
      setRunningStep(null);
    }
  };

  const handleCopySummary = async () => {
    if (!activeDoc.summary) return;
    await navigator.clipboard.writeText(activeDoc.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)] tabular-nums">
            {activeDoc.fileName} · {activeDoc.pageCount}{' '}
            {activeDoc.pageCount === 1 ? 'page' : 'pages'}
            {activeDoc.isDemo ? ' · Fictional Demo' : ''}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
            {activeDoc.title}
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowRawText((v) => !v)}
            className="min-h-[42px] px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap text-center"
          >
            {showRawText ? 'Hide Source' : 'Source Text'}
          </button>
          <button
            type="button"
            disabled={Boolean(runningStep)}
            onClick={() => void runFullSuite()}
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-settle whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{runningStep ? runningStep : 'Analyze All'}</span>
          </button>
        </div>
      </div>

      <AIStatusBadge />

      {/* Control Toolbar */}
      <div className="rounded-xl surface-sheet p-4 sm:p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="grid sm:flex sm:flex-wrap items-end gap-4 w-full lg:w-auto">
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">
              Explanation Level
            </label>
            <div className="grid grid-cols-3 sm:inline-flex p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] w-full sm:w-auto">
              {(
                [
                  ['very_simple', 'Very Simple'],
                  ['standard', 'Standard'],
                  ['detailed', 'Detailed'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setLevel(val)}
                  className={`px-2 sm:px-3 min-h-[36px] py-1.5 text-xs font-medium rounded-md transition-settle whitespace-nowrap text-center ${
                    level === val
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto">
            <div className="min-w-0">
              <label
                htmlFor="lang-select"
                className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5"
              >
                Output Language
              </label>
              <div className="relative">
                <Languages className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-3" />
                <select
                  id="lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                  className="w-full min-h-[40px] pl-8 pr-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {remoteConfig.supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="mode-select"
                className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5"
              >
                Inference Mode
              </label>
              <select
                id="mode-select"
                value={inferenceMode}
                onChange={(e) => setInferenceMode(e.target.value as HybridInferenceMode)}
                className="w-full min-h-[40px] px-3 py-2 text-xs font-medium rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="prefer_on_device">PREFER_ON_DEVICE</option>
                <option value="only_on_device">ONLY_ON_DEVICE</option>
                <option value="prefer_in_cloud">PREFER_IN_CLOUD</option>
                <option value="only_in_cloud">ONLY_IN_CLOUD</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={Boolean(runningStep)}
          onClick={() => void runSimplifier()}
          className="w-full lg:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-xs font-semibold disabled:opacity-60 transition-settle whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${runningStep === 'simplifier' ? 'animate-spin' : ''}`} />
          {activeDoc.summary ? 'Regenerate Explanation' : 'Simplify Document'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {showRawText && (
        <section className="rounded-xl surface-sheet p-5">
          <h2 className="font-display text-sm font-bold mb-2.5">Extracted Source Text</h2>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-lg p-4 max-h-72 overflow-y-auto text-[var(--text-secondary)]">
            {activeDoc.extractedText || 'No extracted text available.'}
          </pre>
        </section>
      )}

      {/* Executive Summary Sheet */}
      {activeDoc.summary ? (
        <section className="rounded-2xl surface-sheet p-6 sm:p-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <h2 className="font-display text-base font-bold">Plain-Language Summary</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-mono">
                {activeDoc.lastInferenceSource === 'on_device' ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Cpu className="w-3.5 h-3.5" />
                    ON_DEVICE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[var(--accent-primary)]">
                    <Cloud className="w-3.5 h-3.5" />
                    IN_CLOUD
                  </span>
                )}
              </span>
              <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
              <span className="text-[var(--text-muted)]">
                {activeDoc.simplifiedLanguage || 'Simple English'}
              </span>
              <button
                type="button"
                onClick={() => void handleCopySummary()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--border-hairline)] hover:bg-[var(--bg-subtle)] text-xs transition-settle"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-[15px] text-[var(--text-primary)] leading-[1.7] max-w-4xl pt-1">
            {activeDoc.summary}
          </p>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <p className="text-sm font-semibold mb-1">Ready to simplify and extract workflows</p>
          <p className="text-xs text-[var(--text-muted)] mb-5 max-w-md mx-auto">
            Click Simplify Document to summarize clauses using your selected inference mode, or click Analyze Full Document to populate your Action Plan, Deadlines, and Checklist.
          </p>
          <button
            type="button"
            disabled={Boolean(runningStep)}
            onClick={() => void runSimplifier()}
            className="px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle"
          >
            Simplify Document Now
          </button>
        </div>
      )}

      {/* Side-by-Side Clause Breakdown */}
      {activeDoc.simplifiedClauses && activeDoc.simplifiedClauses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold">Clause-by-Clause Breakdown</h2>
            <span className="text-xs text-[var(--text-muted)] tabular-nums">
              {activeDoc.simplifiedClauses.length} sections explained
            </span>
          </div>

          <div className="rounded-2xl surface-sheet divide-y divide-[var(--border-hairline)] overflow-hidden">
            {activeDoc.simplifiedClauses.map((clause, idx) => (
              <article key={idx} className="p-6 sm:p-7 space-y-4">
                <p className="font-mono text-xs font-semibold text-[var(--accent-primary)]">
                  {clause.sectionReference || `Clause ${idx + 1}`}
                </p>

                <div className="grid md:grid-cols-12 gap-6">
                  <div className="md:col-span-5">
                    <h3 className="text-[11px] font-medium text-[var(--text-muted)] mb-2">
                      Original Wording
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-xl p-4">
                      {clause.originalClause}
                    </p>
                  </div>

                  <div className="md:col-span-7 flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="text-[11px] font-medium text-[var(--text-muted)] mb-1.5">
                        Plain-Language Explanation
                      </h3>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {clause.simplifiedExplanation}
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-hairline)] text-xs">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] mb-0.5">Why it matters</p>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          {clause.whyItMatters}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                          What you should do
                        </p>
                        <p className="text-[var(--text-secondary)] leading-relaxed">
                          {clause.whatUserShouldDo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Workflow Next Steps Strip */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <Link
          to="/action-plans"
          className="rounded-xl surface-sheet p-4 hover:border-indigo-400 transition-settle flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Action Plan</p>
              <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {tasks.length} {tasks.length === 1 ? 'step' : 'steps'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        </Link>

        <Link
          to="/deadlines"
          className="rounded-xl surface-sheet p-4 hover:border-indigo-400 transition-settle flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Deadlines</p>
              <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {deadlines.length} {deadlines.length === 1 ? 'date' : 'dates'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        </Link>

        <Link
          to="/checklist"
          className="rounded-xl surface-sheet p-4 hover:border-indigo-400 transition-settle flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Document Checklist</p>
              <p className="text-[11px] text-[var(--text-muted)] tabular-nums">
                {requirements.length} {requirements.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        </Link>

        <Link
          to="/ask-ai"
          className="rounded-xl surface-sheet p-4 hover:border-indigo-400 transition-settle flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <MessageSquareText className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Ask Your Document</p>
              <p className="text-[11px] text-[var(--text-muted)]">Multi-turn Q&amp;A</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
        </Link>
      </section>
    </div>
  );
}
