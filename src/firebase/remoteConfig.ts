import {
  getRemoteConfig,
  fetchAndActivate,
  getString,
  getNumber,
  getBoolean,
  type RemoteConfig,
} from 'firebase/remote-config';
import { firebaseApp } from './config';
import './appCheck';
import type { HybridInferenceMode, RemoteConfigSettings, SupportedLanguage } from '../types';

/**
 * Currently supported Firebase AI Logic Gemini models validated for cloud fallback.
 * Avoids deprecated/shut-down identifiers like gemini-2.0-flash.
 */
export const SUPPORTED_CLOUD_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3-flash-preview',
  'gemini-3.5-pro',
] as const;

export const DEFAULT_CLOUD_MODEL = 'gemini-3.5-flash-lite';

export const DEFAULT_REMOTE_CONFIG: RemoteConfigSettings = {
  cloudModelId: DEFAULT_CLOUD_MODEL,
  defaultInferenceMode: 'prefer_on_device',
  maxInputChars: 36000,
  maxOutputTokens: 2048,
  supportedLanguages: ['Simple English', 'Hindi', 'Bengali', 'Spanish', 'French'],
  enableDocumentCompare: true,
  enableMultiLanguage: true,
  enableCloudOcr: true,
  source: 'defaults',
};

let rcInstance: RemoteConfig | null = null;

function getRc(): RemoteConfig {
  if (!rcInstance) {
    rcInstance = getRemoteConfig(firebaseApp);
    rcInstance.settings.minimumFetchIntervalMillis = import.meta.env.DEV ? 60_000 : 3_600_000;
    rcInstance.defaultConfig = {
      cloud_model_id: DEFAULT_REMOTE_CONFIG.cloudModelId,
      hybrid_inference_mode: DEFAULT_REMOTE_CONFIG.defaultInferenceMode,
      max_input_chars: DEFAULT_REMOTE_CONFIG.maxInputChars,
      max_output_tokens: DEFAULT_REMOTE_CONFIG.maxOutputTokens,
      supported_languages: DEFAULT_REMOTE_CONFIG.supportedLanguages.join(','),
      enable_document_compare: DEFAULT_REMOTE_CONFIG.enableDocumentCompare,
      enable_multi_language: DEFAULT_REMOTE_CONFIG.enableMultiLanguage,
      enable_cloud_ocr: DEFAULT_REMOTE_CONFIG.enableCloudOcr,
    };
  }
  return rcInstance;
}

export function validateCloudModelId(candidate: string): string {
  const cleaned = candidate.trim();
  if ((SUPPORTED_CLOUD_MODELS as readonly string[]).includes(cleaned)) {
    return cleaned;
  }
  return DEFAULT_CLOUD_MODEL;
}

function parseInferenceMode(value: string): HybridInferenceMode {
  if (
    value === 'prefer_on_device' ||
    value === 'prefer_in_cloud' ||
    value === 'only_on_device' ||
    value === 'only_in_cloud'
  ) {
    return value;
  }
  return 'prefer_on_device';
}

function parseLanguages(raw: string): SupportedLanguage[] {
  const valid: SupportedLanguage[] = ['Simple English', 'Hindi', 'Bengali', 'Spanish', 'French'];
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is SupportedLanguage => (valid as string[]).includes(s));
  return parsed.length > 0 ? parsed : DEFAULT_REMOTE_CONFIG.supportedLanguages;
}

export function readCurrentRemoteConfig(source: 'remote_config' | 'defaults' = 'defaults'): RemoteConfigSettings {
  try {
    const rc = getRc();
    const rawModel = getString(rc, 'cloud_model_id');
    const rawMode = getString(rc, 'hybrid_inference_mode');
    const maxInputChars = Math.min(Math.max(getNumber(rc, 'max_input_chars') || 36000, 2000), 120000);
    const maxOutputTokens = Math.min(Math.max(getNumber(rc, 'max_output_tokens') || 2048, 256), 8192);
    const supportedLanguages = parseLanguages(getString(rc, 'supported_languages'));
    const enableDocumentCompare = getBoolean(rc, 'enable_document_compare');
    const enableMultiLanguage = getBoolean(rc, 'enable_multi_language');
    const enableCloudOcr = getBoolean(rc, 'enable_cloud_ocr');

    return {
      cloudModelId: validateCloudModelId(rawModel),
      defaultInferenceMode: parseInferenceMode(rawMode),
      maxInputChars,
      maxOutputTokens,
      supportedLanguages,
      enableDocumentCompare,
      enableMultiLanguage,
      enableCloudOcr,
      source,
      lastFetchedAt: Date.now(),
    };
  } catch {
    return { ...DEFAULT_REMOTE_CONFIG, source: 'defaults' };
  }
}

export async function fetchRemoteConfigSettings(): Promise<RemoteConfigSettings> {
  try {
    const rc = getRc();
    const activated = await fetchAndActivate(rc);
    return readCurrentRemoteConfig(activated ? 'remote_config' : 'defaults');
  } catch {
    return { ...DEFAULT_REMOTE_CONFIG, source: 'defaults' };
  }
}
