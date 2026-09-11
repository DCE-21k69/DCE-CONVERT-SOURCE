import React, { useState } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  Binary, 
  Download, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { readFileAsArrayBuffer, downloadFile } from '../utils/helpers';

export default function PageNumbersPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [format, setFormat] = useState('page_of_total'); // 'number_only' | 'page_n' | 'page_of_total' | 'n_slash_total'
  const [position, setPosition] = useState('bottom-center'); // 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right'
  const [skipFirstPage, setSkipFirstPage] = useState(true);
  const [fontSize, setFontSize] = useState(11);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelected = ([selectedFile]) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Por favor selecciona un archivo PDF válido.');
      return;
    }
    setError(null);
    setFile(selectedFile);
    setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_numerado');
  };

  const getPageText = (n, total) => {
    switch (format) {
      case 'number_only':
        return `${n}`;
      case 'page_n':
        return `Página ${n}`;
      case 'n_slash_total':
        return `${n} / ${total}`;
      case 'page_of_total':
      default:
        return `Página ${n} de ${total}`;
    }
  };

  const handleApplyNumbers = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Iniciando numeración de páginas...');

      const buffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;

      const startIndex = skipFirstPage ? 1 : 0;

      for (let i = startIndex; i < total; i++) {
        setProgress(`Numerando página ${i + 1} de ${total}...`);
        const page = pages[i];
        const pageNumber = i + 1;
        const text = getPageText(pageNumber, total);

        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x = 0;
        let y = 0;
        const margin = 30;

        if (position === 'bottom-center') {
          x = (width - textWidth) / 2;
          y = margin;
        } else if (position === 'bottom-right') {
          x = width - textWidth - margin;
          y = margin;
        } else if (position === 'bottom-left') {
          x = margin;
          y = margin;
        } else if (position === 'top-center') {
          x = (width - textWidth) / 2;
          y = height - margin - fontSize;
        } else if (position === 'top-right') {
          x = width - textWidth - margin;
          y = height - margin - fontSize;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.3, 0.3, 0.3)
        });
      }

      setProgress('Guardando PDF numerado...');
      const finalBytes = await pdfDoc.save();
      const baseName = customFilename.trim() || 'documento_numerado';
      downloadFile(finalBytes, `${baseName}.pdf`, 'application/pdf');
      setProgress('¡Páginas numeradas con éxito!');
    } catch (err) {
      console.error('Error al numerar páginas:', err);
      setError('Hubo un error al agregar la numeración al PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader
        title="Numerar Páginas de PDF"
        description="Agrega números correlativos de página a tus documentos PDF con formato y posición personalizables."
        icon={Binary}
        iconColor="from-indigo-500 to-violet-600"
        onBack={onBack}
        onReset={() => setFile(null)}
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
          title="Selecciona el PDF para numerar sus páginas"
          subtitle="Añade números de página limpios y profesionales en segundos"
          buttonText="Seleccionar archivo PDF"
        />
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {/* Format selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Formato del Número
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'page_of_total', label: 'Página 1 de 10' },
                  { id: 'n_slash_total', label: '1 / 10' },
                  { id: 'page_n', label: 'Página 1' },
                  { id: 'number_only', label: 'Solo número (1)' }
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                      format === fmt.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Ubicación en la página
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'bottom-center', label: 'Abajo Centro' },
                  { id: 'bottom-right', label: 'Abajo Derecha' },
                  { id: 'bottom-left', label: 'Abajo Izquierda' },
                  { id: 'top-center', label: 'Arriba Centro' },
                  { id: 'top-right', label: 'Arriba Derecha' }
                ].map(pos => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition ${
                      position === pos.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Options Checkbox */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={skipFirstPage}
                  onChange={(e) => setSkipFirstPage(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Omitir la primera página (no numerar la portada)</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Tamaño:</span>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value={9}>Pequeño (9 pt)</option>
                  <option value={11}>Mediano (11 pt)</option>
                  <option value={13}>Grande (13 pt)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex flex-col items-center justify-center gap-2">
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension=".pdf"
              label="Nombre del archivo numerado al descargar:"
            />

            <button
              onClick={handleApplyNumbers}
              disabled={isProcessing}
              className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Insertando números...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Numerar y Descargar PDF</span>
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
