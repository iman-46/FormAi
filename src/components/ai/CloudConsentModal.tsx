import { ShieldAlert, Cloud, Cpu, X, Lock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function CloudConsentModal() {
  const { pendingConsent, remoteConfig } = useApp();

  if (!pendingConsent) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-consent-title"
    >
      <div className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl surface-sheet p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="cloud-consent-title"
                className="text-base font-bold font-display text-[var(--text-primary)]"
              >
                Cloud AI Processing Consent
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                One-time session approval before extracted text leaves your browser
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => pendingConsent.resolve('cancel')}
            aria-label="Cancel request"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-settle shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          <p>{pendingConsent.reason}</p>

          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 text-xs space-y-2">
            <p className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Session Privacy &amp; Routing Guarantees
            </p>
            <ul className="space-y-1.5 text-[var(--text-secondary)]">
              <li>
                Only extracted plain text (up to{' '}
                <span className="font-mono tabular-nums">
                  {remoteConfig.maxInputChars.toLocaleString()}
                </span>{' '}
                characters) is sent to Gemini (<span className="font-mono">{remoteConfig.cloudModelId}</span>).
              </li>
              <li>Original PDF and DOCX binary files stay strictly inside your browser.</li>
              <li>
                Every response records its actual SDK <span className="font-mono">inferenceSource</span> in your AI Activity log.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center sm:justify-end gap-2.5 pt-4 border-t border-[var(--border-hairline)]">
          <button
            type="button"
            onClick={() => pendingConsent.resolve('cancel')}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 text-xs font-medium rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap text-center"
          >
            Cancel
          </button>
          {pendingConsent.canRunLocalInstead && (
            <button
              type="button"
              onClick={() => pendingConsent.resolve('local_only')}
              className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-settle whitespace-nowrap"
            >
              <Cpu className="w-3.5 h-3.5" />
              Try On-Device Only
            </button>
          )}
          <button
            type="button"
            onClick={() => pendingConsent.resolve('cloud')}
            className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white hover:opacity-90 transition-settle whitespace-nowrap"
          >
            <Cloud className="w-3.5 h-3.5" />
            Allow Cloud AI for Session
          </button>
        </div>
      </div>
    </div>
  );
}
