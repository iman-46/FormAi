import React, { useState } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Save,
  KeyRound,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { updateUserDisplayName, resetUserPassword } from '../firebase/auth';
import type { HybridInferenceMode, SupportedLanguage } from '../types';

export default function SettingsPage() {
  const {
    user,
    theme,
    preferences,
    updatePreferences,
    remoteConfig,
    refreshRemoteConfig,
    appCheckState,
    refreshAppCheck,
    cloudConsentGranted,
    grantCloudConsent,
    revokeCloudConsent,
  } = useApp();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [refreshingRc, setRefreshingRc] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await updateUserDisplayName(displayName);
    setSavedNotice('Account display name updated.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    await resetUserPassword(user.email);
    setSavedNotice(`Password reset email sent to ${user.email}.`);
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const handleRefreshRc = async () => {
    setRefreshingRc(true);
    await refreshRemoteConfig();
    setRefreshingRc(false);
    setSavedNotice('Firebase Remote Config parameters refreshed.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
          Account &amp; Workspace Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure appearance, hybrid AI routing defaults, Firestore privacy retention, App Check, and Firebase Remote Config.
        </p>
      </div>

      {savedNotice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Appearance & Workspace Preferences */}
      <section className="rounded-2xl surface-sheet p-5 sm:p-7 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-hairline)]">
          <Sliders className="w-4 h-4 text-[var(--accent-primary)]" />
          <h2 className="font-display text-base font-bold">Workspace &amp; Hybrid AI Preferences</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-xs font-medium mb-2">Interface Theme</label>
            <div className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => void updatePreferences({ theme: 'light' })}
                className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-settle ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button
                type="button"
                onClick={() => void updatePreferences({ theme: 'dark' })}
                className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-settle ${
                  theme === 'dark'
                    ? 'bg-[#1F2432] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="pref-mode" className="block text-xs font-medium mb-2">
              Default Hybrid Inference Mode
            </label>
            <select
              id="pref-mode"
              value={preferences.defaultInferenceMode}
              onChange={(e) =>
                void updatePreferences({
                  defaultInferenceMode: e.target.value as HybridInferenceMode,
                })
              }
              className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
            >
              <option value="prefer_on_device">Prefer On-Device (Auto Cloud Fallback)</option>
              <option value="only_on_device">Only On-Device (Strict Local)</option>
              <option value="prefer_in_cloud">Prefer In-Cloud</option>
              <option value="only_in_cloud">Only In-Cloud</option>
            </select>
          </div>

          <div>
            <label htmlFor="pref-lang" className="block text-xs font-medium mb-2">
              Default Output Language
            </label>
            <select
              id="pref-lang"
              value={preferences.preferredLanguage}
              onChange={(e) =>
                void updatePreferences({
                  preferredLanguage: e.target.value as SupportedLanguage,
                })
              }
              className="w-full min-h-[42px] px-3 py-2 text-xs rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
            >
              {remoteConfig.supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-5 border-t border-[var(--border-hairline)] divide-y divide-[var(--border-hairline)] text-xs">
          <label className="py-3.5 first:pt-0 flex items-start sm:items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Auto-save analyses to Cloud Firestore
              </p>
              <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Persist document metadata, action plans, deadlines, and checklists for verified accounts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.autoSaveToFirestore}
              onChange={(e) => void updatePreferences({ autoSaveToFirestore: e.target.checked })}
              className="w-5 h-5 mt-0.5 sm:mt-0 accent-[#4338CA] dark:accent-[#6366F1] shrink-0"
            />
          </label>

          <label className="py-3.5 flex items-start sm:items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Save extracted document text in Firestore
              </p>
              <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                Disable this to save only AI summaries, checklists, and deadlines without storing raw document text in the cloud.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.saveExtractedText}
              onChange={(e) => void updatePreferences({ saveExtractedText: e.target.checked })}
              className="w-5 h-5 mt-0.5 sm:mt-0 accent-[#4338CA] dark:accent-[#6366F1] shrink-0"
            />
          </label>

          <div className="py-3.5 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Session Cloud AI Consent</p>
              <p className="text-[var(--text-muted)] mt-0.5">
                Current status:{' '}
                {cloudConsentGranted
                  ? 'Granted for this session'
                  : 'Will prompt before cloud processing'}
              </p>
            </div>
            {cloudConsentGranted ? (
              <button
                type="button"
                onClick={revokeCloudConsent}
                className="w-full sm:w-auto min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap"
              >
                Revoke Consent
              </button>
            ) : (
              <button
                type="button"
                onClick={grantCloudConsent}
                className="w-full sm:w-auto min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap"
              >
                Grant for Session
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Account Profile */}
      {user && (
        <section className="rounded-2xl surface-sheet p-5 sm:p-7 space-y-4">
          <h2 className="font-display text-base font-bold pb-3 border-b border-[var(--border-hairline)]">
            User Profile
          </h2>
          <form
            onSubmit={(e) => void handleSaveProfile(e)}
            className="grid sm:grid-cols-2 gap-4 items-end"
          >
            <div>
              <label htmlFor="settings-name" className="block text-xs font-medium mb-1.5">
                Display Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              />
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
              <button
                type="submit"
                className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle"
              >
                <Save className="w-3.5 h-3.5" />
                Save Name
              </button>
              <button
                type="button"
                onClick={() => void handleResetPassword()}
                className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-[var(--bg-subtle)] transition-settle"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Send Password Reset
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Firebase App Check & Remote Config Inspection */}
      <div className="grid md:grid-cols-2 gap-5">
        <section className="rounded-2xl surface-sheet p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-hairline)]">
            <h2 className="font-display text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              Firebase App Check
            </h2>
            <button
              type="button"
              onClick={() => void refreshAppCheck()}
              className="min-h-[36px] px-2 text-xs font-medium text-[var(--accent-primary)] hover:underline shrink-0"
            >
              Verify Token
            </button>
          </div>
          <dl className="text-xs space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)] shrink-0">Mode</dt>
              <dd className="font-mono truncate">{appCheckState.mode}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)] shrink-0">Debug Flag</dt>
              <dd className="font-mono truncate">{appCheckState.debugEnabled ? 'enabled' : 'disabled'}</dd>
            </div>
            {appCheckState.tokenPreview && (
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--text-muted)] shrink-0">Token Preview</dt>
                <dd className="font-mono truncate">{appCheckState.tokenPreview}</dd>
              </div>
            )}
          </dl>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-1 break-words">
            In development, <span className="font-mono">self.FIREBASE_APPCHECK_DEBUG_TOKEN = true</span> logs a debug token in Chrome DevTools Console. Register that token under Firebase Console → App Check → Apps → Manage debug tokens, and set <span className="font-mono">VITE_FIREBASE_APPCHECK_SITE_KEY</span> for production reCAPTCHA v3.
          </p>
        </section>

        <section className="rounded-2xl surface-sheet p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-hairline)]">
            <h2 className="font-display text-sm font-bold">Firebase Remote Config</h2>
            <button
              type="button"
              disabled={refreshingRc}
              onClick={() => void handleRefreshRc()}
              className="min-h-[36px] px-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingRc ? 'animate-spin' : ''}`} />
              Fetch
            </button>
          </div>
          <dl className="text-xs space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)] shrink-0">cloud_model_id</dt>
              <dd className="font-mono truncate">{remoteConfig.cloudModelId}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)] shrink-0">hybrid_inference_mode</dt>
              <dd className="font-mono truncate">{remoteConfig.defaultInferenceMode}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)] shrink-0">max_input_chars</dt>
              <dd className="font-mono tabular-nums">{remoteConfig.maxInputChars}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--text-muted)] shrink-0">max_output_tokens</dt>
              <dd className="font-mono tabular-nums">{remoteConfig.maxOutputTokens}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
