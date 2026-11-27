import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ScanText,
  ArrowRight,
  Trash2,
  Play,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { extractDocumentInBrowser, formatBytes } from '../services/documentService';
import { extractTextWithCloudOcr } from '../services/hybridAIService';
import { useHybridRunner } from '../hooks/useHybridRunner';
import type { WorkspaceDocument } from '../types';

export default function UploadPage() {
  const {
    user,
    remoteConfig,
    addOrUpdateDocument,
    setScannedPreview,
    scannedPreviews,
    loadCompetitionDemo,
  } = useApp();
  const { executeTrackedTask } = useHybridRunner();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'file' | 'paste'>('file');
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [processingName, setProcessingName] = useState<string | null>(null);
  const [uploadedBatch, setUploadedBatch] = useState<WorkspaceDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ocrLoadingId, setOcrLoadingId] = useState<string | null>(null);

  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');

  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files);
    if (list.length === 0) return;

    const uid = user?.uid || 'guest';
    for (const file of list) {
      setProcessingName(file.name);
      setProgress(5);
      const extracted = await extractDocumentInBrowser(file, (pct) => setProgress(pct));

      if (extracted.extractionStatus === 'error') {
        setError(extracted.errorMessage || `Could not extract ${file.name}.`);
        setProcessingName(null);
        setProgress(0);
        continue;
      }

      const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const record: WorkspaceDocument = {
        id: docId,
        userId: uid,
        title: extracted.title,
        fileName: extracted.fileName,
        mimeType: extracted.mimeType,
        fileSize: extracted.fileSize,
        pageCount: extracted.pageCount,
        extractionStatus: extracted.extractionStatus,
        isScanned: extracted.isScanned,
        isDemo: false,
        extractedText: extracted.extractedText,
        lastInferenceSource: 'none',
      };

      if (extracted.scannedPreviewBase64) {
        setScannedPreview(docId, extracted.scannedPreviewBase64);
      }

      await addOrUpdateDocument(record);
      setUploadedBatch((prev) => [record, ...prev]);
    }

    setProcessingName(null);
    setProgress(0);
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = pasteText.trim();
    if (!cleaned) {
      setError('Please paste document text before continuing.');
      return;
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const record: WorkspaceDocument = {
      id: docId,
      userId: user?.uid || 'guest',
      title: pasteTitle.trim() || 'Pasted Document Text',
      fileName: 'pasted_document.txt',
      mimeType: 'text/plain',
      fileSize: new Blob([cleaned]).size,
      pageCount: Math.max(1, Math.ceil(cleaned.length / 2800)),
      extractionStatus: 'ready',
      isScanned: false,
      isDemo: false,
      extractedText: cleaned,
      lastInferenceSource: 'none',
    };

    await addOrUpdateDocument(record);
    setUploadedBatch((prev) => [record, ...prev]);
    setPasteTitle('');
    setPasteText('');
    navigate('/analysis');
  };

  const handleCloudOcr = async (docItem: WorkspaceDocument) => {
    const previewBase64 = scannedPreviews[docItem.id];
    if (!previewBase64) {
      setError('No rendered page preview is available for OCR.');
      return;
    }
    setOcrLoadingId(docItem.id);
    setError(null);
    try {
      const res = await executeTrackedTask({
        operation: 'ocr',
        docId: docItem.id,
        docTitle: docItem.title,
        requestedMode: 'only_in_cloud',
        requiresCloud: true,
        consentReason: `Cloud multimodal OCR is required to transcribe scanned image pages from "${docItem.fileName}".`,
        run: async () => {
          const ocrResult = await extractTextWithCloudOcr({
            imageBase64: previewBase64,
            mimeType: 'image/jpeg',
            fileName: docItem.fileName,
            remoteConfig,
          });
          return { data: ocrResult.extractedText, meta: ocrResult.meta };
        },
      });

      if (res) {
        const updated: WorkspaceDocument = {
          ...docItem,
          extractedText: res.data,
          extractionStatus: 'ready',
          isScanned: true,
          lastInferenceSource: res.meta.inferenceSource,
        };
        await addOrUpdateDocument(updated);
        setUploadedBatch((prev) => prev.map((d) => (d.id === docItem.id ? updated : d)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cloud OCR failed.');
    } finally {
      setOcrLoadingId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Document Analyzer Upload</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Files are parsed directly inside your browser using PDF.js and Mammoth. Original binaries never leave your device unless you explicitly request Cloud OCR on a scanned PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await loadCompetitionDemo(true);
            navigate('/analysis');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          Load Competition Demo Notice
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-[var(--border-hairline)]">
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            tab === 'file'
              ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-xs'
              : 'text-slate-500 hover:text-[var(--text-primary)]'
          }`}
        >
          Upload Files (PDF, DOCX, TXT)
        </button>
        <button
          type="button"
          onClick={() => setTab('paste')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            tab === 'paste'
              ? 'bg-white dark:bg-slate-800 text-[var(--text-primary)] shadow-xs'
              : 'text-slate-500 hover:text-[var(--text-primary)]'
          }`}
        >
          Paste Raw Text
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {tab === 'file' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void processFiles(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors bg-[var(--bg-surface)] ${
            dragging
              ? 'border-violet-500 bg-violet-50/40 dark:bg-violet-950/20'
              : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => {
              if (e.target.files) void processFiles(e.target.files);
            }}
            className="hidden"
          />

          <Upload className="w-9 h-9 text-slate-400 mx-auto mb-3" />
          <h2 className="font-display text-base font-semibold mb-1">
            Drag and drop documents here
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Supports multiple PDF, DOCX, and TXT files up to 25 MB each.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Choose Files from Computer
          </button>

          {processingName && (
            <div className="mt-6 max-w-md mx-auto text-left">
              <div className="flex justify-between text-xs mb-1.5 font-mono tabular-nums">
                <span className="truncate">{processingName}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-violet-600 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => void handlePasteSubmit(e)}
          className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-4"
        >
          <div>
            <label htmlFor="paste-title" className="block text-xs font-medium mb-1.5">
              Document Title
            </label>
            <input
              id="paste-title"
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="e.g., Graduate Fellowship Application Guidelines"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label htmlFor="paste-text" className="block text-xs font-medium mb-1.5">
              Paste Document Content
            </label>
            <textarea
              id="paste-text"
              rows={10}
              required
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste official notice, instructions, terms, or form clauses here..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold hover:opacity-90"
            >
              Add to Workspace &amp; Analyze
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Session Uploaded Preview Queue */}
      {uploadedBatch.length > 0 && (
        <section className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 space-y-4">
          <h2 className="font-display text-base font-semibold">Processed in This Upload Session</h2>
          <div className="divide-y divide-[var(--border-hairline)]">
            {uploadedBatch.map((item) => (
              <div key={item.id} className="py-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {item.fileName} · {formatBytes(item.fileSize)} · {item.pageCount} pages
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.extractionStatus === 'ready' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Text Extracted ({item.extractedText?.length.toLocaleString()} chars)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Scanned / No Text Layer
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setUploadedBatch((prev) => prev.filter((x) => x.id !== item.id))}
                      aria-label="Dismiss from session list"
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.extractionStatus === 'needs_ocr' && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-amber-900 dark:text-amber-200 max-w-xl">
                      No selectable text was detected in this file. FormWise AI never fabricates extracted text—you can transcribe page 1 using Cloud Multimodal OCR with your consent, or upload a text-based PDF.
                    </p>
                    <button
                      type="button"
                      disabled={ocrLoadingId === item.id}
                      onClick={() => void handleCloudOcr(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-semibold shrink-0 disabled:opacity-60"
                    >
                      <ScanText className="w-3.5 h-3.5" />
                      {ocrLoadingId === item.id ? 'Running Cloud OCR...' : 'Run Cloud OCR (Page 1)'}
                    </button>
                  </div>
                )}

                {item.extractedText && (
                  <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3 text-xs text-slate-600 dark:text-slate-300 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {item.extractedText.slice(0, 700)}
                    {item.extractedText.length > 700 ? '...' : ''}
                  </div>
                )}

                {item.extractionStatus === 'ready' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('/analysis')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] dark:bg-violet-600 text-white text-xs font-semibold"
                    >
                      Open Analysis Workspace
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
