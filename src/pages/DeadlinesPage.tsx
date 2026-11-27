import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Calendar as CalendarIcon,
  List,
  AlertTriangle,
  Plus,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useHybridRunner } from '../hooks/useHybridRunner';
import { extractDocumentDeadlines } from '../services/hybridAIService';
import type { ActionTask, DeadlineEvent } from '../types';

export default function DeadlinesPage() {
  const {
    user,
    activeDoc,
    deadlines,
    tasks,
    preferences,
    remoteConfig,
    replaceDeadlines,
    addTask,
    markDeadlineAddedToTask,
  } = useApp();
  const { executeTrackedTask } = useHybridRunner();

  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [extracting, setExtracting] = useState(false);
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

  const handleExtract = async () => {
    if (!activeDoc.extractedText) {
      setError('No extracted text available for this document.');
      return;
    }
    setError(null);
    setExtracting(true);
    try {
      const res = await executeTrackedTask({
        operation: 'deadlines',
        docId: activeDoc.id,
        docTitle: activeDoc.title,
        requestedMode: preferences.defaultInferenceMode,
        consentReason: `Extract deadlines and dates from "${activeDoc.title}".`,
        run: async (effectiveMode) => {
          const out = await extractDocumentDeadlines({
            userId: user?.uid || 'guest',
            docId: activeDoc.id,
            documentText: activeDoc.extractedText || '',
            mode: effectiveMode,
            remoteConfig,
          });
          return { data: out.deadlines, meta: out.meta };
        },
      });
      if (res) {
        await replaceDeadlines(activeDoc.id, res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deadline extraction failed.');
    } finally {
      setExtracting(false);
    }
  };

  const handleAddReminder = async (dl: DeadlineEvent) => {
    const newTask: ActionTask = {
      id: `task_dl_${Date.now()}`,
      userId: user?.uid || 'guest',
      docId: activeDoc.id,
      title: `Reminder: ${dl.title}`,
      description: dl.sourceQuote || `Category: ${dl.category}`,
      priority: dl.category === 'payment' || dl.category === 'application' ? 'high' : 'medium',
      completed: false,
      deadline: dl.dateText,
      sourceReference: dl.sourceQuote || 'Extracted deadline',
      order: tasks.length + 1,
    };
    await addTask(newTask);
    await markDeadlineAddedToTask(activeDoc.id, dl.id);
  };

  // Group dated events by month for the Calendar Grid view
  const datedEvents = deadlines.filter((d) => Boolean(d.isoDate));
  const undatedEvents = deadlines.filter((d) => !d.isoDate);

  const groupedByMonth = datedEvents.reduce<Record<string, DeadlineEvent[]>>((acc, ev) => {
    const monthKey = ev.isoDate!.slice(0, 7); // YYYY-MM
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(ev);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{activeDoc.title}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Deadline Intelligence</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dates are extracted strictly from source wording. Ambiguous dates are flagged for manual verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
          </div>

          <button
            type="button"
            disabled={extracting}
            onClick={() => void handleExtract()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {extracting ? 'Extracting Dates...' : deadlines.length > 0 ? 'Re-scan Dates' : 'Extract Deadlines'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {deadlines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-12 text-center">
          <CalendarClock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No deadlines extracted yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click Extract Deadlines to identify application cutoffs, payment dates, verification windows, and exams.
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-3">
          {deadlines.map((dl) => (
            <div
              key={dl.id}
              className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 flex flex-wrap items-start justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-semibold text-violet-700 dark:text-violet-400 tabular-nums">
                    {dl.dateText}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="capitalize text-slate-500 dark:text-slate-400">{dl.category}</span>
                  {dl.needsVerification && (
                    <>
                      <span aria-hidden="true" className="text-slate-400">·</span>
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Ambiguous / Verify directly
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">{dl.title}</h2>
                {dl.sourceQuote && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">"{dl.sourceQuote}"</p>
                )}
              </div>

              <button
                type="button"
                disabled={dl.addedToTasks}
                onClick={() => void handleAddReminder(dl)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 ${
                  dl.addedToTasks
                    ? 'border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                    : 'border border-[var(--border-hairline)] hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {dl.addedToTasks ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Added to Tasks
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Add Task Reminder
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(groupedByMonth)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([monthKey, events]) => {
                const [yr, mo] = monthKey.split('-').map(Number);
                const monthLabel = new Date(yr, mo - 1, 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                });
                return (
                  <div
                    key={monthKey}
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3"
                  >
                    <h2 className="font-display text-sm font-bold border-b border-[var(--border-hairline)] pb-2">
                      {monthLabel}
                    </h2>
                    <ul className="space-y-2.5">
                      {events.map((ev) => (
                        <li key={ev.id} className="flex items-start justify-between gap-3 text-xs">
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{ev.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 capitalize">{ev.category}</p>
                          </div>
                          <span className="font-mono tabular-nums text-violet-700 dark:text-violet-400 shrink-0">
                            {ev.isoDate}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>

          {undatedEvents.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-2">
              <h3 className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Dates Without Exact Calendar Day (Needs Verification)
              </h3>
              <ul className="space-y-1.5 text-xs text-amber-900/90 dark:text-amber-200">
                {undatedEvents.map((ev) => (
                  <li key={ev.id}>
                    <span className="font-medium">{ev.title}:</span> {ev.dateText}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
