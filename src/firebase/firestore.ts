import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { firebaseApp, typedFirebaseConfig } from './config';
import { auth } from './auth';
import './appCheck';
import type {
  UserProfile,
  UserPreferences,
  WorkspaceDocument,
  ActionTask,
  RequirementItem,
  DeadlineEvent,
  ChatMessage,
  AiActivityLog,
  DocumentComparison,
} from '../types';

export const db = getFirestore(
  firebaseApp,
  typedFirebaseConfig.firestoreDatabaseId || '(default)'
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

void testConnection();

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `id_${Date.now()}`;
}

function clampString(value: string | undefined, max: number): string {
  if (!value) return '';
  return value.slice(0, max);
}

// ---------------------------------------------------------
// User Profile & Preferences
// ---------------------------------------------------------
export async function upsertUserProfile(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
  const path = `users/${profile.userId}`;
  try {
    const ref = doc(db, 'users', profile.userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        userId: profile.userId,
        email: clampString(profile.email, 254),
        displayName: clampString(profile.displayName || 'FormWise User', 120),
        ...(profile.photoURL ? { photoURL: clampString(profile.photoURL, 512) } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName: clampString(profile.displayName || 'FormWise User', 120),
        ...(profile.photoURL ? { photoURL: clampString(profile.photoURL, 512) } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserPreferences(userId: string): Promise<UserPreferences | null> {
  const path = `users/${userId}/preferences/settings`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'preferences', 'settings'));
    if (!snap.exists()) return null;
    return snap.data() as UserPreferences;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserPreferences(prefs: Omit<UserPreferences, 'updatedAt'>): Promise<void> {
  const path = `users/${prefs.userId}/preferences/settings`;
  try {
    const ref = doc(db, 'users', prefs.userId, 'preferences', 'settings');
    await setDoc(ref, {
      userId: prefs.userId,
      theme: prefs.theme,
      defaultInferenceMode: prefs.defaultInferenceMode,
      preferredLanguage: prefs.preferredLanguage,
      autoSaveToFirestore: prefs.autoSaveToFirestore,
      saveExtractedText: prefs.saveExtractedText,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ---------------------------------------------------------
// Documents
// ---------------------------------------------------------
export function subscribeUserDocuments(
  userId: string,
  onData: (docs: WorkspaceDocument[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/documents`;
  const q = query(
    collection(db, 'users', userId, 'documents'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const docs: WorkspaceDocument[] = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<WorkspaceDocument, 'id'>),
        id: d.id,
      }));
      onData(docs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveWorkspaceDocument(
  userId: string,
  docItem: WorkspaceDocument,
  includeExtractedText: boolean
): Promise<void> {
  const docId = sanitizeId(docItem.id);
  const path = `users/${userId}/documents/${docId}`;
  try {
    const ref = doc(db, 'users', userId, 'documents', docId);
    const snap = await getDoc(ref);
    const payload: Record<string, unknown> = {
      userId,
      title: clampString(docItem.title, 240) || 'Untitled Document',
      fileName: clampString(docItem.fileName, 240) || 'document.txt',
      mimeType: clampString(docItem.mimeType, 120) || 'text/plain',
      fileSize: Math.max(0, Math.min(docItem.fileSize || 0, 104857600)),
      pageCount: Math.max(0, Math.min(docItem.pageCount || 1, 5000)),
      extractionStatus: docItem.extractionStatus,
      isScanned: Boolean(docItem.isScanned),
      isDemo: Boolean(docItem.isDemo),
      updatedAt: serverTimestamp(),
    };

    if (includeExtractedText && docItem.extractedText !== undefined) {
      payload.extractedText = clampString(docItem.extractedText, 250000);
    }
    if (docItem.summary !== undefined) {
      payload.summary = clampString(docItem.summary, 20000);
    }
    if (docItem.simplificationLevel !== undefined) {
      payload.simplificationLevel = docItem.simplificationLevel;
    }
    if (docItem.simplifiedLanguage !== undefined) {
      payload.simplifiedLanguage = clampString(docItem.simplifiedLanguage, 40);
    }
    if (docItem.simplifiedClauses !== undefined) {
      payload.simplifiedClauses = docItem.simplifiedClauses.slice(0, 40);
    }
    if (docItem.lastInferenceSource !== undefined) {
      payload.lastInferenceSource = docItem.lastInferenceSource;
    }

    if (!snap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      const updatePayload: Record<string, unknown> = {
        title: payload.title,
        updatedAt: serverTimestamp(),
      };
      if (payload.extractedText !== undefined) updatePayload.extractedText = payload.extractedText;
      if (payload.summary !== undefined) updatePayload.summary = payload.summary;
      if (payload.simplificationLevel !== undefined) updatePayload.simplificationLevel = payload.simplificationLevel;
      if (payload.simplifiedLanguage !== undefined) updatePayload.simplifiedLanguage = payload.simplifiedLanguage;
      if (payload.simplifiedClauses !== undefined) updatePayload.simplifiedClauses = payload.simplifiedClauses;
      if (payload.lastInferenceSource !== undefined) updatePayload.lastInferenceSource = payload.lastInferenceSource;
      await updateDoc(ref, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteWorkspaceDocument(userId: string, docId: string): Promise<void> {
  const safeDocId = sanitizeId(docId);
  const path = `users/${userId}/documents/${safeDocId}`;
  try {
    const subcollections = ['tasks', 'requirements', 'deadlines', 'chats'] as const;
    for (const sub of subcollections) {
      const subQ = query(
        collection(db, 'users', userId, 'documents', safeDocId, sub),
        where('userId', '==', userId)
      );
      const snap = await getDocs(subQ);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    await deleteDoc(doc(db, 'users', userId, 'documents', safeDocId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------
// Subcollections: Tasks, Requirements, Deadlines, Chats
// ---------------------------------------------------------
export function subscribeDocumentSubcollection<T extends { id: string }>(
  userId: string,
  docId: string,
  subcollection: 'tasks' | 'requirements' | 'deadlines' | 'chats',
  onData: (items: T[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const safeDocId = sanitizeId(docId);
  const path = `users/${userId}/documents/${safeDocId}/${subcollection}`;
  const orderField = subcollection === 'tasks' ? 'order' : 'createdAt';
  const q = query(
    collection(db, 'users', userId, 'documents', safeDocId, subcollection),
    where('userId', '==', userId),
    orderBy(orderField, 'asc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<T, 'id'>),
        id: d.id,
      })) as T[];
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveActionTask(userId: string, task: ActionTask): Promise<void> {
  const safeDocId = sanitizeId(task.docId);
  const safeTaskId = sanitizeId(task.id);
  const path = `users/${userId}/documents/${safeDocId}/tasks/${safeTaskId}`;
  try {
    const ref = doc(db, 'users', userId, 'documents', safeDocId, 'tasks', safeTaskId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        userId,
        docId: safeDocId,
        title: clampString(task.title, 240) || 'Action item',
        description: clampString(task.description, 2000),
        priority: task.priority,
        completed: Boolean(task.completed),
        ...(task.deadline ? { deadline: clampString(task.deadline, 64) } : {}),
        ...(task.sourceReference ? { sourceReference: clampString(task.sourceReference, 400) } : {}),
        order: Math.max(0, Math.min(task.order, 10000)),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        title: clampString(task.title, 240) || 'Action item',
        description: clampString(task.description, 2000),
        priority: task.priority,
        completed: Boolean(task.completed),
        ...(task.deadline ? { deadline: clampString(task.deadline, 64) } : {}),
        ...(task.sourceReference ? { sourceReference: clampString(task.sourceReference, 400) } : {}),
        order: Math.max(0, Math.min(task.order, 10000)),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function toggleActionTask(userId: string, docId: string, taskId: string, completed: boolean): Promise<void> {
  const safeDocId = sanitizeId(docId);
  const safeTaskId = sanitizeId(taskId);
  const path = `users/${userId}/documents/${safeDocId}/tasks/${safeTaskId}`;
  try {
    await updateDoc(doc(db, 'users', userId, 'documents', safeDocId, 'tasks', safeTaskId), {
      completed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteActionTask(userId: string, docId: string, taskId: string): Promise<void> {
  const safeDocId = sanitizeId(docId);
  const safeTaskId = sanitizeId(taskId);
  const path = `users/${userId}/documents/${safeDocId}/tasks/${safeTaskId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'documents', safeDocId, 'tasks', safeTaskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveRequirementItem(userId: string, item: RequirementItem): Promise<void> {
  const safeDocId = sanitizeId(item.docId);
  const safeReqId = sanitizeId(item.id);
  const path = `users/${userId}/documents/${safeDocId}/requirements/${safeReqId}`;
  try {
    const ref = doc(db, 'users', userId, 'documents', safeDocId, 'requirements', safeReqId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        userId,
        docId: safeDocId,
        name: clampString(item.name, 240) || 'Required Document',
        mandatory: Boolean(item.mandatory),
        status: item.status,
        ...(item.sourceQuote ? { sourceQuote: clampString(item.sourceQuote, 600) } : {}),
        ...(item.notes ? { notes: clampString(item.notes, 1000) } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        status: item.status,
        ...(item.notes !== undefined ? { notes: clampString(item.notes, 1000) } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveDeadlineEvent(userId: string, item: DeadlineEvent): Promise<void> {
  const safeDocId = sanitizeId(item.docId);
  const safeId = sanitizeId(item.id);
  const path = `users/${userId}/documents/${safeDocId}/deadlines/${safeId}`;
  try {
    const ref = doc(db, 'users', userId, 'documents', safeDocId, 'deadlines', safeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        userId,
        docId: safeDocId,
        title: clampString(item.title, 240) || 'Important Date',
        category: item.category,
        dateText: clampString(item.dateText, 120) || 'Date TBD',
        ...(item.isoDate ? { isoDate: clampString(item.isoDate, 40) } : {}),
        needsVerification: Boolean(item.needsVerification),
        ...(item.sourceQuote ? { sourceQuote: clampString(item.sourceQuote, 600) } : {}),
        addedToTasks: Boolean(item.addedToTasks),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        addedToTasks: Boolean(item.addedToTasks),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveChatMessage(userId: string, msg: ChatMessage): Promise<void> {
  const safeDocId = sanitizeId(msg.docId);
  const safeMsgId = sanitizeId(msg.id);
  const path = `users/${userId}/documents/${safeDocId}/chats/${safeMsgId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'documents', safeDocId, 'chats', safeMsgId), {
      userId,
      docId: safeDocId,
      role: msg.role,
      content: clampString(msg.content, 20000),
      ...(msg.citations && msg.citations.length > 0 ? { citations: msg.citations.slice(0, 25) } : {}),
      uncertain: Boolean(msg.uncertain),
      inferenceSource: msg.inferenceSource,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// ---------------------------------------------------------
// AI Activity Logs & Comparisons
// ---------------------------------------------------------
export function subscribeAiLogs(
  userId: string,
  onData: (logs: AiActivityLog[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/aiLogs`;
  const q = query(
    collection(db, 'users', userId, 'aiLogs'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: AiActivityLog[] = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<AiActivityLog, 'id'>),
        id: d.id,
      }));
      onData(logs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveAiActivityLog(userId: string, logItem: AiActivityLog): Promise<void> {
  const safeLogId = sanitizeId(logItem.id);
  const path = `users/${userId}/aiLogs/${safeLogId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'aiLogs', safeLogId), {
      userId,
      ...(logItem.docId ? { docId: sanitizeId(logItem.docId) } : {}),
      ...(logItem.docTitle ? { docTitle: clampString(logItem.docTitle, 240) } : {}),
      operation: logItem.operation,
      requestedMode: logItem.requestedMode,
      inferenceSource: logItem.inferenceSource,
      usedFallback: Boolean(logItem.usedFallback),
      modelId: clampString(logItem.modelId, 120),
      latencyMs: Math.max(0, Math.min(Math.round(logItem.latencyMs), 600000)),
      status: logItem.status,
      ...(logItem.errorMessage ? { errorMessage: clampString(logItem.errorMessage, 500) } : {}),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function saveDocumentComparison(userId: string, comparison: DocumentComparison): Promise<void> {
  const safeId = sanitizeId(comparison.id);
  const path = `users/${userId}/comparisons/${safeId}`;
  try {
    await setDoc(doc(db, 'users', userId, 'comparisons', safeId), {
      userId,
      docAId: sanitizeId(comparison.docAId),
      docATitle: clampString(comparison.docATitle, 240),
      docBId: sanitizeId(comparison.docBId),
      docBTitle: clampString(comparison.docBTitle, 240),
      similarities: comparison.similarities.slice(0, 40),
      differences: comparison.differences.slice(0, 40),
      changedDeadlines: comparison.changedDeadlines.slice(0, 40),
      differentRequirements: comparison.differentRequirements.slice(0, 40),
      conflictingInstructions: comparison.conflictingInstructions.slice(0, 40),
      importantChanges: comparison.importantChanges.slice(0, 40),
      inferenceSource: comparison.inferenceSource,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeComparisons(
  userId: string,
  onData: (items: DocumentComparison[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${userId}/comparisons`;
  const q = query(
    collection(db, 'users', userId, 'comparisons'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: DocumentComparison[] = snapshot.docs.map((d) => ({
        ...(d.data() as Omit<DocumentComparison, 'id'>),
        id: d.id,
      }));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}
