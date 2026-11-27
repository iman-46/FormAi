import { ShieldAlert, Cloud, Cpu, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function CloudConsentModal() {
  const { pendingConsent, remoteConfig } = useApp();

  if (!pendingConsent) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-consent-title"
    >
      <div className="max-w-lg w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cloud-consent-title" className="text-base font-semibold font-display text-slate-900 dark:text-slate-100">
                Cloud AI Processing Consent
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                One-time session confirmation before text leaves your device
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => pendingConsent.resolve('cancel')}
            aria-label="Cancel request"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          <p>{pendingConsent.reason}</p>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5 text-xs space-y-1.5">
            <p className="font-medium text-slate-900 dark:text-slate-100">What happens when you approve Cloud AI:</p>
            <p>• Only extracted document text (up to {remoteConfig.maxInputChars.toLocaleString()} chars) is transmitted via Firebase AI Logic to Gemini (<span className="font-mono">{remoteConfig.cloudModelId}</span>).</p>
            <p>• Original PDF/DOCX binary files remain in your browser.</p>
            <p>• Cloud processing is NOT local on-device inference; the actual <span className="font-mono">inferenceSource</span> is logged transparently.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => pendingConsent.resolve('cancel')}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          {pendingConsent.canRunLocalInstead && (
            <button
              type="button"
              onClick={() => pendingConsent.resolve('local_only')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5" />
              Try On-Device Only
            </button>
          )}
          <button
            type="button"
            onClick={() => pendingConsent.resolve('cloud')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-900 text-white dark:bg-violet-600 dark:text-white hover:opacity-90 transition-opacity"
          >
            <Cloud className="w-3.5 h-3.5" />
            Allow Cloud AI for This Session
          </button>
        </div>
      </div>
    </div>
  );
}
