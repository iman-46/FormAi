import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import type { AIOperationType, HybridInferenceMode } from '../types';
import type { AIExecutionMeta } from '../services/hybridAIService';

export function useHybridRunner() {
  const {
    preferences,
    deviceModelState,
    requestCloudConsent,
    setAiProcessingState,
    recordAiTelemetry,
  } = useApp();

  const resolveExecutionMode = useCallback(
    async (params: {
      operation: AIOperationType;
      requestedMode?: HybridInferenceMode;
      requiresCloud?: boolean;
      reason: string;
    }): Promise<HybridInferenceMode | null> => {
      const mode = params.requestedMode ?? preferences.defaultInferenceMode;

      if (params.requiresCloud) {
        const decision = await requestCloudConsent(params.reason, false);
        return decision === 'cloud' ? 'only_in_cloud' : null;
      }

      if (mode === 'only_on_device') {
        return 'only_on_device';
      }

      // If PREFER_ON_DEVICE and device model is already ready locally, run without forcing cloud consent first;
      // otherwise if fallback or cloud is likely, ask session consent once with an option to force local-only.
      const deviceLikelyUnavailable = deviceModelState.status !== 'ready';
      if (mode === 'prefer_in_cloud' || mode === 'only_in_cloud' || deviceLikelyUnavailable) {
        const decision = await requestCloudConsent(
          params.reason,
          true
        );
        if (decision === 'cancel') return null;
        if (decision === 'local_only') return 'only_on_device';
        return mode;
      }

      return mode;
    },
    [deviceModelState.status, preferences.defaultInferenceMode, requestCloudConsent]
  );

  const executeTrackedTask = useCallback(
    async <T>(params: {
      operation: AIOperationType;
      docId?: string;
      docTitle?: string;
      requestedMode?: HybridInferenceMode;
      requiresCloud?: boolean;
      consentReason: string;
      run: (effectiveMode: HybridInferenceMode) => Promise<{ data: T; meta: AIExecutionMeta }>;
    }): Promise<{ data: T; meta: AIExecutionMeta } | null> => {
      const effectiveMode = await resolveExecutionMode({
        operation: params.operation,
        requestedMode: params.requestedMode,
        requiresCloud: params.requiresCloud,
        reason: params.consentReason,
      });

      if (!effectiveMode) {
        return null;
      }

      setAiProcessingState(
        effectiveMode === 'only_on_device' ? 'LOCAL_AI' : 'CLOUD_AI',
        `Running ${params.operation.replace('_', ' ')} (${effectiveMode.replace(/_/g, ' ')})...`
      );

      try {
        const result = await params.run(effectiveMode);
        await recordAiTelemetry({
          meta: result.meta,
          docId: params.docId,
          docTitle: params.docTitle,
          operation: params.operation,
          requestedMode: effectiveMode,
          status: 'success',
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI inference failed.';
        await recordAiTelemetry({
          docId: params.docId,
          docTitle: params.docTitle,
          operation: params.operation,
          requestedMode: effectiveMode,
          status: 'error',
          errorMessage: message,
        });
        throw err;
      }
    },
    [recordAiTelemetry, resolveExecutionMode, setAiProcessingState]
  );

  return { executeTrackedTask };
}
