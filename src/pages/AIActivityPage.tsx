import { Cpu, Cloud, ArrowLeftRight, Activity, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { AIStatusBadge } from '../components/ai/AIStatusBadge';

export default function AIActivityPage() {
  const {
    preferences,
    deviceModelState,
    remoteConfig,
    aiLogs,
    triggerDeviceModelInit,
  } = useApp();

  const localCount = aiLogs.filter((l) => l.inferenceSource === 'on_device').length;
  const cloudCount = aiLogs.filter((l) => l.inferenceSource === 'in_cloud').length;
  const fallbackCount = aiLogs.filter((l) => l.usedFallback).length;
  const errorCount = aiLogs.filter((l) => l.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Hybrid AI Transparency
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Live verification of on-device vs. cloud execution using{' '}
            <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-subtle)]">
              result.response.inferenceSource
            </code>{' '}
            from Firebase AI Logic.
          </p>
        </div>

        <button
          type="button"
          disabled={deviceModelState.status === 'downloading'}
          onClick={() => void triggerDeviceModelInit()}
          className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-settle whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {deviceModelState.status === 'downloading'
            ? `Downloading (${Math.round(deviceModelState.downloadProgress * 100)}%)`
            : 'Initialize / Check Device Model'}
        </button>
      </div>

      <AIStatusBadge />

      {/* Runtime Environment & Model Status */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl surface-sheet p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <h2 className="font-display text-sm font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              On-Device Model (Chrome Prompt API)
            </h2>
            <span className="font-mono text-xs uppercase text-[var(--text-muted)] shrink-0">
              {deviceModelState.status}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
            <dt className="text-[var(--text-muted)]">Configured Default Mode</dt>
            <dd className="font-mono text-right truncate">{preferences.defaultInferenceMode}</dd>
            <dt className="text-[var(--text-muted)]">Browser Chrome Version</dt>
            <dd className="font-mono text-right tabular-nums truncate">
              {deviceModelState.chromeVersion ? `Chrome ${deviceModelState.chromeVersion}` : 'Not Chrome Desktop'}
            </dd>
            <dt className="text-[var(--text-muted)]">Prompt API Detected</dt>
            <dd className="text-right font-semibold">
              {deviceModelState.promptApiDetected ? 'Yes' : 'No'}
            </dd>
            <dt className="text-[var(--text-muted)]">Download Progress</dt>
            <dd className="font-mono text-right tabular-nums">
              {Math.round(deviceModelState.downloadProgress * 100)}%
            </dd>
          </dl>

          {deviceModelState.errorMessage && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 leading-relaxed">
              {deviceModelState.errorMessage}
            </p>
          )}
        </div>

        <div className="rounded-2xl surface-sheet p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <h2 className="font-display text-sm font-bold flex items-center gap-2">
              <Cloud className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
              Cloud Fallback (Firebase AI Logic)
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> Configured
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
            <dt className="text-[var(--text-muted)]">Active Cloud Model</dt>
            <dd className="font-mono text-right truncate">{remoteConfig.cloudModelId}</dd>
            <dt className="text-[var(--text-muted)]">Config Source</dt>
            <dd className="font-mono text-right truncate">{remoteConfig.source}</dd>
            <dt className="text-[var(--text-muted)]">Max Input Characters</dt>
            <dd className="font-mono text-right tabular-nums">
              {remoteConfig.maxInputChars.toLocaleString()}
            </dd>
            <dt className="text-[var(--text-muted)]">Max Output Tokens</dt>
            <dd className="font-mono text-right tabular-nums">
              {remoteConfig.maxOutputTokens.toLocaleString()}
            </dd>
          </dl>
        </div>
      </div>

      {/* Unified Recorded Metrics Strip */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--border-hairline)] grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden">
        <div className="bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <Cpu className="w-4 h-4 shrink-0" />
            <span>Local Inferences</span>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-semibold tabular-nums mt-1.5">{localCount}</p>
        </div>

        <div className="bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-[var(--accent-primary)] font-medium">
            <Cloud className="w-4 h-4 shrink-0" />
            <span>Cloud Inferences</span>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-semibold tabular-nums mt-1.5">{cloudCount}</p>
        </div>

        <div className="bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
            <ArrowLeftRight className="w-4 h-4 shrink-0" />
            <span>Automatic Fallbacks</span>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-semibold tabular-nums mt-1.5">{fallbackCount}</p>
        </div>

        <div className="bg-[var(--bg-surface)] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Failed Operations</span>
          </div>
          <p className="font-mono text-xl sm:text-2xl font-semibold tabular-nums mt-1.5">{errorCount}</p>
        </div>
      </div>

      {/* Recorded Event Log */}
      <section className="rounded-2xl surface-sheet p-5 sm:p-6">
        <h2 className="font-display text-base font-bold mb-4">Recorded AI Operations</h2>

        {aiLogs.length === 0 ? (
          <div className="py-10 sm:py-12 text-center border border-dashed border-[var(--border-hairline)] rounded-xl px-4">
            <Activity className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold mb-1">No recorded AI operations yet</p>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Every real call to Firebase AI Logic records its requested mode, actual{' '}
              <span className="font-mono">inferenceSource</span>, fallback status, model ID, and latency here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List */}
            <div className="sm:hidden divide-y divide-[var(--border-hairline)]">
              {aiLogs.map((log) => (
                <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold capitalize">
                      {log.operation.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[11px] font-semibold">
                      {log.inferenceSource === 'on_device' ? (
                        <span className="text-emerald-700 dark:text-emerald-400">ON_DEVICE</span>
                      ) : log.inferenceSource === 'error' ? (
                        <span className="text-rose-600 dark:text-rose-400">ERROR</span>
                      ) : (
                        <span className="text-[var(--accent-primary)]">IN_CLOUD</span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {log.docTitle || 'Workspace'}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--text-muted)]">
                    <span className="truncate">
                      {log.modelId} · {log.usedFallback ? 'Fallback' : 'Direct'}
                    </span>
                    <span className="tabular-nums shrink-0">{log.latencyMs} ms</span>
                  </div>
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
                    <th className="py-2.5 pr-4 font-medium">Requested Mode</th>
                    <th className="py-2.5 pr-4 font-medium">Actual Source</th>
                    <th className="py-2.5 pr-4 font-medium">Fallback</th>
                    <th className="py-2.5 pr-4 font-medium">Model</th>
                    <th className="py-2.5 text-right font-medium">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {aiLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--bg-canvas)]/70 transition-settle">
                      <td className="py-3 pr-4 font-medium capitalize">
                        {log.operation.replace('_', ' ')}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)] truncate max-w-[200px]">
                        {log.docTitle || 'Workspace'}
                      </td>
                      <td className="py-3 pr-4 font-mono text-[var(--text-muted)]">
                        {log.requestedMode}
                      </td>
                      <td className="py-3 pr-4 font-mono font-semibold">
                        {log.inferenceSource === 'on_device' ? (
                          <span className="text-emerald-700 dark:text-emerald-400">ON_DEVICE</span>
                        ) : log.inferenceSource === 'error' ? (
                          <span className="text-rose-600 dark:text-rose-400">ERROR</span>
                        ) : (
                          <span className="text-[var(--accent-primary)]">IN_CLOUD</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-[var(--text-secondary)]">
                        {log.usedFallback ? 'Yes (Fallback)' : 'Direct'}
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
