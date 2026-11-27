import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  type AppCheck,
} from 'firebase/app-check';
import { firebaseApp, typedFirebaseConfig } from './config';
import type { AppCheckState } from '../types';

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  }
}

let appCheckInstance: AppCheck | null = null;
let currentState: AppCheckState = {
  initialized: false,
  mode: 'unconfigured',
  debugEnabled: false,
};

const listeners = new Set<(state: AppCheckState) => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb({ ...currentState }));
}

export function subscribeAppCheckState(cb: (state: AppCheckState) => void): () => void {
  listeners.add(cb);
  cb({ ...currentState });
  return () => {
    listeners.delete(cb);
  };
}

export function getAppCheckState(): AppCheckState {
  return { ...currentState };
}

/**
 * Initializes Firebase App Check BEFORE any Firebase AI Logic, Firestore, or Auth requests.
 * Follows the official Firebase procedure for debug tokens in development and reCAPTCHA v3 in production.
 */
export function ensureAppCheckInitialized(): AppCheck | null {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  const isLocalOrPreview =
    typeof window !== 'undefined' &&
    (import.meta.env.DEV ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('run.app'));

  const envSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY as string | undefined;
  const siteKey = (envSiteKey && envSiteKey.trim()) || typedFirebaseConfig.recaptchaSiteKey?.trim() || '';

  // Configure debug token before calling initializeAppCheck in development/preview environments.
  // Never commit actual debug token secrets to source control.
  if (isLocalOrPreview && typeof window !== 'undefined') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  // If a real reCAPTCHA site key is configured (or in dev with a placeholder for debug-token exchange),
  // initialize App Check with ReCaptchaV3Provider.
  // Note: When recaptchaSiteKey is empty in firebase-applet-config.json, we avoid passing an invalid
  // dummy key to Google reCAPTCHA script unless explicitly enabled, while keeping the debug token flag active.
  if (!siteKey) {
    currentState = {
      initialized: false,
      mode: isLocalOrPreview ? 'debug' : 'unconfigured',
      debugEnabled: isLocalOrPreview,
      error:
        'No reCAPTCHA v3 site key configured yet. Add VITE_FIREBASE_APPCHECK_SITE_KEY or recaptchaSiteKey in Firebase Console -> App Check to enforce attestation.',
    };
    notifyListeners();
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });

    currentState = {
      initialized: true,
      mode: isLocalOrPreview ? 'debug' : 'recaptcha_v3',
      debugEnabled: isLocalOrPreview,
    };
    notifyListeners();
    return appCheckInstance;
  } catch (err) {
    currentState = {
      initialized: false,
      mode: 'unconfigured',
      debugEnabled: isLocalOrPreview,
      error: err instanceof Error ? err.message : 'Failed to initialize Firebase App Check.',
    };
    notifyListeners();
    return null;
  }
}

/**
 * Generates / refreshes an App Check token on demand so users can inspect debug readiness.
 */
export async function verifyAppCheckToken(): Promise<AppCheckState> {
  const instance = ensureAppCheckInitialized();
  if (!instance) {
    return getAppCheckState();
  }
  try {
    const result = await getToken(instance, false);
    const masked = result.token
      ? `${result.token.slice(0, 10)}...${result.token.slice(-6)}`
      : undefined;
    currentState = {
      ...currentState,
      initialized: true,
      tokenPreview: masked,
      error: undefined,
    };
  } catch (err) {
    currentState = {
      ...currentState,
      error: err instanceof Error ? err.message : 'Unable to fetch App Check token.',
    };
  }
  notifyListeners();
  return getAppCheckState();
}

// Initialize immediately on module load before other Firebase services execute requests
ensureAppCheckInitialized();
