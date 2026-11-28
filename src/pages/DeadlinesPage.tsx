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

function getDateParts(isoDate?: string): { month: string; day: string } | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [yr, mo, dy] = isoDate.split('-').map(Number);
  const d = new Date(yr, mo - 1, dy);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(dy).padStart(2, '0'),
  };
}

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

  const datedEvents = deadlines.filter((d) => Boolean(d.isoDate));
  const undatedEvents = deadlines.filter((d) => !d.isoDate);

  const groupedByMonth = datedEvents.reduce<Record<string, DeadlineEvent[]>>((acc, ev) => {
    const monthKey = ev.isoDate!.slice(0, 7);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(ev);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)]">{activeDoc.title}</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
            Deadline Intelligence
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Dates are extracted strictly from source wording. Ambiguous windows are flagged for verification.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="grid grid-cols-2 sm:inline-flex p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 min-h-[36px] py-1.5 text-xs font-medium rounded-md transition-settle ${
                viewMode === 'timeline'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 min-h-[36px] py-1.5 text-xs font-medium rounded-md transition-settle ${
                viewMode === 'calendar'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-settle whitespace-nowrap"
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
        <div className="rounded-2xl border border-dashed border-[var(--border-hairline)] bg-[var(--bg-surface)] p-10 sm:p-12 text-center">
          <CalendarClock className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">No deadlines extracted yet</p>
          <p className="text-xs text-[var(--text-muted)]">
            Click Extract Deadlines to identify application cutoffs, payment dates, verification windows, and exams.
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="rounded-2xl surface-sheet divide-y divide-[var(--border-hairline)] overflow-hidden">
          {deadlines.map((dl) => {
            const parts = getDateParts(dl.isoDate);
            return (
              <div
                key={dl.id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-[var(--bg-canvas)]/50 transition-settle"
              >
                <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                  {/* Calendar Date Tile */}
                  <div className="w-12 h-12 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] flex flex-col items-center justify-center shrink-0">
                    {parts ? (
                      <>
                        <span className="text-[10px] font-mono font-semibold text-[var(--accent-primary)] leading-none">
                          {parts.month}
                        </span>
                        <span className="font-mono text-base font-bold text-[var(--text-primary)] tabular-nums leading-tight mt-0.5">
                          {parts.day}
                        </span>
                      </>
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-[var(--accent-primary)] tabular-nums">
                        {dl.dateText}
                      </span>
                      <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                      <span className="capitalize text-[var(--text-muted)]">{dl.category}</span>
                      {dl.needsVerification && (
                        <>
                          <span aria-hidden="true" className="text-[var(--text-muted)]">·</span>
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Verify directly
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">{dl.title}</h2>
                    {dl.sourceQuote && (
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        "{dl.sourceQuote}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={dl.addedToTasks}
                  onClick={() => void handleAddReminder(dl)}
                  className={`w-full sm:w-auto min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium shrink-0 transition-settle ${
                    dl.addedToTasks
                      ? 'border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  {dl.addedToTasks ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Added to Tasks
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Add Reminder
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            {Object.entries(groupedByMonth)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([monthKey, events]) => {
                const [yr, mo] = monthKey.split('-').map(Number);
                const monthLabel = new Date(yr, mo - 1, 1).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                });
                const firstDayIdx = new Date(yr, mo - 1, 1).getDay();
                const daysInMonth = new Date(yr, mo, 0).getDate();
                const eventDays = new Set(
                  events.map((e) => Number(e.isoDate?.split('-')[2]))
                );

                return (
                  <div key={monthKey} className="rounded-2xl surface-sheet p-5 space-y-4">
                    <h2 className="font-display text-sm font-bold pb-2.5 border-b border-[var(--border-hairline)]">
                      {monthLabel}
                    </h2>

                    {/* Mini Month Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono tabular-nums">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span key={i} className="text-[var(--text-muted)] py-1 font-medium">
                          {d}
                        </span>
                      ))}
                      {Array.from({ length: firstDayIdx }).map((_, idx) => (
                        <span key={`empty_${idx}`} />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const dayNum = idx + 1;
                        const hasEvent = eventDays.has(dayNum);
                        return (
                          <span
                            key={dayNum}
                            className={`py-1 rounded-md ${
                              hasEvent
                                ? 'bg-[#111318] dark:bg-[#4F46E5] text-white font-semibold'
                                : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            {dayNum}
                          </span>
                        );
                      })}
                    </div>

                    <ul className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
                      {events.map((ev) => (
                        <li key={ev.id} className="flex items-start justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] truncate">
                              {ev.title}
                            </p>
                            <p className="text-[var(--text-muted)] capitalize">{ev.category}</p>
                          </div>
                          <span className="font-mono tabular-nums text-[var(--accent-primary)] shrink-0">
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
            <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-2">
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
