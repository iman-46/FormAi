import { Cpu, Cloud, Loader2, ArrowLeftRight, AlertCircle, Download } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { AIStatusState } from '../../types';

const STATUS_META: Record<
  AIStatusState,
  {
    label: string;
    subtitle: string;
    toneClass: string;
    Icon: typeof Cpu;
  }
> = {
  IDLE: {
    label: 'HYBRID READY',
    subtitle: 'Select an action to run Firebase AI Logic.',
    toneClass: 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60',
    Icon: Cpu,
  },
  INITIALIZING: {
    label: 'INITIALIZING',
    subtitle: 'Preparing the on-device model.',
    toneClass: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30',
    Icon: Loader2,
  },
  LOCAL_AI: {
    label: 'LOCAL AI',
    subtitle: 'Processed on your device.',
    toneClass: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30',
    Icon: Cpu,
  },
  CLOUD_AI: {
    label: 'CLOUD AI',
    subtitle: 'Processed using cloud AI.',
    toneClass: 'text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900/60 bg-violet-50/70 dark:bg-violet-950/30',
    Icon: Cloud,
  },
  FALLBACK: {
    label: 'FALLBACK',
    subtitle: 'Cloud processing was selected because local inference was unavailable or unsuitable.',
    toneClass: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30',
    Icon: ArrowLeftRight,
  },
  ERROR: {
    label: 'ERROR',
    subtitle: 'AI processing failed.',
    toneClass: 'text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30',
    Icon: AlertCircle,
  },
};

export function AIStatusBadge({ compact = false }: { compact?: boolean }) {
  const { aiStatus, aiStatusDetail, deviceModelState, triggerDeviceModelInit } = useApp();
  const meta = STATUS_META[aiStatus];
  const Icon = meta.Icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${meta.toneClass}`}>
        <Icon className={`w-3.5 h-3.5 shrink-0 ${aiStatus === 'INITIALIZING' ? 'animate-spin' : ''}`} />
        <span className="font-mono font-semibold tracking-tight whitespace-nowrap">{meta.label}</span>
        <span className="hidden xl:inline text-[11px] opacity-80 truncate max-w-[220px]">{aiStatusDetail}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${meta.toneClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${aiStatus === 'INITIALIZING' ? 'animate-spin' : ''}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold">{meta.label}</span>
              <span className="text-xs opacity-70">·</span>
              <span className="text-xs font-medium">{meta.subtitle}</span>
            </div>
            <p className="text-xs opacity-80 mt-1">{aiStatusDetail}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {deviceModelState.status === 'downloading' && (
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <div className="w-28 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-current transition-all duration-150"
                  style={{ width: `${Math.round(deviceModelState.downloadProgress * 100)}%` }}
                />
              </div>
              <span>{Math.round(deviceModelState.downloadProgress * 100)}%</span>
            </div>
          )}

          {deviceModelState.status !== 'ready' && deviceModelState.status !== 'downloading' && (
            <button
              type="button"
              onClick={() => void triggerDeviceModelInit()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-current/25 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Initialize On-Device Model
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
