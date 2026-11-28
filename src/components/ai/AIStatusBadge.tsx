import { Cpu, Cloud, Loader2, ArrowLeftRight, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { AIStatusState } from '../../types';

const STATUS_META: Record<
  AIStatusState,
  {
    label: string;
    subtitle: string;
    toneClass: string;
    iconBgClass: string;
    Icon: typeof Cpu;
  }
> = {
  IDLE: {
    label: 'Hybrid Ready',
    subtitle: 'Select an action to route through Firebase AI Logic.',
    toneClass: 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)]',
    iconBgClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    Icon: Cpu,
  },
  INITIALIZING: {
    label: 'Initializing',
    subtitle: 'Preparing the Chrome on-device model.',
    toneClass: 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/25 text-indigo-950 dark:text-indigo-200',
    iconBgClass: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
    Icon: Loader2,
  },
  LOCAL_AI: {
    label: 'Local On-Device',
    subtitle: 'Processed privately on your device via Chrome Prompt API.',
    toneClass: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/25 text-emerald-950 dark:text-emerald-200',
    iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    Icon: Cpu,
  },
  CLOUD_AI: {
    label: 'Cloud AI',
    subtitle: 'Processed via Firebase AI Logic cloud Gemini.',
    toneClass: 'border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/25 text-indigo-950 dark:text-indigo-200',
    iconBgClass: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
    Icon: Cloud,
  },
  FALLBACK: {
    label: 'Cloud Fallback',
    subtitle: 'Cloud inference selected automatically because local model was unavailable.',
    toneClass: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/25 text-amber-950 dark:text-amber-200',
    iconBgClass: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    Icon: ArrowLeftRight,
  },
  ERROR: {
    label: 'Error',
    subtitle: 'AI processing could not complete.',
    toneClass: 'border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/25 text-rose-950 dark:text-rose-200',
    iconBgClass: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
    Icon: AlertCircle,
  },
};

export function AIStatusBadge({ compact = false }: { compact?: boolean }) {
  const { aiStatus, aiStatusDetail, deviceModelState, triggerDeviceModelInit } = useApp();
  const meta = STATUS_META[aiStatus];
  const Icon = meta.Icon;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-settle ${meta.toneClass}`}
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 ${aiStatus === 'INITIALIZING' ? 'animate-spin' : ''}`} />
        <span className="font-mono text-[11px] font-semibold tracking-tight whitespace-nowrap">
          {meta.label}
        </span>
        <span className="hidden xl:inline text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">
          {aiStatusDetail}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-4 sm:px-5 py-4 transition-settle ${meta.toneClass}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBgClass}`}>
            <Icon className={`w-4 h-4 ${aiStatus === 'INITIALIZING' ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-mono text-xs font-semibold">{meta.label}</span>
              <span className="hidden sm:inline text-xs opacity-50" aria-hidden="true">·</span>
              <span className="text-xs font-medium">{meta.subtitle}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 sm:mt-0.5 line-clamp-2 sm:truncate max-w-2xl">
              {aiStatusDetail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {deviceModelState.status === 'downloading' && (
            <div className="flex items-center gap-2.5 text-xs font-mono tabular-nums w-full sm:w-auto">
              <div className="flex-1 sm:w-32 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-150"
                  style={{ width: `${Math.round(deviceModelState.downloadProgress * 100)}%` }}
                />
              </div>
              <span>{Math.round(deviceModelState.downloadProgress * 100)}%</span>
            </div>
          )}

          {deviceModelState.status === 'ready' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" />
              On-device model ready
            </span>
          ) : deviceModelState.status !== 'downloading' ? (
            <button
              type="button"
              onClick={() => void triggerDeviceModelInit()}
              className="w-full sm:w-auto min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-semibold hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Initialize On-Device Model
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
