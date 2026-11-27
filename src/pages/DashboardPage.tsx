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
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AIStatusBadge } from '../components/ai/AIStatusBadge';
import { formatBytes } from '../services/documentService';

export default function DashboardPage() {
  const {
    user,
    documents,
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

  const handleLoadDemo = async () => {
    await loadCompetitionDemo(true);
    navigate('/analysis');
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Review extracted document plans, approaching deadlines, and hybrid AI processing activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => void handleLoadDemo()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            Load Demo Admission Notice
          </button>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Document
          </Link>
        </div>
      </div>

      {/* Hybrid AI Readiness Banner */}
      <AIStatusBadge />

      {/* Workspace KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Documents</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1">{documents.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Active Workflows</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1">{activeWorkflows}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Pending Tasks</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1 text-amber-600 dark:text-amber-400">
            {pendingTasks.length}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Completed Tasks</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1 text-emerald-600 dark:text-emerald-400">
            {completedTasks.length}
          </p>
        </div>
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming Deadlines</p>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1">{allDeadlines.length}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Recent Documents */}
        <section className="lg:col-span-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold">Recent Documents</h2>
            <Link to="/documents" className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline">
              View all
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[var(--border-hairline)] rounded-lg px-4">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">No documents in your workspace yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                Upload a PDF, DOCX, or TXT file, paste text, or try the fictional Northbridge College Admission Notice demo.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Link
                  to="/upload"
                  className="px-3.5 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
                >
                  Upload First Document
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLoadDemo()}
                  className="px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
                >
                  Load Demo Notice
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {documents.slice(0, 5).map((docItem) => (
                <div
                  key={docItem.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDocId(docItem.id);
                        navigate('/analysis');
                      }}
                      className="text-sm font-medium hover:text-violet-700 dark:hover:text-violet-400 text-left truncate block max-w-md"
                    >
                      {docItem.title}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                      <span>{docItem.fileName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatBytes(docItem.fileSize)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{docItem.pageCount} {docItem.pageCount === 1 ? 'page' : 'pages'}</span>
                      {docItem.isDemo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-violet-600 dark:text-violet-400 font-medium">Fictional Demo</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDocId(docItem.id);
                      navigate('/analysis');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-[var(--text-primary)] shrink-0"
                  >
                    Open
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending Actions & Upcoming Deadlines */}
        <section className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold">Pending Actions</h2>
              <Link to="/action-plans" className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline">
                Open plan
              </Link>
            </div>
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                No pending action items. Open a document in Analysis to generate a step-by-step plan.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {pendingTasks.slice(0, 4).map((task) => (
                  <li key={task.id} className="flex items-start gap-2.5 text-xs">
                    <CheckSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Priority: {task.priority}{task.deadline ? ` · Due ${task.deadline}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold">Upcoming Deadlines</h2>
              <Link to="/deadlines" className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline">
                Timeline
              </Link>
            </div>
            {allDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                No extracted dates yet. Run Deadline Intelligence on any uploaded notice.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {allDeadlines.slice(0, 4).map((dl) => (
                  <li key={dl.id} className="flex items-start gap-2.5 text-xs">
                    <CalendarClock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{dl.title}</p>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {dl.dateText}{dl.needsVerification ? ' · Verify date' : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Recent AI Activity Feed */}
      <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold">Recent Hybrid AI Activity</h2>
          <Link to="/ai-activity" className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline">
            Full transparency log
          </Link>
        </div>

        {aiLogs.length === 0 ? (
          <div className="py-6 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span>No AI inferences recorded yet in this workspace. Run an analysis to log real SDK inference sources.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-slate-500 dark:text-slate-400">
                  <th className="py-2 pr-4 font-medium">Operation</th>
                  <th className="py-2 pr-4 font-medium">Document</th>
                  <th className="py-2 pr-4 font-medium">Actual Source</th>
                  <th className="py-2 pr-4 font-medium">Model</th>
                  <th className="py-2 text-right font-medium">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {aiLogs.slice(0, 5).map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-4 font-medium capitalize">{log.operation.replace('_', ' ')}</td>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-300 truncate max-w-[220px]">
                      {log.docTitle || 'Workspace'}
                    </td>
                    <td className="py-2.5 pr-4 font-mono">
                      <span
                        className={`inline-flex items-center gap-1.5 ${
                          log.inferenceSource === 'on_device'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : log.inferenceSource === 'error'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-violet-700 dark:text-violet-400'
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
                    <td className="py-2.5 pr-4 font-mono text-slate-500 dark:text-slate-400">{log.modelId}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {log.latencyMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
