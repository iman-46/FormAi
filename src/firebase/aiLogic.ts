import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
  type GenerativeModel,
  type Part,
} from 'firebase/ai';
import { firebaseApp } from './config';
import { ensureAppCheckInitialized } from './appCheck';
import type { DeviceModelState, HybridInferenceMode } from '../types';

// Ensure App Check is configured before initializing Firebase AI Logic
ensureAppCheckInitialized();

const ai = getAI(firebaseApp, {
  backend: new GoogleAIBackend(),
});

export function toSdkInferenceMode(mode: HybridInferenceMode): InferenceMode {
  switch (mode) {
    case 'prefer_on_device':
      return InferenceMode.PREFER_ON_DEVICE;
    case 'prefer_in_cloud':
      return InferenceMode.PREFER_IN_CLOUD;
    case 'only_on_device':
      return InferenceMode.ONLY_ON_DEVICE;
    case 'only_in_cloud':
      return InferenceMode.ONLY_IN_CLOUD;
  }
}

export function normalizeInferenceSource(
  rawSource: InferenceSource | string | undefined
): 'on_device' | 'in_cloud' {
  if (rawSource === InferenceSource.ON_DEVICE || rawSource === 'on_device' || rawSource === 'ON_DEVICE') {
    return 'on_device';
  }
  return 'in_cloud';
}

export function detectBrowserOnDeviceCapability(): {
  browserSupported: boolean;
  promptApiDetected: boolean;
  chromeVersion?: number;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { browserSupported: false, promptApiDetected: false };
  }

  const ua = navigator.userAgent;
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const isEdgeOrOpera = /Edg\/|OPR\//.test(ua);
  const chromeVersion = chromeMatch && !isEdgeOrOpera ? Number(chromeMatch[1]) : undefined;
  const isDesktop = !/Android|Mobile|iPhone|iPad/i.test(ua);

  const win = window as unknown as {
    LanguageModel?: { availability?: () => Promise<string> };
    ai?: { languageModel?: unknown };
  };

  const promptApiDetected = Boolean(win.LanguageModel || win.ai?.languageModel);
  const browserSupported = Boolean(isDesktop && chromeVersion && chromeVersion >= 138);

  return {
    browserSupported,
    promptApiDetected,
    chromeVersion,
  };
}

export function createHybridModel(
  mode: HybridInferenceMode,
  cloudModelId: string,
  maxOutputTokens = 2048
): GenerativeModel {
  return getGenerativeModel(ai, {
    mode: toSdkInferenceMode(mode),
    inCloudParams: {
      model: cloudModelId,
      generationConfig: {
        maxOutputTokens,
        temperature: 0.2,
      },
    },
  });
}

export function createCloudModel(
  cloudModelId: string,
  systemInstruction?: string,
  maxOutputTokens = 2048
): GenerativeModel {
  return getGenerativeModel(ai, {
    model: cloudModelId,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      maxOutputTokens,
      temperature: 0.25,
    },
  });
}

/**
 * Must be invoked from a genuine user gesture (click / keypress).
 * Uses Firebase AI Logic's official initializeDeviceModel(progress => ...) API.
 */
export async function initializeOnDeviceModel(
  cloudModelId: string,
  onProgress: (state: Partial<DeviceModelState>) => void
): Promise<DeviceModelState> {
  const cap = detectBrowserOnDeviceCapability();
  onProgress({
    ...cap,
    status: 'downloading',
    downloadProgress: 0,
    errorMessage: undefined,
  });

  const model = createHybridModel('prefer_on_device', cloudModelId);

  try {
    await model.initializeDeviceModel((progressValue: number) => {
      const clamped = Math.max(0, Math.min(1, Number.isFinite(progressValue) ? progressValue : 0));
      onProgress({
        ...cap,
        status: clamped < 1 ? 'downloading' : 'ready',
        downloadProgress: clamped,
      });
    });

    const finalState: DeviceModelState = {
      ...cap,
      status: 'ready',
      downloadProgress: 1,
    };
    onProgress(finalState);
    return finalState;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'On-device model is unavailable in this browser environment.';
    const finalState: DeviceModelState = {
      ...cap,
      status: cap.promptApiDetected ? 'error' : 'unavailable',
      downloadProgress: 0,
      errorMessage: message,
    };
    onProgress(finalState);
    return finalState;
  }
}

export interface HybridGenerationResult {
  text: string;
  inferenceSource: 'on_device' | 'in_cloud';
  usedFallback: boolean;
  latencyMs: number;
}

export async function runHybridGeneration(params: {
  prompt: string | Array<string | Part>;
  mode: HybridInferenceMode;
  cloudModelId: string;
  maxOutputTokens?: number;
}): Promise<HybridGenerationResult> {
  const started = performance.now();
  const model = createHybridModel(params.mode, params.cloudModelId, params.maxOutputTokens ?? 2048);
  const result = await model.generateContent(params.prompt);
  const latencyMs = Math.round(performance.now() - started);
  const inferenceSource = normalizeInferenceSource(result.response.inferenceSource);
  const usedFallback =
    (params.mode === 'prefer_on_device' && inferenceSource === 'in_cloud') ||
    (params.mode === 'prefer_in_cloud' && inferenceSource === 'on_device');

  return {
    text: result.response.text(),
    inferenceSource,
    usedFallback,
    latencyMs,
  };
}

export async function runCloudChatTurn(params: {
  cloudModelId: string;
  systemInstruction: string;
  history: Array<{ role: 'user' | 'model'; parts: Array<{ type: 'text'; text: string }> }>;
  userMessage: string;
  maxOutputTokens?: number;
}): Promise<HybridGenerationResult> {
  const started = performance.now();
  const model = createCloudModel(
    params.cloudModelId,
    params.systemInstruction,
    params.maxOutputTokens ?? 2048
  );
  const chat = model.startChat({ history: params.history });
  const result = await chat.sendMessage(params.userMessage);
  const latencyMs = Math.round(performance.now() - started);
  const inferenceSource = normalizeInferenceSource(result.response.inferenceSource);

  return {
    text: result.response.text(),
    inferenceSource,
    usedFallback: false,
    latencyMs,
  };
}
