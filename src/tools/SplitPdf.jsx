import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  Scissors, 
  Download, 
  Loader2, 
  AlertCircle, 
  Check, 
  FileArchive, 
  Layers 
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { formatBytes, readFileAsArrayBuffer, downloadFile, extractAllPdfThumbnails } from '../utils/helpers';

export default function SplitPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [mode, setMode] = useState('range'); // 'range' | 'all'
  const [rangeInput, setRangeInput] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [progress, setProgress] = useState(null);
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
      setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_extraido');
      setIsLoadingDoc(true);
      setProgress('Generando vista previa de páginas...');

      const result = await extractAllPdfThumbnails(selectedFile);
      if (result) {
        setTotalPages(result.numPages);
        setThumbnails(result.pages);
        // Default select all or range 1
        setSelectedPages(new Set([1]));
        setRangeInput(`1-${result.numPages}`);
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('No se pudo cargar el PDF. Puede estar dañado o tener contraseña.');
    } finally {
      setIsLoadingDoc(false);
      setProgress(null);
    }
  };

  const togglePageSelection = (pageNum) => {
    const updated = new Set(selectedPages);
    if (updated.has(pageNum)) {
      updated.delete(pageNum);
    } else {
      updated.add(pageNum);
    }
    setSelectedPages(updated);
    
    // Convert set back to range string
    const sorted = Array.from(updated).sort((a, b) => a - b);
    setRangeInput(sorted.join(', '));
  };

  const parseRangeString = (str, max) => {
    const pages = new Set();
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(max, Math.max(start, end));
          for (let i = from; i <= to; i++) {
            pages.add(i);
          }
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num) && num >= 1 && num <= max) {
          pages.add(num);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleRangeInputChange = (e) => {
    const val = e.target.value;
    setRangeInput(val);
    const parsed = parseRangeString(val, totalPages);
    setSelectedPages(new Set(parsed));
  };

  const handleSplit = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const buffer = await readFileAsArrayBuffer(file);
      const originalPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

      if (mode === 'all') {
        // Separate all pages into individual PDFs packed in a ZIP
        setProgress('Separando cada página en su propio PDF...');
        const zip = new JSZip();
        const baseName = file.name.replace(/\.[^/.]+$/, '');

        for (let i = 0; i < totalPages; i++) {
          setProgress(`Exportando página ${i + 1} de ${totalPages}...`);
          const singlePdf = await PDFDocument.create();
          const [copiedPage] = await singlePdf.copyPages(originalPdf, [i]);
          singlePdf.addPage(copiedPage);
          const pdfBytes = await singlePdf.save();
          zip.file(`${baseName}_pagina_${i + 1}.pdf`, pdfBytes);
        }

        setProgress('Comprimiendo archivo ZIP...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipName = (customFilename.trim() || `${baseName}_paginas`) + '.zip';
        downloadFile(zipBlob, zipName, 'application/zip');
      } else {
        // Extract selected range into one single PDF
        const targetPages = parseRangeString(rangeInput, totalPages);
        if (targetPages.length === 0) {
          setError('Debes especificar al menos una página válida para extraer.');
          setIsProcessing(false);
          return;
        }

        setProgress(`Extrayendo ${targetPages.length} páginas seleccionadas...`);
        const extractedPdf = await PDFDocument.create();
        const pageIndices = targetPages.map(p => p - 1);
        const copiedPages = await extractedPdf.copyPages(originalPdf, pageIndices);
        copiedPages.forEach(p => extractedPdf.addPage(p));

        setProgress('Generando nuevo documento PDF...');
        const pdfBytes = await extractedPdf.save();
        const pdfName = (customFilename.trim() || `${baseName}_extraido`) + '.pdf';
        downloadFile(pdfBytes, pdfName, 'application/pdf');
      }

      setProgress('¡Operación completada con éxito!');
    } catch (err) {
      console.error('Error al dividir PDF:', err);
      setError('Ocurrió un error al dividir el archivo PDF. Asegúrate de que no tenga restricciones.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader
        title="Dividir o Extraer páginas de PDF"
        description="Extrae un rango personalizado de páginas o separa cada página en un archivo PDF independiente dentro de un archivo ZIP."
        icon={Scissors}
        iconColor="from-amber-500 to-orange-600"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setThumbnails([]);
          setTotalPages(0);
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
          title="Selecciona el PDF que deseas dividir"
          subtitle="Procesa el documento con total privacidad en tu navegador"
          buttonText="Seleccionar archivo PDF"
        />
      ) : isLoadingDoc ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{progress}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Mode selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Modo de División
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('range')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                    mode === 'range'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Extraer páginas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('all')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                    mode === 'all'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileArchive className="w-4 h-4" />
                  <span>Separar todo (ZIP)</span>
                </button>
              </div>
            </div>

            {/* Range input if range mode */}
            {mode === 'range' ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Páginas a extraer (ej: 1-3, 5, 8)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={handleRangeInputChange}
                    placeholder={`1-${totalPages}`}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <button
                    onClick={() => {
                      const all = Array.from({ length: totalPages }, (_, i) => i + 1);
                      setSelectedPages(new Set(all));
                      setRangeInput(`1-${totalPages}`);
                    }}
                    className="shrink-0 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                  >
                    Todas
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total de páginas: {totalPages} | Seleccionadas: {selectedPages.size}
                </p>
              </div>
            ) : (
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                Se crearán {totalPages} archivos PDF independientes empaquetados en una descarga .ZIP limpia.
              </div>
            )}
          </div>

          {/* Page thumbnails grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Haz clic en las páginas para seleccionarlas o deseleccionarlas:
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[480px] overflow-y-auto p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              {thumbnails.map((t) => {
                const isSelected = selectedPages.has(t.pageNumber);
                return (
                  <div
                    key={t.pageNumber}
                    onClick={() => togglePageSelection(t.pageNumber)}
                    className={`group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-150 bg-white dark:bg-slate-800 shadow-sm ${
                      isSelected && mode === 'range'
                        ? 'border-amber-500 ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className="aspect-[3/4] flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-2">
                      <img
                        src={t.dataUrl}
                        alt={`Página ${t.pageNumber}`}
                        className="max-h-full max-w-full object-contain shadow-xs pointer-events-none"
                      />
                    </div>
                    <div className="py-1 px-2 text-center text-[11px] font-bold bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Pág. {t.pageNumber}</span>
                      {isSelected && mode === 'range' && (
                        <Check className="w-3.5 h-3.5 text-amber-500 stroke-[3]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex flex-col items-center justify-center gap-2">
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension={mode === 'all' ? '.zip' : '.pdf'}
              label={mode === 'all' ? 'Nombre del archivo ZIP al descargar:' : 'Nombre del PDF extraído:'}
            />

            <button
              onClick={handleSplit}
              disabled={isProcessing}
              className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {mode === 'all'
                      ? `Descargar ZIP con ${totalPages} páginas`
                      : `Descargar PDF (${selectedPages.size} pág.)`}
                  </span>
                </>
              )}
            </button>

            {progress && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                {progress}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
