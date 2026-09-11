import confetti from 'canvas-confetti';
import { saveAs } from 'file-saver';
import { pdfjsLib } from './pdfWorker';

/**
 * Format bytes to readable size
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Read File object as ArrayBuffer
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Read File object as Data URL (Base64)
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Trigger celebratory confetti animation on successful download
 */
export function triggerConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch (e) {
    console.error('Confetti error:', e);
  }
}

/**
 * Download a blob or Uint8Array with a filename
 */
export function downloadFile(data, filename, type = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  saveAs(blob, filename);
  triggerConfetti();
}

/**
 * Generate a thumbnail preview (Data URL) of a specific page from a PDF
 */
export async function generatePdfThumbnail(fileOrBuffer, pageNum = 1, scale = 0.5) {
  try {
    const data = fileOrBuffer instanceof File ? await readFileAsArrayBuffer(fileOrBuffer) : fileOrBuffer;
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(pageNum);
    
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      numPages: pdfDoc.numPages,
      width: viewport.width,
      height: viewport.height
    };
  } catch (err) {
    console.error('Error generating thumbnail:', err);
    return null;
  }
}

/**
 * Extract all page thumbnails and dimensions for interactive reordering/preview
 */
export async function extractAllPdfThumbnails(fileOrBuffer, scale = 0.35) {
  const data = fileOrBuffer instanceof File ? await readFileAsArrayBuffer(fileOrBuffer) : fileOrBuffer;
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
  const pdfDoc = await loadingTask.promise;
  const pages = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    pages.push({
      pageIndex: i - 1, // 0-indexed
      pageNumber: i,    // 1-indexed
      dataUrl: canvas.toDataURL('image/jpeg', 0.8),
      rotation: 0,
      width: viewport.width,
      height: viewport.height
    });
  }

  return {
    numPages: pdfDoc.numPages,
    pages
  };
}
