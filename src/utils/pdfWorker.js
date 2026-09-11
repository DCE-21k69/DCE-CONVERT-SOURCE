import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined') {
  // Use the local worker copied to public/ folder
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export { pdfjsLib };
