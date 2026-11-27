import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ExtractedDocumentResult {
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  pageCount: number;
  extractedText: string;
  isScanned: boolean;
  extractionStatus: 'ready' | 'needs_ocr' | 'error';
  scannedPreviewBase64?: string;
  errorMessage?: string;
}

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateDocumentFile(file: File): string | null {
  if (file.size === 0) {
    return 'The selected file is empty.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'File exceeds the 25 MB browser extraction limit.';
  }
  const lower = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lower.endsWith('.pdf');
  const isTxt = file.type.startsWith('text/') || lower.endsWith('.txt') || lower.endsWith('.md');
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx');

  if (!isPdf && !isTxt && !isDocx) {
    return 'Unsupported file type. Please upload a PDF, DOCX, or TXT file.';
  }
  return null;
}

export async function extractDocumentInBrowser(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ExtractedDocumentResult> {
  const validationError = validateDocumentFile(file);
  if (validationError) {
    return {
      title: file.name,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
      pageCount: 0,
      extractedText: '',
      isScanned: false,
      extractionStatus: 'error',
      errorMessage: validationError,
    };
  }

  const lower = file.name.toLowerCase();
  const cleanTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || file.name;
  onProgress?.(10);

  if (file.type.startsWith('text/') || lower.endsWith('.txt') || lower.endsWith('.md')) {
    const text = await file.text();
    onProgress?.(100);
    const trimmed = text.trim();
    return {
      title: cleanTitle,
      fileName: file.name,
      mimeType: file.type || 'text/plain',
      fileSize: file.size,
      pageCount: Math.max(1, Math.ceil(trimmed.length / 2800)),
      extractedText: trimmed,
      isScanned: false,
      extractionStatus: trimmed.length > 0 ? 'ready' : 'error',
      errorMessage: trimmed.length === 0 ? 'Text file contains no readable characters.' : undefined,
    };
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      onProgress?.(50);
      const result = await mammoth.extractRawText({ arrayBuffer });
      onProgress?.(100);
      const text = (result.value || '').trim();
      return {
        title: cleanTitle,
        fileName: file.name,
        mimeType:
          file.type ||
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: file.size,
        pageCount: Math.max(1, Math.ceil(text.length / 2800)),
        extractedText: text,
        isScanned: text.length < 20,
        extractionStatus: text.length >= 20 ? 'ready' : 'needs_ocr',
        errorMessage:
          text.length < 20
            ? 'DOCX contains minimal selectable text (it may consist primarily of embedded images).'
            : undefined,
      };
    } catch (err) {
      return {
        title: cleanTitle,
        fileName: file.name,
        mimeType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: file.size,
        pageCount: 0,
        extractedText: '',
        isScanned: false,
        extractionStatus: 'error',
        errorMessage:
          err instanceof Error ? `DOCX extraction failed: ${err.message}` : 'DOCX extraction failed.',
      };
    }
  }

  // PDF extraction via PDF.js
  try {
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(25);
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pageTexts: string[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .filter(Boolean);
      pageTexts.push(`[Page ${i}]\n${strings.join(' ')}`);
      const pct = 25 + Math.round((i / totalPages) * 65);
      onProgress?.(pct);
    }

    const combined = pageTexts.join('\n\n').trim();
    const meaningfulChars = combined.replace(/\[Page \d+\]|\s+/g, '').length;
    const isScanned = meaningfulChars < Math.max(30, totalPages * 18);

    let scannedPreviewBase64: string | undefined;
    if (isScanned && totalPages >= 1 && typeof document !== 'undefined') {
      try {
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await firstPage.render({ canvasContext: ctx, viewport, canvas }).promise;
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          scannedPreviewBase64 = dataUrl.split(',')[1];
        }
      } catch {
        // Preview render optional if canvas fails
      }
    }

    onProgress?.(100);
    return {
      title: cleanTitle,
      fileName: file.name,
      mimeType: 'application/pdf',
      fileSize: file.size,
      pageCount: totalPages,
      extractedText: isScanned ? '' : combined,
      isScanned,
      extractionStatus: isScanned ? 'needs_ocr' : 'ready',
      scannedPreviewBase64,
      errorMessage: isScanned
        ? 'No selectable text layer was found in this PDF. It appears to be scanned or image-based.'
        : undefined,
    };
  } catch (err) {
    return {
      title: cleanTitle,
      fileName: file.name,
      mimeType: 'application/pdf',
      fileSize: file.size,
      pageCount: 0,
      extractedText: '',
      isScanned: false,
      extractionStatus: 'error',
      errorMessage:
        err instanceof Error ? `PDF parsing error: ${err.message}` : 'Unable to parse PDF file.',
    };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
