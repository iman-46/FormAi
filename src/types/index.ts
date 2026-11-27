export type ThemeMode = 'light' | 'dark';

export type HybridInferenceMode =
  | 'prefer_on_device'
  | 'prefer_in_cloud'
  | 'only_on_device'
  | 'only_in_cloud';

export type RecordedInferenceSource = 'on_device' | 'in_cloud' | 'none' | 'error';

export type AIStatusState = 'IDLE' | 'INITIALIZING' | 'LOCAL_AI' | 'CLOUD_AI' | 'FALLBACK' | 'ERROR';

export type SimplificationLevel = 'very_simple' | 'standard' | 'detailed';

export type SupportedLanguage = 'Simple English' | 'Hindi' | 'Bengali' | 'Spanish' | 'French';

export type RequirementStatus = 'available' | 'missing' | 'not_applicable' | 'needs_verification';

export type DeadlineCategory = 'application' | 'verification' | 'payment' | 'exam' | 'interview' | 'event';

export type TaskPriority = 'high' | 'medium' | 'low';

export type AIOperationType =
  | 'summarize'
  | 'simplify'
  | 'action_plan'
  | 'deadlines'
  | 'requirements'
  | 'translate'
  | 'chat'
  | 'compare'
  | 'ocr';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPreferences {
  userId: string;
  theme: ThemeMode;
  defaultInferenceMode: HybridInferenceMode;
  preferredLanguage: SupportedLanguage;
  autoSaveToFirestore: boolean;
  saveExtractedText: boolean;
  updatedAt?: unknown;
}

export interface SimplifiedClause {
  originalClause: string;
  simplifiedExplanation: string;
  whyItMatters: string;
  whatUserShouldDo: string;
  sectionReference?: string;
}

export interface WorkspaceDocument {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  pageCount: number;
  extractionStatus: 'ready' | 'needs_ocr' | 'error' | 'processing';
  isScanned: boolean;
  isDemo: boolean;
  extractedText?: string;
  summary?: string;
  simplificationLevel?: SimplificationLevel;
  simplifiedLanguage?: string;
  simplifiedClauses?: SimplifiedClause[];
  lastInferenceSource?: 'on_device' | 'in_cloud' | 'none';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActionTask {
  id: string;
  userId: string;
  docId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  completed: boolean;
  deadline?: string;
  sourceReference?: string;
  order: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RequirementItem {
  id: string;
  userId: string;
  docId: string;
  name: string;
  mandatory: boolean;
  status: RequirementStatus;
  sourceQuote?: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DeadlineEvent {
  id: string;
  userId: string;
  docId: string;
  title: string;
  category: DeadlineCategory;
  dateText: string;
  isoDate?: string;
  needsVerification: boolean;
  sourceQuote?: string;
  addedToTasks: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  userId: string;
  docId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  uncertain: boolean;
  inferenceSource: 'on_device' | 'in_cloud' | 'none';
  createdAt?: unknown;
}

export interface AiActivityLog {
  id: string;
  userId: string;
  docId?: string;
  docTitle?: string;
  operation: AIOperationType;
  requestedMode: HybridInferenceMode;
  inferenceSource: 'on_device' | 'in_cloud' | 'error';
  usedFallback: boolean;
  modelId: string;
  latencyMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
  createdAt?: unknown;
}

export interface DocumentComparison {
  id: string;
  userId: string;
  docAId: string;
  docATitle: string;
  docBId: string;
  docBTitle: string;
  similarities: string[];
  differences: string[];
  changedDeadlines: string[];
  differentRequirements: string[];
  conflictingInstructions: string[];
  importantChanges: string[];
  inferenceSource: 'on_device' | 'in_cloud';
  createdAt?: unknown;
}

export interface RemoteConfigSettings {
  cloudModelId: string;
  defaultInferenceMode: HybridInferenceMode;
  maxInputChars: number;
  maxOutputTokens: number;
  supportedLanguages: SupportedLanguage[];
  enableDocumentCompare: boolean;
  enableMultiLanguage: boolean;
  enableCloudOcr: boolean;
  source: 'remote_config' | 'defaults';
  lastFetchedAt?: number;
}

export interface DeviceModelState {
  browserSupported: boolean;
  promptApiDetected: boolean;
  chromeVersion?: number;
  status: 'uninitialized' | 'downloading' | 'ready' | 'unavailable' | 'error';
  downloadProgress: number; // 0 to 1
  errorMessage?: string;
}

export interface AppCheckState {
  initialized: boolean;
  mode: 'debug' | 'recaptcha_v3' | 'unconfigured';
  debugEnabled: boolean;
  tokenPreview?: string;
  error?: string;
}
