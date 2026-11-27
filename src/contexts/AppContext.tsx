import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import {
  subscribeToAuthState,
  logoutUser,
  refreshCurrentUser,
} from '../firebase/auth';
import {
  subscribeAppCheckState,
  verifyAppCheckToken,
} from '../firebase/appCheck';
import {
  DEFAULT_REMOTE_CONFIG,
  fetchRemoteConfigSettings,
} from '../firebase/remoteConfig';
import {
  detectBrowserOnDeviceCapability,
  initializeOnDeviceModel,
} from '../firebase/aiLogic';
import {
  upsertUserProfile,
  fetchUserPreferences,
  saveUserPreferences,
  subscribeUserDocuments,
  saveWorkspaceDocument,
  deleteWorkspaceDocument,
  subscribeDocumentSubcollection,
  saveActionTask,
  toggleActionTask as fsToggleTask,
  deleteActionTask as fsDeleteTask,
  saveRequirementItem,
  saveDeadlineEvent,
  saveChatMessage,
  subscribeAiLogs,
  saveAiActivityLog,
  subscribeComparisons,
  saveDocumentComparison,
} from '../firebase/firestore';
import {
  createDemoAddendumRecord,
  createDemoDocumentRecord,
} from '../services/demoData';
import type {
  AIStatusState,
  ActionTask,
  AiActivityLog,
  AppCheckState,
  ChatMessage,
  DeadlineEvent,
  DeviceModelState,
  DocumentComparison,
  HybridInferenceMode,
  RemoteConfigSettings,
  RequirementItem,
  RequirementStatus,
  SupportedLanguage,
  ThemeMode,
  UserPreferences,
  WorkspaceDocument,
} from '../types';
import type { AIExecutionMeta } from '../services/hybridAIService';

interface CloudConsentRequest {
  reason: string;
  canRunLocalInstead: boolean;
  resolve: (decision: 'cloud' | 'local_only' | 'cancel') => void;
}

