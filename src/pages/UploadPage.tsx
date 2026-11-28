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
  ShieldCheck,
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Document Analyzer Upload
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-2xl">
            Files are extracted directly in Chrome using PDF.js and Mammoth. Original files stay private on your device unless you explicitly authorize Cloud OCR for scanned pages.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await loadCompetitionDemo(true);
            navigate('/analysis');
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 min-h-[42px] py-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold hover:bg-[var(--bg-subtle)] transition-settle whitespace-nowrap shrink-0"
        >
          <Play className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          Load Demo Notice
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:inline-flex p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)] w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`px-3 sm:px-4 min-h-[38px] py-1.5 text-xs font-semibold rounded-md transition-settle whitespace-nowrap text-center ${
              tab === 'file'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Upload Files
          </button>
          <button
            type="button"
            onClick={() => setTab('paste')}
            className={`px-3 sm:px-4 min-h-[38px] py-1.5 text-xs font-semibold rounded-md transition-settle whitespace-nowrap text-center ${
              tab === 'paste'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Paste Raw Text
          </button>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Zero server binary upload
        </span>
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
          className={`rounded-2xl border-2 border-dashed p-7 sm:p-12 text-center transition-settle bg-dot-matrix ${
            dragging
              ? 'border-[var(--accent-primary)] bg-indigo-50/40 dark:bg-indigo-950/20'
              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
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

          <div className="w-12 h-12 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] flex items-center justify-center mx-auto mb-4">
            <Upload className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>

          <h2 className="font-display text-base sm:text-lg font-bold mb-1.5">
            Drag and drop documents here
          </h2>
          <p className="text-xs text-[var(--text-muted)] mb-6 max-w-md mx-auto">
            Upload single or multiple PDF, DOCX, or TXT files (up to 25 MB each) to extract readable text right inside your browser.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 min-h-[44px] py-2.5 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle"
          >
            Choose Files from Device
          </button>

          {processingName && (
            <div className="mt-8 max-w-md mx-auto text-left rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
              <div className="flex justify-between text-xs mb-2 font-mono tabular-nums">
                <span className="truncate font-medium">{processingName}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => void handlePasteSubmit(e)}
          className="rounded-2xl surface-sheet p-6 sm:p-7 space-y-4"
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
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle"
            >
              Add to Workspace &amp; Analyze
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Session Uploaded Preview Queue */}
      {uploadedBatch.length > 0 && (
        <section className="rounded-2xl surface-sheet p-6 space-y-4">
          <h2 className="font-display text-base font-bold">Processed in This Session</h2>
          <div className="divide-y divide-[var(--border-hairline)]">
            {uploadedBatch.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-[var(--text-muted)] mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-[var(--text-muted)] tabular-nums mt-0.5">
                        {item.fileName} · {formatBytes(item.fileSize)} · {item.pageCount}{' '}
                        {item.pageCount === 1 ? 'page' : 'pages'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.extractionStatus === 'ready' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Extracted ({item.extractedText?.length.toLocaleString()} chars)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Scanned / No Text Layer
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setUploadedBatch((prev) => prev.filter((x) => x.id !== item.id))}
                      aria-label="Dismiss from session list"
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 transition-settle"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.extractionStatus === 'needs_ocr' && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-amber-900 dark:text-amber-200 max-w-xl leading-relaxed">
                      No selectable text was detected in this file. FormWise AI never invents text—you can transcribe page 1 via Cloud Multimodal OCR with your consent, or upload a text-based PDF.
                    </p>
                    <button
                      type="button"
                      disabled={ocrLoadingId === item.id}
                      onClick={() => void handleCloudOcr(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-semibold shrink-0 disabled:opacity-60 transition-settle"
                    >
                      <ScanText className="w-3.5 h-3.5" />
                      {ocrLoadingId === item.id ? 'Running Cloud OCR...' : 'Run Cloud OCR (Page 1)'}
                    </button>
                  </div>
                )}

                {item.extractedText && (
                  <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5 text-xs text-[var(--text-secondary)] font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {item.extractedText.slice(0, 700)}
                    {item.extractedText.length > 700 ? '...' : ''}
                  </div>
                )}

                {item.extractionStatus === 'ready' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('/analysis')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111318] dark:bg-[#4F46E5] text-white text-xs font-semibold hover:opacity-90 transition-settle"
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
