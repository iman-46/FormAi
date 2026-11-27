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

  if (!activeDoc) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center max-w-2xl mx-auto">
        <FileText className="w-9 h-9 text-slate-400 mx-auto mb-3" />
        <h1 className="font-display text-xl font-bold mb-1.5">No Document Selected</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Upload a document or load the fictional competition demo notice to run hybrid AI simplification and workflow extraction.
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {activeDoc.fileName} · {activeDoc.pageCount} pages
            {activeDoc.isDemo ? ' · Fictional Competition Demo Document' : ''}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight mt-0.5">{activeDoc.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowRawText((v) => !v)}
            className="px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            {showRawText ? 'Hide Source Text' : 'View Source Text'}
          </button>
          <button
            type="button"
            disabled={Boolean(runningStep)}
            onClick={() => void runFullSuite()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {runningStep ? runningStep : 'Analyze Everything (Summary + Plan + Dates + Docs)'}
          </button>
        </div>
      </div>

      <AIStatusBadge />

      {/* Control Toolbar */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Explanation Level
            </label>
            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-[var(--border-hairline)]">
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
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    level === val
                      ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-xs'
                      : 'text-slate-500 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="lang-select" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Output Language
            </label>
            <div className="relative">
              <Languages className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <select
                id="lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                className="pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {remoteConfig.supportedLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mode-select" className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Firebase AI Inference Mode
            </label>
            <select
              id="mode-select"
              value={inferenceMode}
              onChange={(e) => setInferenceMode(e.target.value as HybridInferenceMode)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="prefer_on_device">PREFER_ON_DEVICE (Hybrid Fallback)</option>
              <option value="only_on_device">ONLY_ON_DEVICE (Strict Local Test)</option>
              <option value="prefer_in_cloud">PREFER_IN_CLOUD</option>
              <option value="only_in_cloud">ONLY_IN_CLOUD</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          disabled={Boolean(runningStep)}
          onClick={() => void runSimplifier()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold disabled:opacity-60 whitespace-nowrap"
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
        <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
          <h2 className="font-display text-sm font-semibold mb-2">Extracted Source Text</h2>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-lg p-4 max-h-72 overflow-y-auto text-slate-700 dark:text-slate-300">
            {activeDoc.extractedText || 'No extracted text available.'}
          </pre>
        </section>
      )}

      {/* Summary & Last Inference Source */}
      {activeDoc.summary ? (
        <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-semibold">Plain-Language Summary</h2>
            <div className="flex items-center gap-2 text-xs font-mono">
              {activeDoc.lastInferenceSource === 'on_device' ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Cpu className="w-3.5 h-3.5" />
                  ON_DEVICE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-violet-700 dark:text-violet-400">
                  <Cloud className="w-3.5 h-3.5" />
                  IN_CLOUD
                </span>
              )}
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400">
                {activeDoc.simplifiedLanguage || 'Simple English'}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-4xl">
            {activeDoc.summary}
          </p>
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 text-center">
          <p className="text-sm font-medium mb-1">Ready to simplify and extract workflows</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
            Click Simplify Document to summarize clauses using your selected inference mode, or run Analyze Everything to populate your Action Plan, Deadlines, and Requirement Checklist at once.
          </p>
          <button
            type="button"
            disabled={Boolean(runningStep)}
            onClick={() => void runSimplifier()}
            className="px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
          >
            Simplify Document Now
          </button>
        </div>
      )}

      {/* Simplified Clauses Breakdown */}
      {activeDoc.simplifiedClauses && activeDoc.simplifiedClauses.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-base font-semibold">Clause-by-Clause Breakdown</h2>
          <div className="grid gap-4">
            {activeDoc.simplifiedClauses.map((clause, idx) => (
              <article
                key={idx}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-4"
              >
                <p className="text-xs font-mono text-violet-700 dark:text-violet-400">
                  {clause.sectionReference || `Clause ${idx + 1}`}
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      Original Clause
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-lg p-3.5">
                      {clause.originalClause}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      Simplified Explanation
                    </h3>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                      {clause.simplifiedExplanation}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-3 border-t border-[var(--border-hairline)] text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Why it matters: </span>
                    <span className="text-slate-600 dark:text-slate-300">{clause.whyItMatters}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">What you should do: </span>
                    <span className="text-slate-600 dark:text-slate-300">{clause.whatUserShouldDo}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Quick Module Navigation Links */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <Link
          to="/action-plans"
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 hover:border-violet-400 transition-colors flex items-center gap-3"
        >
          <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Action Plan</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Manage step-by-step tasks</p>
          </div>
        </Link>
        <Link
          to="/deadlines"
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 hover:border-violet-400 transition-colors flex items-center gap-3"
        >
          <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Deadlines</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Timeline &amp; calendar view</p>
          </div>
        </Link>
        <Link
          to="/checklist"
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 hover:border-violet-400 transition-colors flex items-center gap-3"
        >
          <ClipboardCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Document Checklist</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Mandatory vs optional proof</p>
          </div>
        </Link>
        <Link
          to="/ask-ai"
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 hover:border-violet-400 transition-colors flex items-center gap-3"
        >
          <MessageSquareText className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold">Ask Your Document</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Multi-turn grounded Q&amp;A</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
