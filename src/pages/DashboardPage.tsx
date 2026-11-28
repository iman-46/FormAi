import { Link, useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckSquare,
  CalendarClock,
  ArrowRight,
  Play,
  Cpu,
  Cloud,
  Sparkles,
  MessageSquareText,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AIStatusBadge } from '../components/ai/AIStatusBadge';
import { formatBytes } from '../services/documentService';

export default function DashboardPage() {
  const {
    user,
    documents,
    activeDoc,
    allTasksByDoc,
    allDeadlinesByDoc,
    aiLogs,
    setActiveDocId,
    loadCompetitionDemo,
  } = useApp();
  const navigate = useNavigate();

  const allTasks = Object.values(allTasksByDoc).flat();
  const pendingTasks = allTasks.filter((t) => !t.completed);
  const completedTasks = allTasks.filter((t) => t.completed);
  const allDeadlines = Object.values(allDeadlinesByDoc).flat();
  const activeWorkflows = documents.filter((d) => Boolean(d.summary)).length;
  const taskCompletionPct =
    allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

  const handleLoadDemo = async () => {
    await loadCompetitionDemo(true);
    navigate('/analysis');
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Track analyzed paperwork, action plans, verified deadlines, and real hybrid AI inference logs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => void handleLoadDemo()}
            className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 min-h-[42px] py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            Demo Notice
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 min-h-[42px] py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" />
            Upload Document
          </Link>
        </div>
      </div>

      {/* Hybrid AI Readiness Banner */}
      <AIStatusBadge />

      {/* Unified KPI Strip (gap-px prevents broken divider lines across mobile 2-col & desktop 5-col) */}
      <div className="rounded-xl overflow-hidden border border-[var(--border-hairline)] bg-[var(--border-hairline)] grid grid-cols-2 lg:grid-cols-5 gap-px shadow-xs">
        <div className="p-4 sm:p-5 bg-[var(--bg-surface)]">
          <p className="text-xs text-[var(--text-muted)]">Total Documents</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1">
            {documents.length}
          </p>
        </div>
        <div className="p-4 sm:p-5 bg-[var(--bg-surface)]">
          <p className="text-xs text-[var(--text-muted)]">Active Workflows</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1">
            {activeWorkflows}
          </p>
        </div>
        <div className="p-4 sm:p-5 bg-[var(--bg-surface)]">
          <p className="text-xs text-[var(--text-muted)]">Pending Tasks</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1 text-amber-600 dark:text-amber-400">
            {pendingTasks.length}
          </p>
        </div>
        <div className="p-4 sm:p-5 bg-[var(--bg-surface)]">
          <p className="text-xs text-[var(--text-muted)]">Completed Tasks</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1 text-emerald-600 dark:text-emerald-400">
            {completedTasks.length}
          </p>
        </div>
        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 bg-[var(--bg-surface)]">
          <p className="text-xs text-[var(--text-muted)]">Tracked Deadlines</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1">
            {allDeadlines.length}
          </p>
        </div>
      </div>

      {/* Active Document Quick-Launch Strip */}
      {activeDoc && (
        <div className="rounded-xl surface-sheet p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[var(--accent-primary)]">
              Active Workspace Document
            </p>
            <h2 className="font-display text-base font-bold truncate mt-0.5">{activeDoc.title}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 tabular-nums truncate">
              {activeDoc.fileName} · {activeDoc.pageCount}{' '}
              {activeDoc.pageCount === 1 ? 'page' : 'pages'}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/analysis"
              className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-xs font-medium transition-settle whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              Simplify
            </Link>
            <Link
              to="/action-plans"
              className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-xs font-medium transition-settle whitespace-nowrap"
            >
              <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Action Plan
            </Link>
            <Link
              to="/checklist"
              className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-subtle)] text-xs font-medium transition-settle whitespace-nowrap"
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Checklist
            </Link>
            <Link
              to="/ask-ai"
              className="inline-flex items-center justify-center gap-1.5 px-3 min-h-[40px] py-1.5 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle whitespace-nowrap"
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              Ask AI
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Split */}
      <div className="grid lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Recent Documents */}
        <section className="lg:col-span-7 rounded-xl surface-sheet p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold">Recent Documents</h2>
            <Link
              to="/documents"
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline py-1"
            >
              View library
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="flex-1 py-10 text-center border border-dashed border-[var(--border-hairline)] rounded-xl px-4 flex flex-col items-center justify-center">
              <FileText className="w-8 h-8 text-[var(--text-muted)] mb-3" />
              <p className="text-sm font-semibold mb-1">No documents in your workspace yet</p>
              <p className="text-xs text-[var(--text-muted)] mb-5 max-w-sm">
                Upload a PDF, DOCX, or TXT file, paste text, or launch the fictional Northbridge Institute Admission Notice demo.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2.5 w-full sm:w-auto">
                <Link
                  to="/upload"
                  className="px-4 py-2.5 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold"
                >
                  Upload First Document
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLoadDemo()}
                  className="px-4 py-2.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--bg-subtle)]"
                >
                  Load Demo Notice
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {documents.slice(0, 6).map((docItem) => {
                const ext = docItem.fileName.split('.').pop()?.toUpperCase() || 'DOC';
                return (
                  <div
                    key={docItem.id}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <span className="mt-0.5 font-mono text-[10px] font-semibold text-[var(--text-muted)] w-8 shrink-0">
                        {ext}
                      </span>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDocId(docItem.id);
                            navigate('/analysis');
                          }}
                          className="text-sm font-semibold hover:text-[var(--accent-primary)] text-left truncate block w-full transition-settle"
                        >
                          {docItem.title}
                        </button>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)] mt-0.5 tabular-nums">
                          <span className="truncate max-w-[140px] sm:max-w-[180px]">{docItem.fileName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatBytes(docItem.fileSize)}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {docItem.pageCount} {docItem.pageCount === 1 ? 'p.' : 'pp.'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDocId(docItem.id);
                        navigate('/analysis');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 min-h-[38px] rounded-md text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] shrink-0 transition-settle"
                    >
                      Open
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending Actions & Upcoming Deadlines */}
        <section className="lg:col-span-5 space-y-5 sm:space-y-6">
          <div className="rounded-xl surface-sheet p-5 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-bold">Pending Actions</h2>
              <Link
                to="/action-plans"
                className="text-xs font-medium text-[var(--accent-primary)] hover:underline py-1"
              >
                Open plan
              </Link>
            </div>

            {allTasks.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1.5 tabular-nums">
                  <span>Workflow progress</span>
                  <span className="font-mono font-medium">
                    {completedTasks.length}/{allTasks.length} ({taskCompletionPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-200"
                    style={{ width: `${taskCompletionPct}%` }}
                  />
                </div>
              </div>
            )}

            {pendingTasks.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4">
                No pending action items. Open a document in Analysis to generate a step-by-step plan.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-hairline)]">
                {pendingTasks.slice(0, 4).map((task) => (
                  <li key={task.id} className="py-2.5 flex items-start gap-2.5 text-xs">
                    <CheckSquare className="w-4 h-4 text-[var(--text-muted)] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                      <p className="text-[var(--text-muted)] mt-0.5">
                        <span className="capitalize">{task.priority} priority</span>
                        {task.deadline ? ` · Due ${task.deadline}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl surface-sheet p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold">Upcoming Deadlines</h2>
              <Link
                to="/deadlines"
                className="text-xs font-medium text-[var(--accent-primary)] hover:underline py-1"
              >
                Timeline
              </Link>
            </div>
            {allDeadlines.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4">
                No extracted dates yet. Run Deadline Intelligence on any uploaded notice.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-hairline)]">
                {allDeadlines.slice(0, 4).map((dl) => (
                  <li key={dl.id} className="py-2.5 flex items-start gap-3 text-xs">
                    <div className="mt-0.5 shrink-0">
                      {dl.needsVerification ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <CalendarClock className="w-4 h-4 text-[var(--accent-primary)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text-primary)] truncate">{dl.title}</p>
                      <p className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums mt-0.5">
                        {dl.dateText}
                        {dl.needsVerification ? ' · Verify date' : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Recent AI Activity Feed: Responsive Mobile Cards + Desktop Table */}
      <section className="rounded-xl surface-sheet p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold">Recent Hybrid AI Activity</h2>
          <Link
            to="/ai-activity"
            className="text-xs font-medium text-[var(--accent-primary)] hover:underline py-1"
          >
            Full transparency log
          </Link>
        </div>

        {aiLogs.length === 0 ? (
          <div className="py-6 text-xs text-[var(--text-muted)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>
              No AI inferences recorded yet in this workspace. Run an analysis to log real SDK inference sources.
            </span>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="sm:hidden divide-y divide-[var(--border-hairline)]">
              {aiLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold capitalize text-[var(--text-primary)]">
                      {log.operation.replace('_', ' ')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${
                        log.inferenceSource === 'on_device'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : log.inferenceSource === 'error'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[var(--accent-primary)]'
                      }`}
                    >
                      {log.inferenceSource === 'on_device' ? (
                        <Cpu className="w-3 h-3" />
                      ) : (
                        <Cloud className="w-3 h-3" />
                      )}
                      {log.inferenceSource.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[var(--text-secondary)] truncate">
                    {log.docTitle || 'Workspace'}
                  </p>
                  <p className="font-mono text-[11px] text-[var(--text-muted)] tabular-nums">
                    {log.modelId} · {log.latencyMs} ms
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                    <th className="py-2.5 pr-4 font-medium">Operation</th>
                    <th className="py-2.5 pr-4 font-medium">Document</th>
                    <th className="py-2.5 pr-4 font-medium">Actual Source</th>
                    <th className="py-2.5 pr-4 font-medium">Model</th>
                    <th className="py-2.5 text-right font-medium">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {aiLogs.slice(0, 6).map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--bg-canvas)]/70 transition-settle">
                      <td className="py-3 pr-4 font-medium capitalize">
                        {log.operation.replace('_', ' ')}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)] truncate max-w-[220px]">
                        {log.docTitle || 'Workspace'}
                      </td>
                      <td className="py-3 pr-4 font-mono">
                        <span
                          className={`inline-flex items-center gap-1.5 ${
                            log.inferenceSource === 'on_device'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : log.inferenceSource === 'error'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-[var(--accent-primary)]'
                          }`}
                        >
                          {log.inferenceSource === 'on_device' ? (
                            <Cpu className="w-3.5 h-3.5" />
                          ) : (
                            <Cloud className="w-3.5 h-3.5" />
                          )}
                          {log.inferenceSource.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono text-[var(--text-muted)]">{log.modelId}</td>
                      <td className="py-3 text-right font-mono tabular-nums text-[var(--text-muted)]">
                        {log.latencyMs} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
