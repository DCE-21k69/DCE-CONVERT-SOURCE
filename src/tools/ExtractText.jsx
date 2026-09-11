import React, { useState } from 'react';
import { 
  FileSearch, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle, 
  FileCode,
  Sparkles
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { readFileAsArrayBuffer, downloadFile, triggerConfetti } from '../utils/helpers';
import { pdfjsLib } from '../utils/pdfWorker';

export default function ExtractText({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelected = async ([selectedFile]) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Por favor selecciona un archivo PDF válido.');
      return;
    }

    try {
      setError(null);
      setFile(selectedFile);
      setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_texto');
      setIsProcessing(true);
      setProgress('Analizando páginas y extrayendo contenido de texto...');

      const buffer = await readFileAsArrayBuffer(selectedFile);
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdfDoc = await loadingTask.promise;
      setPageCount(pdfDoc.numPages);

      let fullText = '';

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        setProgress(`Extrayendo texto de página ${i} de ${pdfDoc.numPages}...`);
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        let pageStr = `\n--- PÁGINA ${i} ---\n\n`;
        let lastY = null;

        // Sort items vertically (top to bottom) then horizontally (left to right)
        const items = [...textContent.items].filter(item => typeof item.str === 'string');
        items.sort((a, b) => {
          const yDiff = b.transform[5] - a.transform[5];
          if (Math.abs(yDiff) > 5) return yDiff;
          return a.transform[4] - b.transform[4];
        });

        for (const item of items) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 8) {
            pageStr += '\n';
          }
          pageStr += item.str + ' ';
          lastY = item.transform[5];
        }

        fullText += pageStr.trim() + '\n\n';
      }

      setExtractedText(fullText.trim());
      setProgress(null);
    } catch (err) {
      console.error('Error extracting text:', err);
      setError('No se pudo extraer el texto del PDF. Si el documento fue escaneado como imagen fotográfica pura, no contiene capas de texto digital.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const filename = (customFilename.trim() || 'texto_extraido') + '.txt';
    downloadFile(extractedText, filename, 'text/plain;charset=utf-8');
    triggerConfetti();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0;
  const charCount = extractedText ? extractedText.length : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader
        title="Extractor de Texto de PDF"
        description="Extrae todo el contenido de texto plano de tus archivos PDF, consulta estadísticas en tiempo real, cópialo al portapapeles o descárgalo en archivo .TXT."
        icon={FileSearch}
        iconColor="from-teal-600 to-cyan-700"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setExtractedText('');
        }}
        hasFiles={!!file}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!file ? (
        <FileUploader
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Selecciona el PDF para extraer su texto"
          subtitle="Extracción instantánea y limpia de caracteres, palabras y párrafos"
          buttonText="Seleccionar archivo PDF"
        />
      ) : isProcessing ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{progress}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-900">
                📄 {pageCount} {pageCount === 1 ? 'página' : 'páginas'}
              </span>
              <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-900">
                📝 {wordCount.toLocaleString()} palabras
              </span>
              <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-900">
                🔤 {charCount.toLocaleString()} caracteres
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleCopy}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-teal-600" />}
                <span>{copied ? '¡Copiado al portapapeles!' : 'Copiar todo el texto'}</span>
              </button>
            </div>
          </div>

          {/* Text preview container */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Contenido extraído del documento:
              </span>
              <span className="text-xs text-slate-400">
                {extractedText ? `${wordCount} palabras` : ''}
              </span>
            </div>
            <textarea
              readOnly
              value={extractedText}
              rows={14}
              className="w-full p-3.5 font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 outline-none resize-y leading-relaxed"
            />
          </div>

          {/* Custom Download Filename & Download Action */}
          <div className="pt-2 flex flex-col items-center justify-center gap-3">
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension=".txt"
              label="Nombre del archivo .TXT al descargar:"
            />

            <button
              onClick={handleDownloadTxt}
              className="w-full sm:w-auto min-w-[280px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo de Texto (.txt)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
