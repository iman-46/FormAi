import {
  runCloudChatTurn,
  runHybridGeneration,
  type HybridGenerationResult,
} from '../firebase/aiLogic';
import { parseJsonFromModelText } from '../utils/jsonParser';
import type {
  AIOperationType,
  ActionTask,
  DeadlineCategory,
  DeadlineEvent,
  DocumentComparison,
  HybridInferenceMode,
  RemoteConfigSettings,
  RequirementItem,
  SimplifiedClause,
  SimplificationLevel,
  SupportedLanguage,
  TaskPriority,
} from '../types';

export interface AIExecutionMeta {
  operation: AIOperationType;
  requestedMode: HybridInferenceMode;
  inferenceSource: 'on_device' | 'in_cloud';
  usedFallback: boolean;
  latencyMs: number;
  modelId: string;
}

export interface SimplificationOutput {
  summary: string;
  clauses: SimplifiedClause[];
  meta: AIExecutionMeta;
}

function clampInput(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[Document truncated at ${maxChars} characters per Remote Config limit]`;
}

function buildMeta(
  operation: AIOperationType,
  requestedMode: HybridInferenceMode,
  modelId: string,
  res: HybridGenerationResult
): AIExecutionMeta {
  return {
    operation,
    requestedMode,
    inferenceSource: res.inferenceSource,
    usedFallback: res.usedFallback,
    latencyMs: res.latencyMs,
    modelId: res.inferenceSource === 'on_device' ? 'gemini-nano (on-device)' : modelId,
  };
}

export async function generateSummaryAndSimplification(params: {
  documentText: string;
  level: SimplificationLevel;
  language: SupportedLanguage;
  mode: HybridInferenceMode;
  remoteConfig: RemoteConfigSettings;
}): Promise<SimplificationOutput> {
  const levelGuide =
    params.level === 'very_simple'
      ? 'Use very short sentences and everyday vocabulary suitable for someone with zero legal or administrative background.'
      : params.level === 'detailed'
        ? 'Provide thorough plain-language explanations preserving every condition, exception, numeric threshold, and procedural nuance.'
        : 'Use clear, concise standard plain English balancing brevity and accuracy.';

  const languageRule =
    params.language === 'Simple English'
      ? 'Write all explanations in clear Simple English.'
      : `Translate and write the summary and simplified explanations in ${params.language}. Preserve exact dates, dollar/currency amounts, notice numbers, institution names, and official form names accurately alongside their ${params.language} explanation.`;

  const clipped = clampInput(params.documentText, params.remoteConfig.maxInputChars);
  const prompt = `You are FormWise AI, an accurate document understanding assistant.
Analyze ONLY the provided document text. Do NOT invent deadlines, conditions, or fees not present in the source text.
Explanation level: ${params.level} — ${levelGuide}
Language instruction: ${languageRule}

Return strict valid JSON (no markdown fences needed, or valid JSON inside \`\`\`json) with this exact shape:
{
  "summary": "2-4 sentence plain summary of what this document is and what it requires.",
  "clauses": [
    {
      "sectionReference": "Section or heading name from the document",
      "originalClause": "Direct concise quote or faithful paraphrase of the important original clause",
      "simplifiedExplanation": "Plain explanation at the requested level and language",
      "whyItMatters": "Why this clause affects the reader",
      "whatUserShouldDo": "Specific concrete action or check for the user"
    }
  ]
}
Include 3 to 6 of the most important clauses.

DOCUMENT TEXT:
${clipped}`;

  const res = await runHybridGeneration({
    prompt,
    mode: params.mode,
    cloudModelId: params.remoteConfig.cloudModelId,
    maxOutputTokens: params.remoteConfig.maxOutputTokens,
  });

  const parsed = parseJsonFromModelText<{
    summary?: string;
    clauses?: Array<Partial<SimplifiedClause>>;
  }>(res.text, {});

  const clauses: SimplifiedClause[] = Array.isArray(parsed.clauses)
    ? parsed.clauses
        .filter((c) => c && (c.simplifiedExplanation || c.originalClause))
        .slice(0, 12)
        .map((c) => ({
          sectionReference: c.sectionReference || 'Document Clause',
          originalClause: c.originalClause || 'Referenced section from uploaded document.',
          simplifiedExplanation: c.simplifiedExplanation || res.text.slice(0, 400),
          whyItMatters: c.whyItMatters || 'Clarifies your obligations under this notice.',
          whatUserShouldDo: c.whatUserShouldDo || 'Review this requirement carefully against your records.',
        }))
    : [
        {
          sectionReference: 'Overview',
          originalClause: 'Key provisions summarized from uploaded text.',
          simplifiedExplanation: res.text.trim(),
          whyItMatters: 'Provides a direct plain-language reading of the document.',
          whatUserShouldDo: 'Verify details with the issuing organization.',
        },
      ];

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
      ? parsed.summary.trim()
      : clauses[0]?.simplifiedExplanation || res.text.trim().slice(0, 1200);

  return {
    summary,
    clauses,
    meta: buildMeta(
      params.language === 'Simple English' ? 'simplify' : 'translate',
      params.mode,
      params.remoteConfig.cloudModelId,
      res
    ),
  };
}

export async function generateActionPlanItems(params: {
  userId: string;
  docId: string;
  documentText: string;
  mode: HybridInferenceMode;
  remoteConfig: RemoteConfigSettings;
}): Promise<{ tasks: ActionTask[]; meta: AIExecutionMeta }> {
  const clipped = clampInput(params.documentText, params.remoteConfig.maxInputChars);
  const prompt = `Extract an ordered, practical step-by-step action plan from the document below.
Rules:
- Only include steps grounded in the document text. Do not invent requirements or deadlines.
- Order chronologically from Step 1 onward.
- Return valid JSON with key "tasks" as an array of objects:
{
  "tasks": [
    {
      "title": "Short action title (max 80 chars)",
      "description": "Concrete instructions based on the document",
      "priority": "high" | "medium" | "low",
      "deadline": "Explicit date string if stated in document, or empty string if none",
      "sourceReference": "Section or clause reference from document"
    }
  ]
}

DOCUMENT TEXT:
${clipped}`;

  const res = await runHybridGeneration({
    prompt,
    mode: params.mode,
    cloudModelId: params.remoteConfig.cloudModelId,
    maxOutputTokens: params.remoteConfig.maxOutputTokens,
  });

  const parsed = parseJsonFromModelText<{
    tasks?: Array<{
      title?: string;
      description?: string;
      priority?: string;
      deadline?: string;
      sourceReference?: string;
    }>;
  }>(res.text, { tasks: [] });

  const now = Date.now();
  const tasks: ActionTask[] = (Array.isArray(parsed.tasks) ? parsed.tasks : [])
    .filter((t) => t && t.title)
    .slice(0, 20)
    .map((t, index) => {
      const priority: TaskPriority =
        t.priority === 'high' || t.priority === 'low' || t.priority === 'medium'
          ? t.priority
          : 'medium';
      return {
        id: `task_${now}_${index}`,
        userId: params.userId,
        docId: params.docId,
        title: String(t.title).slice(0, 240),
        description: String(t.description || '').slice(0, 2000),
        priority,
        completed: false,
        deadline: t.deadline ? String(t.deadline).slice(0, 64) : undefined,
        sourceReference: t.sourceReference ? String(t.sourceReference).slice(0, 400) : undefined,
        order: index + 1,
      };
    });

  return {
    tasks,
    meta: buildMeta('action_plan', params.mode, params.remoteConfig.cloudModelId, res),
  };
}

export async function extractDocumentDeadlines(params: {
  userId: string;
  docId: string;
  documentText: string;
  mode: HybridInferenceMode;
  remoteConfig: RemoteConfigSettings;
}): Promise<{ deadlines: DeadlineEvent[]; meta: AIExecutionMeta }> {
  const clipped = clampInput(params.documentText, params.remoteConfig.maxInputChars);
  const prompt = `Extract all dates and deadlines explicitly mentioned in this document.
CRITICAL RULES:
- NEVER invent missing dates.
- If a date or window is vague/tentative/TBD (e.g. "May 2027 (exact date to be announced)" or "48 hours prior"), set "needsVerification": true.
- Categorize each as one of: "application", "verification", "payment", "exam", "interview", "event".
- Provide "isoDate" as YYYY-MM-DD ONLY when an exact calendar day is stated; otherwise leave "isoDate" as "".

Return valid JSON:
{
  "deadlines": [
    {
      "title": "Event or deadline name",
      "category": "application" | "verification" | "payment" | "exam" | "interview" | "event",
      "dateText": "Exact date wording from document",
      "isoDate": "YYYY-MM-DD or empty string",
      "needsVerification": true | false,
      "sourceQuote": "Short supporting phrase from document"
    }
  ]
}

DOCUMENT TEXT:
${clipped}`;

  const res = await runHybridGeneration({
    prompt,
    mode: params.mode,
    cloudModelId: params.remoteConfig.cloudModelId,
    maxOutputTokens: params.remoteConfig.maxOutputTokens,
  });

  const parsed = parseJsonFromModelText<{
    deadlines?: Array<{
      title?: string;
      category?: string;
      dateText?: string;
      isoDate?: string;
      needsVerification?: boolean;
      sourceQuote?: string;
    }>;
  }>(res.text, { deadlines: [] });

  const validCategories: DeadlineCategory[] = [
    'application',
    'verification',
    'payment',
    'exam',
    'interview',
    'event',
  ];

  const now = Date.now();
  const deadlines: DeadlineEvent[] = (Array.isArray(parsed.deadlines) ? parsed.deadlines : [])
    .filter((d) => d && d.title && d.dateText)
    .slice(0, 25)
    .map((d, index) => {
      const category = validCategories.includes(d.category as DeadlineCategory)
        ? (d.category as DeadlineCategory)
        : 'event';
      const iso = d.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(d.isoDate) ? d.isoDate : undefined;
      return {
        id: `dl_${now}_${index}`,
        userId: params.userId,
        docId: params.docId,
        title: String(d.title).slice(0, 240),
        category,
        dateText: String(d.dateText).slice(0, 120),
        isoDate: iso,
        needsVerification: Boolean(d.needsVerification) || !iso,
        sourceQuote: d.sourceQuote ? String(d.sourceQuote).slice(0, 600) : undefined,
        addedToTasks: false,
      };
    });

  return {
    deadlines,
    meta: buildMeta('deadlines', params.mode, params.remoteConfig.cloudModelId, res),
  };
}

export async function extractDocumentRequirements(params: {
  userId: string;
  docId: string;
  documentText: string;
  mode: HybridInferenceMode;
  remoteConfig: RemoteConfigSettings;
}): Promise<{ requirements: RequirementItem[]; meta: AIExecutionMeta }> {
  const clipped = clampInput(params.documentText, params.remoteConfig.maxInputChars);
  const prompt = `Identify every supporting document, certificate, ID, photo, form, or payment proof mentioned in the text.
CRITICAL RULES:
- Distinguish mandatory requirements from optional or conditional items strictly based on the source wording ("must", "mandatory", "required" vs "optional", "only if applicable", "may").
- Do not assume every mentioned document is mandatory.

Return valid JSON:
{
  "requirements": [
    {
      "name": "Document name",
      "mandatory": true | false,
      "sourceQuote": "Short phrase showing whether it is mandatory or conditional/optional",
      "notes": "Condition or formatting detail from document"
    }
  ]
}

DOCUMENT TEXT:
${clipped}`;

  const res = await runHybridGeneration({
    prompt,
    mode: params.mode,
    cloudModelId: params.remoteConfig.cloudModelId,
    maxOutputTokens: params.remoteConfig.maxOutputTokens,
  });

  const parsed = parseJsonFromModelText<{
    requirements?: Array<{
      name?: string;
      mandatory?: boolean;
      sourceQuote?: string;
      notes?: string;
    }>;
  }>(res.text, { requirements: [] });

  const now = Date.now();
  const requirements: RequirementItem[] = (Array.isArray(parsed.requirements) ? parsed.requirements : [])
    .filter((r) => r && r.name)
    .slice(0, 30)
    .map((r, index) => ({
      id: `req_${now}_${index}`,
      userId: params.userId,
      docId: params.docId,
      name: String(r.name).slice(0, 240),
      mandatory: Boolean(r.mandatory),
      status: 'needs_verification',
      sourceQuote: r.sourceQuote ? String(r.sourceQuote).slice(0, 600) : undefined,
      notes: r.notes ? String(r.notes).slice(0, 1000) : undefined,
    }));

  return {
    requirements,
    meta: buildMeta('requirements', params.mode, params.remoteConfig.cloudModelId, res),
  };
}

/**
 * Multi-turn Ask Your Document Q&A — explicitly uses Firebase AI Logic cloud inference
 * because hybrid on-device inference does not support multi-turn chat.
 */
export async function askDocumentQuestion(params: {
  documentTitle: string;
  documentText: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  question: string;
  remoteConfig: RemoteConfigSettings;
}): Promise<{
  answer: string;
  citations: string[];
  uncertain: boolean;
  meta: AIExecutionMeta;
}> {
  const clipped = clampInput(params.documentText, params.remoteConfig.maxInputChars);
  const systemInstruction = `You are FormWise AI's document assistant answering questions strictly from the uploaded document "${params.documentTitle}".
Rules:
1. Answer ONLY using facts explicitly present in the document text.
2. Never fabricate dates, amounts, eligibility rules, or penalties.
3. If the document does not clearly answer the question or is ambiguous, explicitly warn the user and set "uncertain": true.
4. Always cite the relevant section or quote from the document.
5. Respond in valid JSON:
{
  "answer": "Clear, helpful answer grounded in the document.",
  "citations": ["Section name or brief direct quote"],
  "uncertain": false
}`;

  const sdkHistory: Array<{ role: 'user' | 'model'; parts: Array<{ type: 'text'; text: string }> }> = [
    {
      role: 'user',
      parts: [{ type: 'text', text: `Here is the document content for reference:\n\n${clipped}` }],
    },
    {
      role: 'model',
      parts: [
        {
          type: 'text',
          text: 'Understood. I will answer strictly based on this document and cite relevant sections.',
        },
      ],
    },
    ...params.history.slice(-10).map((m) => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
  ];

  const res = await runCloudChatTurn({
    cloudModelId: params.remoteConfig.cloudModelId,
    systemInstruction,
    history: sdkHistory,
    userMessage: params.question,
    maxOutputTokens: params.remoteConfig.maxOutputTokens,
  });

  const parsed = parseJsonFromModelText<{
    answer?: string;
    citations?: string[];
    uncertain?: boolean;
  }>(res.text, {});

  return {
    answer: parsed.answer?.trim() || res.text.trim(),
    citations: Array.isArray(parsed.citations) ? parsed.citations.slice(0, 8) : [],
    uncertain: Boolean(parsed.uncertain),
    meta: buildMeta('chat', 'only_in_cloud', params.remoteConfig.cloudModelId, res),
  };
}

/**
 * Two-Document Comparison — uses Cloud AI via Firebase AI Logic for complex cross-document reasoning.
 */
export async function compareTwoDocuments(params: {
  userId: string;
  docAId: string;
  docATitle: string;
  docAText: string;
  docBId: string;
  docBTitle: string;
  docBText: string;
  remoteConfig: RemoteConfigSettings;
}): Promise<{ comparison: DocumentComparison; meta: AIExecutionMeta }> {
  const halfLimit = Math.floor(params.remoteConfig.maxInputChars / 2);
  const textA = clampInput(params.docAText, halfLimit);
  const textB = clampInput(params.docBText, halfLimit);

  const prompt = `Compare Document A ("${params.docATitle}") and Document B ("${params.docBTitle}") carefully.
Identify only real facts present in the two texts. Do not invent differences.

Return valid JSON:
{
  "similarities": ["string"],
  "differences": ["string"],
  "changedDeadlines": ["string"],
  "differentRequirements": ["string"],
  "conflictingInstructions": ["string"],
  "importantChanges": ["string"]
}

DOCUMENT A:
${textA}

DOCUMENT B:
${textB}`;

  const res = await runHybridGeneration({
    prompt,
    mode: 'only_in_cloud',
    cloudModelId: params.remoteConfig.cloudModelId,
    maxOutputTokens: params.remoteConfig.maxOutputTokens,
  });

  const parsed = parseJsonFromModelText<{
    similarities?: string[];
    differences?: string[];
    changedDeadlines?: string[];
    differentRequirements?: string[];
    conflictingInstructions?: string[];
    importantChanges?: string[];
  }>(res.text, {});

  const toList = (arr?: string[]) =>
    Array.isArray(arr) ? arr.map((s) => String(s).slice(0, 400)).slice(0, 20) : [];

  const comparison: DocumentComparison = {
    id: `cmp_${Date.now()}`,
    userId: params.userId,
    docAId: params.docAId,
    docATitle: params.docATitle,
    docBId: params.docBId,
    docBTitle: params.docBTitle,
    similarities: toList(parsed.similarities),
    differences: toList(parsed.differences),
    changedDeadlines: toList(parsed.changedDeadlines),
    differentRequirements: toList(parsed.differentRequirements),
    conflictingInstructions: toList(parsed.conflictingInstructions),
    importantChanges: toList(parsed.importantChanges),
    inferenceSource: res.inferenceSource,
  };

  return {
    comparison,
    meta: buildMeta('compare', 'only_in_cloud', params.remoteConfig.cloudModelId, res),
  };
}

/**
 * Cloud Multimodal OCR pathway for scanned PDFs when browser text extraction yields no text layer.
 */
export async function extractTextWithCloudOcr(params: {
  imageBase64: string;
  mimeType: string;
  fileName: string;
  remoteConfig: RemoteConfigSettings;
}): Promise<{ extractedText: string; meta: AIExecutionMeta }> {
  const res = await runHybridGeneration({
    prompt: [
      `Transcribe all readable text from this scanned document image (${params.fileName}) accurately, preserving headings, dates, numbers, and bullet lists. If text is illegible, mark it as [illegible]. Do not invent missing content.`,
      {
        type: 'inlineData',
        inlineData: {
          mimeType: params.mimeType,
          data: params.imageBase64,
        },
      },
    ],
    mode: 'only_in_cloud',
    cloudModelId: params.remoteConfig.cloudModelId,
    maxOutputTokens: params.remoteConfig.maxOutputTokens,
  });

  return {
    extractedText: res.text.trim(),
    meta: buildMeta('ocr', 'only_in_cloud', params.remoteConfig.cloudModelId, res),
  };
}
