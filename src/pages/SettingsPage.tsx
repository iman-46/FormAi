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
        <h1 className="font-display text-2xl font-bold tracking-tight">Account &amp; Workspace Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Configure appearance, hybrid AI defaults, document retention privacy, App Check, and Firebase Remote Config.
        </p>
      </div>

      {savedNotice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Appearance & Workspace Preferences */}
      <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <h2 className="font-display text-base font-semibold">Workspace &amp; Hybrid AI Preferences</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium mb-2">Interface Theme</label>
            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => void updatePreferences({ theme: 'light' })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-[var(--text-primary)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button
                type="button"
                onClick={() => void updatePreferences({ theme: 'dark' })}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-500 hover:text-[var(--text-primary)]'
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
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
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
            >
              {remoteConfig.supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-hairline)] space-y-3 text-xs">
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Auto-save analyses to Cloud Firestore</p>
              <p className="text-slate-500 dark:text-slate-400">
                Persist document metadata, action plans, deadlines, and checklists for verified accounts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.autoSaveToFirestore}
              onChange={(e) => void updatePreferences({ autoSaveToFirestore: e.target.checked })}
              className="w-4 h-4 accent-violet-600"
            />
          </label>

          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Save extracted document text in Firestore</p>
              <p className="text-slate-500 dark:text-slate-400">
                Disable this to save only AI summaries, checklists, and deadlines without storing raw document text in the cloud.
              </p>
            </div>
            <input
              type="checkbox"
              checked={preferences.saveExtractedText}
              onChange={(e) => void updatePreferences({ saveExtractedText: e.target.checked })}
              className="w-4 h-4 accent-violet-600"
            />
          </label>

          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Session Cloud AI Consent</p>
              <p className="text-slate-500 dark:text-slate-400">
                Current status: {cloudConsentGranted ? 'Granted for this session' : 'Will prompt before cloud processing'}
              </p>
            </div>
            {cloudConsentGranted ? (
              <button
                type="button"
                onClick={revokeCloudConsent}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Revoke Consent
              </button>
            ) : (
              <button
                type="button"
                onClick={grantCloudConsent}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Grant for Session
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Account Profile */}
      {user && (
        <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold">User Profile</h2>
          <form onSubmit={(e) => void handleSaveProfile(e)} className="grid sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="settings-name" className="block text-xs font-medium mb-1.5">
                Display Name
              </label>
              <input
                id="settings-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                Save Name
              </button>
              <button
                type="button"
                onClick={() => void handleResetPassword()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--border-hairline)] text-xs font-medium"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Send Password Reset
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Firebase App Check & Remote Config Inspection */}
      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Firebase App Check
            </h2>
            <button
              type="button"
              onClick={() => void refreshAppCheck()}
              className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline"
            >
              Verify Token
            </button>
          </div>
          <dl className="text-xs space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-slate-500">Mode</dt>
              <dd className="font-mono">{appCheckState.mode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Debug Flag</dt>
              <dd className="font-mono">{appCheckState.debugEnabled ? 'enabled' : 'disabled'}</dd>
            </div>
            {appCheckState.tokenPreview && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Token Preview</dt>
                <dd className="font-mono">{appCheckState.tokenPreview}</dd>
              </div>
            )}
          </dl>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            In development, <span className="font-mono">self.FIREBASE_APPCHECK_DEBUG_TOKEN = true</span> logs a debug token in Chrome DevTools Console. Register that token under Firebase Console → App Check → Apps → Manage debug tokens, and set <span className="font-mono">VITE_FIREBASE_APPCHECK_SITE_KEY</span> for production reCAPTCHA v3.
          </p>
        </section>

        <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold">Firebase Remote Config</h2>
            <button
              type="button"
              disabled={refreshingRc}
              onClick={() => void handleRefreshRc()}
              className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingRc ? 'animate-spin' : ''}`} />
              Fetch
            </button>
          </div>
          <dl className="text-xs space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-slate-500">cloud_model_id</dt>
              <dd className="font-mono">{remoteConfig.cloudModelId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">hybrid_inference_mode</dt>
              <dd className="font-mono">{remoteConfig.defaultInferenceMode}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">max_input_chars</dt>
              <dd className="font-mono tabular-nums">{remoteConfig.maxInputChars}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">max_output_tokens</dt>
              <dd className="font-mono tabular-nums">{remoteConfig.maxOutputTokens}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
