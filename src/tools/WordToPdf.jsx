import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Loader2, 
  AlertCircle, 
  FileType, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { downloadFile, formatBytes, triggerConfetti } from '../utils/helpers';
import { convertDocument } from '../utils/cloudConvert';

export default function WordToPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [downloadBlob, setDownloadBlob] = useState(null);

  const handleFileSelected = ([selectedFile]) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
      setError('Por favor selecciona un archivo Word válido con extensión .docx');
      return;
    }
    setError(null);
    setFile(selectedFile);
    setDownloadBlob(null);
    setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_convertido');
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Iniciando conversión...');

      const convertedBlob = await convertDocument({
        file,
        fromFormat: 'docx',
        toFormat: 'pdf',
        onProgress: (status) => setProgress(status)
      });

      setDownloadBlob(convertedBlob);
      const filename = (customFilename.trim() || 'documento_convertido') + '.pdf';
      downloadFile(convertedBlob, filename, 'application/pdf');

      triggerConfetti();
      setProgress(null);
    } catch (err) {
      console.error('Error al convertir Word a PDF:', err);
      setError(err.message || 'Error al procesar el archivo. Por favor inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAgain = () => {
    if (!downloadBlob) return;
    const filename = (customFilename.trim() || 'documento_convertido') + '.pdf';
    downloadFile(downloadBlob, filename, 'application/pdf');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader
        title="Word a PDF (.docx a PDF)"
        description="Convierte documentos Word a archivos PDF con diseño fiel, tablas e imágenes intactas y tipografía nítida."
        icon={FileType}
        iconColor="from-blue-600 to-indigo-700"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setDownloadBlob(null);
          setError(null);
        }}
        hasFiles={!!file}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Aviso:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!file ? (
        <FileUploader
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Selecciona el documento Word (.docx) para convertir a PDF"
          subtitle="Conversión de alta definición con tablas, márgenes y fuentes originales"
          buttonText="Seleccionar archivo Word (.docx)"
        />
      ) : (
        <div className="space-y-6">
          {/* File Summary Card */}
          <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/25">
                DOCX
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tamaño: {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              Listo para convertir
            </span>
          </div>

          {/* Action Box */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension=".pdf"
              label="Nombre del archivo PDF descargado:"
            />

            {downloadBlob ? (
              <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>¡PDF generado y descargado exitosamente!</span>
                </div>

                <button
                  onClick={handleDownloadAgain}
                  className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Volver a Descargar PDF</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full sm:w-auto min-w-[280px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{progress || 'Procesando...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Convertir a PDF</span>
                  </>
                )}
              </button>
            )}

            {isProcessing && progress && (
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
