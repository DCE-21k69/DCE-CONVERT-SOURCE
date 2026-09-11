import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { 
  RotateCw, 
  RotateCcw, 
  Download, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { readFileAsArrayBuffer, downloadFile, extractAllPdfThumbnails } from '../utils/helpers';

export default function RotatePdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [angle, setAngle] = useState(90); // 90, 180, 270
  const [scope, setScope] = useState('all'); // 'all' | 'odd' | 'even'
  const [thumbnails, setThumbnails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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
      setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_rotado');
      setIsLoading(true);
      setProgress('Generando previsualizaciones...');

      const result = await extractAllPdfThumbnails(selectedFile);
      if (result) {
        setThumbnails(result.pages);
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('No se pudo cargar el PDF.');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const handleRotate = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Rotando páginas del PDF...');

      const buffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      for (let i = 0; i < pages.length; i++) {
        const pageNum = i + 1;
        let shouldRotate = false;

        if (scope === 'all') shouldRotate = true;
        else if (scope === 'odd' && pageNum % 2 !== 0) shouldRotate = true;
        else if (scope === 'even' && pageNum % 2 === 0) shouldRotate = true;

        if (shouldRotate) {
          const currentRotation = pages[i].getRotation().angle;
          pages[i].setRotation(degrees((currentRotation + angle) % 360));
        }
      }

      setProgress('Generando archivo final...');
      const finalBytes = await pdfDoc.save();
      const baseName = customFilename.trim() || 'documento_rotado';
      downloadFile(finalBytes, `${baseName}.pdf`, 'application/pdf');
      setProgress('¡PDF rotado exitosamente!');
    } catch (err) {
      console.error('Error al rotar PDF:', err);
      setError('Hubo un error al rotar el documento.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader
        title="Rotar PDF"
        description="Gira tus documentos PDF de forma permanente 90°, 180° o 270° en sentido horario o antihorario."
        icon={RotateCw}
        iconColor="from-sky-500 to-blue-600"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setThumbnails([]);
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
          title="Selecciona el PDF que deseas rotar"
          subtitle="Gira todas las páginas o solo páginas pares/impares con vista previa en vivo"
          buttonText="Seleccionar archivo PDF"
        />
      ) : isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{progress}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Ángulo de Giro
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '90° Der.', deg: 90 },
                  { label: '180°', deg: 180 },
                  { label: '270° (90° Izq.)', deg: 270 }
                ].map(item => (
                  <button
                    key={item.deg}
                    type="button"
                    onClick={() => setAngle(item.deg)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      angle === item.deg
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Páginas a Rotar
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'Todas' },
                  { id: 'odd', label: 'Impares' },
                  { id: 'even', label: 'Pares' }
                ].map(sc => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setScope(sc.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                      scope === sc.id
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time thumbnails preview */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Vista previa con la rotación aplicada ({thumbnails.length} páginas):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              {thumbnails.map(t => {
                let willRotate = false;
                if (scope === 'all') willRotate = true;
                else if (scope === 'odd' && t.pageNumber % 2 !== 0) willRotate = true;
                else if (scope === 'even' && t.pageNumber % 2 === 0) willRotate = true;

                const displayRotation = willRotate ? angle : 0;

                return (
                  <div
                    key={t.pageNumber}
                    className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                  >
                    <div className="aspect-[3/4] p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40 overflow-hidden">
                      <div
                        style={{
                          transform: `rotate(${displayRotation}deg)`,
                          transition: 'transform 0.3s ease'
                        }}
                        className="max-h-full max-w-full flex items-center justify-center"
                      >
                        <img
                          src={t.dataUrl}
                          alt={`Página ${t.pageNumber}`}
                          className="max-h-36 object-contain rounded"
                        />
                      </div>
                    </div>
                    <div className="p-1.5 border-t border-slate-100 dark:border-slate-700 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Pág. {t.pageNumber} {willRotate && <span className="text-sky-500 font-bold">({angle}°)</span>}
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
              extension=".pdf"
              label="Nombre del archivo rotado al descargar:"
            />

            <button
              onClick={handleRotate}
              disabled={isProcessing}
              className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rotando documento...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Rotar y Descargar PDF</span>
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
