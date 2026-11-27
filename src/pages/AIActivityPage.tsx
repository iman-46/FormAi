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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Hybrid AI Transparency Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Live verification of on-device vs. cloud execution using <span className="font-mono text-xs">result.response.inferenceSource</span> from Firebase AI Logic.
          </p>
        </div>

        <button
          type="button"
          disabled={deviceModelState.status === 'downloading'}
          onClick={() => void triggerDeviceModelInit()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          {deviceModelState.status === 'downloading'
            ? `Downloading (${Math.round(deviceModelState.downloadProgress * 100)}%)`
            : 'Initialize / Check Device Model'}
        </button>
      </div>

      <AIStatusBadge />

      {/* Runtime Environment & Model Status */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              On-Device Model Status (Chrome Prompt API)
            </h2>
            <span className="font-mono text-xs uppercase text-slate-500 dark:text-slate-400">
              {deviceModelState.status}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-y-2 text-xs">
            <dt className="text-slate-500 dark:text-slate-400">Configured Default Mode</dt>
            <dd className="font-mono text-right">{preferences.defaultInferenceMode}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Browser Chrome Version</dt>
            <dd className="font-mono text-right tabular-nums">
              {deviceModelState.chromeVersion ? `Chrome ${deviceModelState.chromeVersion}` : 'Not Chrome Desktop'}
            </dd>
            <dt className="text-slate-500 dark:text-slate-400">Prompt API Detected</dt>
            <dd className="text-right font-medium">
              {deviceModelState.promptApiDetected ? 'Yes' : 'No'}
            </dd>
            <dt className="text-slate-500 dark:text-slate-400">Download Progress</dt>
            <dd className="font-mono text-right tabular-nums">
              {Math.round(deviceModelState.downloadProgress * 100)}%
            </dd>
          </dl>

          {deviceModelState.errorMessage && (
            <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg p-3">
              {deviceModelState.errorMessage}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold flex items-center gap-2">
              <Cloud className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              Cloud AI Fallback Status (Firebase AI Logic)
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Configured
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-y-2 text-xs">
            <dt className="text-slate-500 dark:text-slate-400">Active Cloud Model</dt>
            <dd className="font-mono text-right">{remoteConfig.cloudModelId}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Config Source</dt>
            <dd className="font-mono text-right">{remoteConfig.source}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Max Input Characters</dt>
            <dd className="font-mono text-right tabular-nums">{remoteConfig.maxInputChars.toLocaleString()}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Max Output Tokens</dt>
            <dd className="font-mono text-right tabular-nums">{remoteConfig.maxOutputTokens.toLocaleString()}</dd>
          </dl>
        </div>
      </div>

      {/* Recorded Metrics (Strictly from real recorded events) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <Cpu className="w-4 h-4" />
            <span>Local Inferences (ON_DEVICE)</span>
          </div>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1.5">{localCount}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 text-xs text-violet-700 dark:text-violet-400 font-medium">
            <Cloud className="w-4 h-4" />
            <span>Cloud Inferences (IN_CLOUD)</span>
          </div>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1.5">{cloudCount}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
            <ArrowLeftRight className="w-4 h-4" />
            <span>Automatic Fallbacks</span>
          </div>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1.5">{fallbackCount}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400 font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>Failed Operations</span>
          </div>
          <p className="font-mono text-2xl font-semibold tabular-nums mt-1.5">{errorCount}</p>
        </div>
      </div>

      {/* Recorded Event Log Table */}
      <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6">
        <h2 className="font-display text-base font-semibold mb-4">Recorded AI Operations</h2>

        {aiLogs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[var(--border-hairline)] rounded-lg">
            <Activity className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No recorded AI operations yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Every real call to Firebase AI Logic records its requested mode, actual <span className="font-mono">inferenceSource</span>, fallback status, model ID, and latency here. No synthetic metrics are displayed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-hairline)] text-slate-500 dark:text-slate-400">
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
                  <tr key={log.id}>
                    <td className="py-3 pr-4 font-medium capitalize">
                      {log.operation.replace('_', ' ')}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                      {log.docTitle || 'Workspace'}
                    </td>
                    <td className="py-3 pr-4 font-mono text-slate-500 dark:text-slate-400">
                      {log.requestedMode}
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold">
                      {log.inferenceSource === 'on_device' ? (
                        <span className="text-emerald-700 dark:text-emerald-400">ON_DEVICE</span>
                      ) : log.inferenceSource === 'error' ? (
                        <span className="text-rose-600 dark:text-rose-400">ERROR</span>
                      ) : (
                        <span className="text-violet-700 dark:text-violet-400">IN_CLOUD</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {log.usedFallback ? 'Yes (Fallback)' : 'Direct'}
                    </td>
                    <td className="py-3 pr-4 font-mono text-slate-500 dark:text-slate-400">
                      {log.modelId}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
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