interface AppContextValue {
  user: User | null;
  authLoading: boolean;
  canSyncFirestore: boolean;
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  theme: ThemeMode;
  toggleTheme: () => void;
  remoteConfig: RemoteConfigSettings;
  refreshRemoteConfig: () => Promise<void>;
  appCheckState: AppCheckState;
  refreshAppCheck: () => Promise<AppCheckState>;
  deviceModelState: DeviceModelState;
  triggerDeviceModelInit: () => Promise<DeviceModelState>;
  aiStatus: AIStatusState;
  aiStatusDetail: string;
  setAiProcessingState: (status: AIStatusState, detail: string) => void;
  cloudConsentGranted: boolean;
  grantCloudConsent: () => void;
  revokeCloudConsent: () => void;
  pendingConsent: CloudConsentRequest | null;
  requestCloudConsent: (reason: string, canRunLocalInstead?: boolean) => Promise<'cloud' | 'local_only' | 'cancel'>;
  documents: WorkspaceDocument[];
  activeDocId: string | null;
  setActiveDocId: (id: string | null) => void;
  activeDoc: WorkspaceDocument | null;
  tasks: ActionTask[];
  allTasksByDoc: Record<string, ActionTask[]>;
  requirements: RequirementItem[];
  allRequirementsByDoc: Record<string, RequirementItem[]>;
  deadlines: DeadlineEvent[];
  allDeadlinesByDoc: Record<string, DeadlineEvent[]>;
  chatMessages: ChatMessage[];
  aiLogs: AiActivityLog[];
  comparisons: DocumentComparison[];
  scannedPreviews: Record<string, string>;
  setScannedPreview: (docId: string, base64: string) => void;
  addOrUpdateDocument: (docItem: WorkspaceDocument) => Promise<void>;
  removeDocument: (docId: string) => Promise<void>;
  replaceActionPlan: (docId: string, newTasks: ActionTask[]) => Promise<void>;
  addTask: (task: ActionTask) => Promise<void>;
  updateTask: (task: ActionTask) => Promise<void>;
  toggleTaskCompletion: (docId: string, taskId: string, completed: boolean) => Promise<void>;
  removeTask: (docId: string, taskId: string) => Promise<void>;
  replaceRequirements: (docId: string, items: RequirementItem[]) => Promise<void>;
  updateRequirementStatus: (docId: string, reqId: string, status: RequirementStatus, notes?: string) => Promise<void>;
  replaceDeadlines: (docId: string, items: DeadlineEvent[]) => Promise<void>;
  markDeadlineAddedToTask: (docId: string, deadlineId: string) => Promise<void>;
  appendChatMessage: (msg: ChatMessage) => Promise<void>;
  recordAiTelemetry: (params: {
    meta?: AIExecutionMeta;
    docId?: string;
    docTitle?: string;
    operation: AiActivityLog['operation'];
    requestedMode: HybridInferenceMode;
    status: 'success' | 'error';
    errorMessage?: string;
  }) => Promise<void>;
  saveComparison: (comparison: DocumentComparison) => Promise<void>;
  loadCompetitionDemo: (includeAddendum?: boolean) => Promise<WorkspaceDocument>;
  refreshAuthVerification: () => Promise<void>;
  signOutSession: () => Promise<void>;
  firestoreSyncError: string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const LOCAL_THEME_KEY = 'formwise_theme';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreSyncError, setFirestoreSyncError] = useState<string | null>(null);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    userId: 'guest',
    theme,
    defaultInferenceMode: 'prefer_on_device',
    preferredLanguage: 'Simple English',
    autoSaveToFirestore: true,
    saveExtractedText: true,
  });

  const [remoteConfig, setRemoteConfig] = useState<RemoteConfigSettings>(DEFAULT_REMOTE_CONFIG);
  const [appCheckState, setAppCheckState] = useState<AppCheckState>({
    initialized: false,
    mode: 'unconfigured',
    debugEnabled: false,
  });

  const [deviceModelState, setDeviceModelState] = useState<DeviceModelState>(() => {
    const cap = detectBrowserOnDeviceCapability();
    return {
      ...cap,
      status: cap.browserSupported ? 'uninitialized' : 'unavailable',
      downloadProgress: 0,
    };
  });

  const [aiStatus, setAiStatus] = useState<AIStatusState>('IDLE');
  const [aiStatusDetail, setAiStatusDetail] = useState<string>('Ready for hybrid inference.');

  const [cloudConsentGranted, setCloudConsentGranted] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<CloudConsentRequest | null>(null);

  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [allTasksByDoc, setAllTasksByDoc] = useState<Record<string, ActionTask[]>>({});
  const [allRequirementsByDoc, setAllRequirementsByDoc] = useState<Record<string, RequirementItem[]>>({});
  const [allDeadlinesByDoc, setAllDeadlinesByDoc] = useState<Record<string, DeadlineEvent[]>>({});
  const [chatsByDoc, setChatsByDoc] = useState<Record<string, ChatMessage[]>>({});
  const [aiLogs, setAiLogs] = useState<AiActivityLog[]>([]);
  const [comparisons, setComparisons] = useState<DocumentComparison[]>([]);
  const [scannedPreviews, setScannedPreviews] = useState<Record<string, string>>({});

  const canSyncFirestore = Boolean(user && user.emailVerified && preferences.autoSaveToFirestore);

  // Sync HTML .dark class cleanly
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(LOCAL_THEME_KEY, theme);
  }, [theme]);

  // Subscribe to App Check & fetch Remote Config on boot
  useEffect(() => {
    const unsubAppCheck = subscribeAppCheckState(setAppCheckState);
    void fetchRemoteConfigSettings().then((rc) => {
      setRemoteConfig(rc);
    });
    return unsubAppCheck;
  }, []);

  // Auth subscription & profile/preferences hydration
  useEffect(() => {
    const unsub = subscribeToAuthState(async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);

      if (!nextUser) {
        setDocuments([]);
        setActiveDocId(null);
        setAllTasksByDoc({});
        setAllRequirementsByDoc({});
        setAllDeadlinesByDoc({});
        setChatsByDoc({});
        setAiLogs([]);
        setComparisons([]);
        setFirestoreSyncError(null);
        return;
      }

      if (nextUser.emailVerified) {
        try {
          await upsertUserProfile({
            userId: nextUser.uid,
            email: nextUser.email || 'user@formwise.local',
            displayName: nextUser.displayName || nextUser.email?.split('@')[0] || 'FormWise User',
            photoURL: nextUser.photoURL || undefined,
          });
          const savedPrefs = await fetchUserPreferences(nextUser.uid);
          if (savedPrefs) {
            setPreferences(savedPrefs);
            setTheme(savedPrefs.theme);
          } else {
            const initialPrefs: UserPreferences = {
              userId: nextUser.uid,
              theme,
              defaultInferenceMode: remoteConfig.defaultInferenceMode,
              preferredLanguage: 'Simple English',
              autoSaveToFirestore: true,
              saveExtractedText: true,
            };
            setPreferences(initialPrefs);
            await saveUserPreferences(initialPrefs);
          }
          setFirestoreSyncError(null);
        } catch (err) {
          setFirestoreSyncError(err instanceof Error ? err.message : 'Unable to sync profile.');
        }
      } else {
        setPreferences((prev) => ({ ...prev, userId: nextUser.uid }));
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to Firestore top-level collections when verified & signed in
  useEffect(() => {
    if (!user || !user.emailVerified) return;

    const unsubDocs = subscribeUserDocuments(
      user.uid,
      (docs) => {
        setDocuments(docs);
        setActiveDocId((curr) => {
          if (curr && docs.some((d) => d.id === curr)) return curr;
          return docs[0]?.id ?? null;
        });
        setFirestoreSyncError(null);
      },
      (err) => setFirestoreSyncError(err.message)
    );

    const unsubLogs = subscribeAiLogs(
      user.uid,
      (logs) => setAiLogs(logs),
      (err) => setFirestoreSyncError(err.message)
    );

    const unsubComparisons = subscribeComparisons(
      user.uid,
      (items) => setComparisons(items),
      (err) => setFirestoreSyncError(err.message)
    );

    return () => {
      unsubDocs();
      unsubLogs();
      unsubComparisons();
    };
  }, [user]);

  // Subscribe to subcollections for the active document
  useEffect(() => {
    if (!user || !user.emailVerified || !activeDocId) return;

    const unsubTasks = subscribeDocumentSubcollection<ActionTask>(
      user.uid,
      activeDocId,
      'tasks',
      (items) => setAllTasksByDoc((prev) => ({ ...prev, [activeDocId]: items }))
    );
    const unsubReqs = subscribeDocumentSubcollection<RequirementItem>(
      user.uid,
      activeDocId,
      'requirements',
      (items) => setAllRequirementsByDoc((prev) => ({ ...prev, [activeDocId]: items }))
    );
    const unsubDeadlines = subscribeDocumentSubcollection<DeadlineEvent>(
      user.uid,
      activeDocId,
      'deadlines',
      (items) => setAllDeadlinesByDoc((prev) => ({ ...prev, [activeDocId]: items }))
    );
    const unsubChats = subscribeDocumentSubcollection<ChatMessage>(
      user.uid,
      activeDocId,
      'chats',
      (items) => setChatsByDoc((prev) => ({ ...prev, [activeDocId]: items }))
    );

    return () => {
      unsubTasks();
      unsubReqs();
      unsubDeadlines();
      unsubChats();
    };
  }, [user, activeDocId]);

  const activeDoc = documents.find((d) => d.id === activeDocId) ?? null;
  const tasks = activeDocId ? allTasksByDoc[activeDocId] ?? [] : [];
  const requirements = activeDocId ? allRequirementsByDoc[activeDocId] ?? [] : [];
  const deadlines = activeDocId ? allDeadlinesByDoc[activeDocId] ?? [] : [];
  const chatMessages = activeDocId ? chatsByDoc[activeDocId] ?? [] : [];

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const next: UserPreferences = {
        ...preferences,
        ...patch,
        userId: user?.uid || 'guest',
      };
      setPreferences(next);
      if (patch.theme) {
        setTheme(patch.theme);
      }
      if (user && user.emailVerified) {
        await saveUserPreferences(next);
      }
    },
    [preferences, user]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
    void updatePreferences({ theme: nextTheme });
  }, [theme, updatePreferences]);

  const refreshRemoteConfig = useCallback(async () => {
    const next = await fetchRemoteConfigSettings();
    setRemoteConfig(next);
  }, []);

  const refreshAppCheck = useCallback(async () => {
    const state = await verifyAppCheckToken();
    setAppCheckState(state);
    return state;
  }, []);

  const triggerDeviceModelInit = useCallback(async () => {
    setAiStatus('INITIALIZING');
    setAiStatusDetail('Preparing on-device model via Firebase AI Logic...');
    const result = await initializeOnDeviceModel(remoteConfig.cloudModelId, (partial) => {
      setDeviceModelState((prev) => ({ ...prev, ...partial }));
    });
    if (result.status === 'ready') {
      setAiStatus('LOCAL_AI');
      setAiStatusDetail('On-device model ready for local inference.');
    } else {
      setAiStatus('FALLBACK');
      setAiStatusDetail(
        result.errorMessage || 'On-device model unavailable; cloud fallback ready.'
      );
    }
    return result;
  }, [remoteConfig.cloudModelId]);

  const setAiProcessingState = useCallback((status: AIStatusState, detail: string) => {
    setAiStatus(status);
    setAiStatusDetail(detail);
  }, []);

  const consentRef = useRef(cloudConsentGranted);
  consentRef.current = cloudConsentGranted;

  const requestCloudConsent = useCallback(
    (reason: string, canRunLocalInstead = false): Promise<'cloud' | 'local_only' | 'cancel'> => {
      if (consentRef.current) {
        return Promise.resolve('cloud');
      }
      return new Promise((resolve) => {
        setPendingConsent({
          reason,
          canRunLocalInstead,
          resolve: (decision) => {
            if (decision === 'cloud') {
              setCloudConsentGranted(true);
            }
            setPendingConsent(null);
            resolve(decision);
          },
        });
      });
    },
    []
  );

  const setScannedPreview = useCallback((docId: string, base64: string) => {
    setScannedPreviews((prev) => ({ ...prev, [docId]: base64 }));
  }, []);

  const addOrUpdateDocument = useCallback(
    async (docItem: WorkspaceDocument) => {
      setDocuments((prev) => {
        const exists = prev.some((d) => d.id === docItem.id);
        if (exists) {
          return prev.map((d) => (d.id === docItem.id ? { ...d, ...docItem } : d));
        }
        return [docItem, ...prev];
      });
      setActiveDocId(docItem.id);

      if (canSyncFirestore && user) {
        await saveWorkspaceDocument(user.uid, docItem, preferences.saveExtractedText);
      }
    },
    [canSyncFirestore, user, preferences.saveExtractedText]
  );

  const removeDocument = useCallback(
    async (docId: string) => {
      setDocuments((prev) => {
        const remaining = prev.filter((d) => d.id !== docId);
        if (activeDocId === docId) {
          setActiveDocId(remaining[0]?.id ?? null);
        }
        return remaining;
      });
      if (user && user.emailVerified) {
        await deleteWorkspaceDocument(user.uid, docId);
      }
    },
    [activeDocId, user]
  );

  const replaceActionPlan = useCallback(
    async (docId: string, newTasks: ActionTask[]) => {
      const existing = allTasksByDoc[docId] ?? [];
      setAllTasksByDoc((prev) => ({ ...prev, [docId]: newTasks }));
      if (canSyncFirestore && user) {
        for (const old of existing) {
          await fsDeleteTask(user.uid, docId, old.id);
        }
        for (const t of newTasks) {
          await saveActionTask(user.uid, t);
        }
      }
    },
    [allTasksByDoc, canSyncFirestore, user]
  );

  const addTask = useCallback(
    async (task: ActionTask) => {
      setAllTasksByDoc((prev) => ({
        ...prev,
        [task.docId]: [...(prev[task.docId] ?? []), task],
      }));
      if (canSyncFirestore && user) {
        await saveActionTask(user.uid, task);
      }
    },
    [canSyncFirestore, user]
  );

  const updateTask = useCallback(
    async (task: ActionTask) => {
      setAllTasksByDoc((prev) => ({
        ...prev,
        [task.docId]: (prev[task.docId] ?? []).map((t) => (t.id === task.id ? task : t)),
      }));
      if (canSyncFirestore && user) {
        await saveActionTask(user.uid, task);
      }
    },
    [canSyncFirestore, user]
  );

  const toggleTaskCompletion = useCallback(
    async (docId: string, taskId: string, completed: boolean) => {
      setAllTasksByDoc((prev) => ({
        ...prev,
        [docId]: (prev[docId] ?? []).map((t) => (t.id === taskId ? { ...t, completed } : t)),
      }));
      if (canSyncFirestore && user) {
        await fsToggleTask(user.uid, docId, taskId, completed);
      }
    },
    [canSyncFirestore, user]
  );

  const removeTask = useCallback(
    async (docId: string, taskId: string) => {
      setAllTasksByDoc((prev) => ({
        ...prev,
        [docId]: (prev[docId] ?? []).filter((t) => t.id !== taskId),
      }));
      if (canSyncFirestore && user) {
        await fsDeleteTask(user.uid, docId, taskId);
      }
    },
    [canSyncFirestore, user]
  );

  const replaceRequirements = useCallback(
    async (docId: string, items: RequirementItem[]) => {
      setAllRequirementsByDoc((prev) => ({ ...prev, [docId]: items }));
      if (canSyncFirestore && user) {
        for (const item of items) {
          await saveRequirementItem(user.uid, item);
        }
      }
    },
    [canSyncFirestore, user]
  );

  const updateRequirementStatus = useCallback(
    async (docId: string, reqId: string, status: RequirementStatus, notes?: string) => {
      let target: RequirementItem | undefined;
      setAllRequirementsByDoc((prev) => ({
        ...prev,
        [docId]: (prev[docId] ?? []).map((r) => {
          if (r.id === reqId) {
            target = { ...r, status, ...(notes !== undefined ? { notes } : {}) };
            return target;
          }
          return r;
        }),
      }));
      if (canSyncFirestore && user && target) {
        await saveRequirementItem(user.uid, target);
      }
    },
    [canSyncFirestore, user]
  );

  const replaceDeadlines = useCallback(
    async (docId: string, items: DeadlineEvent[]) => {
      setAllDeadlinesByDoc((prev) => ({ ...prev, [docId]: items }));
      if (canSyncFirestore && user) {
        for (const item of items) {
          await saveDeadlineEvent(user.uid, item);
        }
      }
    },
    [canSyncFirestore, user]
  );

  const markDeadlineAddedToTask = useCallback(
    async (docId: string, deadlineId: string) => {
      let target: DeadlineEvent | undefined;
      setAllDeadlinesByDoc((prev) => ({
        ...prev,
        [docId]: (prev[docId] ?? []).map((d) => {
          if (d.id === deadlineId) {
            target = { ...d, addedToTasks: true };
            return target;
          }
          return d;
        }),
      }));
      if (canSyncFirestore && user && target) {
        await saveDeadlineEvent(user.uid, target);
      }
    },
    [canSyncFirestore, user]
  );

  const appendChatMessage = useCallback(
    async (msg: ChatMessage) => {
      setChatsByDoc((prev) => ({
        ...prev,
        [msg.docId]: [...(prev[msg.docId] ?? []), msg],
      }));
      if (canSyncFirestore && user) {
        await saveChatMessage(user.uid, msg);
      }
    },
    [canSyncFirestore, user]
  );

  const recordAiTelemetry = useCallback(
    async (params: {
      meta?: AIExecutionMeta;
      docId?: string;
      docTitle?: string;
      operation: AiActivityLog['operation'];
      requestedMode: HybridInferenceMode;
      status: 'success' | 'error';
      errorMessage?: string;
    }) => {
      const source: AiActivityLog['inferenceSource'] =
        params.status === 'error'
          ? 'error'
          : params.meta?.inferenceSource ?? 'in_cloud';

      if (params.status === 'error') {
        setAiStatus('ERROR');
        setAiStatusDetail(params.errorMessage || 'AI processing failed.');
      } else if (params.meta?.usedFallback && source === 'in_cloud') {
        setAiStatus('FALLBACK');
        setAiStatusDetail(
          `Cloud fallback (${params.meta.modelId}) ran because local inference was unavailable or unsuitable.`
        );
      } else if (source === 'on_device') {
        setAiStatus('LOCAL_AI');
        setAiStatusDetail('Processed locally on your device via Chrome AI.');
      } else {
        setAiStatus('CLOUD_AI');
        setAiStatusDetail(`Processed via Firebase AI Logic (${params.meta?.modelId || remoteConfig.cloudModelId}).`);
      }

      const logItem: AiActivityLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: user?.uid || 'guest',
        docId: params.docId,
        docTitle: params.docTitle,
        operation: params.operation,
        requestedMode: params.requestedMode,
        inferenceSource: source,
        usedFallback: Boolean(params.meta?.usedFallback),
        modelId: params.meta?.modelId || remoteConfig.cloudModelId,
        latencyMs: params.meta?.latencyMs ?? 0,
        status: params.status,
        errorMessage: params.errorMessage,
        createdAt: new Date().toISOString(),
      };

      setAiLogs((prev) => [logItem, ...prev].slice(0, 100));
      if (canSyncFirestore && user) {
        await saveAiActivityLog(user.uid, logItem);
      }
    },
    [canSyncFirestore, remoteConfig.cloudModelId, user]
  );

  const saveComparison = useCallback(
    async (comparison: DocumentComparison) => {
      setComparisons((prev) => [comparison, ...prev]);
      if (canSyncFirestore && user) {
        await saveDocumentComparison(user.uid, comparison);
      }
    },
    [canSyncFirestore, user]
  );

  const loadCompetitionDemo = useCallback(
    async (includeAddendum = false) => {
      const uid = user?.uid || 'demo_user';
      const primaryDemo = createDemoDocumentRecord(uid);
      await addOrUpdateDocument(primaryDemo);
      if (includeAddendum) {
        const addendumDemo = createDemoAddendumRecord(uid);
        await addOrUpdateDocument(addendumDemo);
        setActiveDocId(primaryDemo.id);
      }
      return primaryDemo;
    },
    [addOrUpdateDocument, user]
  );

  const refreshAuthVerification = useCallback(async () => {
    const refreshed = await refreshCurrentUser();
    if (refreshed) {
      setUser({ ...refreshed } as User);
    }
  }, []);

  const signOutSession = useCallback(async () => {
    setCloudConsentGranted(false);
    await logoutUser();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        canSyncFirestore,
        preferences,
        updatePreferences,
        theme,
        toggleTheme,
        remoteConfig,
        refreshRemoteConfig,
        appCheckState,
        refreshAppCheck,
        deviceModelState,
        triggerDeviceModelInit,
        aiStatus,
        aiStatusDetail,
        setAiProcessingState,
        cloudConsentGranted,
        grantCloudConsent: () => setCloudConsentGranted(true),
        revokeCloudConsent: () => setCloudConsentGranted(false),
        pendingConsent,
        requestCloudConsent,
        documents,
        activeDocId,
        setActiveDocId,
        activeDoc,
        tasks,
        allTasksByDoc,
        requirements,
        allRequirementsByDoc,
        deadlines,
        allDeadlinesByDoc,
        chatMessages,
        aiLogs,
        comparisons,
        scannedPreviews,
        setScannedPreview,
        addOrUpdateDocument,
        removeDocument,
        replaceActionPlan,
        addTask,
        updateTask,
        toggleTaskCompletion,
        removeTask,
        replaceRequirements,
        updateRequirementStatus,
        replaceDeadlines,
        markDeadlineAddedToTask,
        appendChatMessage,
        recordAiTelemetry,
        saveComparison,
        loadCompetitionDemo,
        refreshAuthVerification,
        signOutSession,
        firestoreSyncError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
