import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  Minimize2, 
  Download, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { formatBytes, readFileAsArrayBuffer, downloadFile } from '../utils/helpers';
import { pdfjsLib } from '../utils/pdfWorker';

export default function CompressPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [level, setLevel] = useState('medium'); // 'extreme' | 'medium' | 'low'
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const compressionConfigs = {
    extreme: {
      title: 'Compresión Extrema',
      desc: 'Menos calidad, máxima reducción de tamaño',
      scale: 1.0,
      quality: 0.55,
      color: 'border-red-500 text-red-500 bg-red-500/10'
    },
    medium: {
      title: 'Compresión Recomendada',
      desc: 'Buena calidad, excelente reducción de tamaño',
      scale: 1.3,
      quality: 0.75,
      color: 'border-emerald-500 text-emerald-500 bg-emerald-500/10',
      badge: 'Recomendada'
    },
    low: {
      title: 'Baja Compresión',
      desc: 'Alta calidad visual, menor reducción de tamaño',
      scale: 1.6,
      quality: 0.88,
      color: 'border-blue-500 text-blue-500 bg-blue-500/10'
    }
  };

  const handleFileSelected = ([selectedFile]) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Por favor selecciona un archivo PDF válido.');
      return;
    }
    setError(null);
    setResult(null);
    setFile(selectedFile);
    setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_comprimido');
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);
      setProgress('Cargando documento PDF...');

      const buffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const newPdf = await PDFDocument.create();
      const cfg = compressionConfigs[level];

      for (let i = 1; i <= numPages; i++) {
        setProgress(`Optimizando y re-muestreando página ${i} de ${numPages}...`);
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: cfg.scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const imgDataUrl = canvas.toDataURL('image/jpeg', cfg.quality);
        const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());
        const embeddedImg = await newPdf.embedJpg(imgBytes);

        // Match original page aspect ratio in points
        const origViewport = page.getViewport({ scale: 1.0 });
        const newPage = newPdf.addPage([origViewport.width, origViewport.height]);
        newPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height
        });
      }

      setProgress('Guardando documento comprimido...');
      const compressedBytes = await newPdf.save();
      const originalSize = file.size;
      const newSize = compressedBytes.byteLength;
      const savedPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

      setResult({
        bytes: compressedBytes,
        originalSize,
        newSize,
        savedPercent
      });

      setProgress('¡Compresión finalizada!');
    } catch (err) {
      console.error('Error al comprimir PDF:', err);
      setError('Hubo un error durante la compresión. Es posible que el PDF esté protegido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = customFilename.trim() || 'documento_comprimido';
    downloadFile(result.bytes, `${baseName}.pdf`, 'application/pdf');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader
        title="Comprimir PDF"
        description="Reduce el tamaño de tus archivos PDF manteniendo la mejor calidad visual posible directamente en tu navegador."
        icon={Minimize2}
        iconColor="from-emerald-500 to-teal-600"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setResult(null);
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
          title="Selecciona el PDF que deseas comprimir"
          subtitle="Reducción eficiente y 100% privada sin subir tus datos a servidores"
          buttonText="Seleccionar archivo PDF"
        />
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tamaño actual: {formatBytes(file.size)}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              Listo para optimizar
            </span>
          </div>

          {/* Compression Level Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Nivel de Compresión
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(compressionConfigs).map(([key, cfg]) => (
                <div
                  key={key}
                  onClick={() => setLevel(key)}
                  className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all ${
                    level === key
                      ? `${cfg.color} ring-2 ring-emerald-500/20 shadow-sm`
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900'
                  }`}
                >
                  {cfg.badge && (
                    <span className="absolute -top-2.5 right-3 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                      {cfg.badge}
                    </span>
                  )}
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {cfg.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {cfg.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Results preview if finished */}
          {result && (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center animate-in zoom-in-95 duration-200">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                ¡Tu PDF ha sido optimizado con éxito!
              </h3>
              
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Antes</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 line-through">
                    {formatBytes(result.originalSize)}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-500" />
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Ahora</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {formatBytes(result.newSize)}
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center gap-1 shadow-sm">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-{result.savedPercent}%</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col items-center justify-center">
                <DownloadFilenameInput
                  value={customFilename}
                  onChange={setCustomFilename}
                  extension=".pdf"
                  label="Nombre del archivo comprimido al descargar:"
                />
                <button
                  onClick={handleDownload}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 inline-flex items-center gap-2 active:scale-95 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF Comprimido
                </button>
              </div>
            </div>
          )}

          {/* Action button if not compressed yet */}
          {!result && (
            <div className="pt-2 flex flex-col items-center justify-center gap-3">
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optimizando PDF...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Comprimir PDF Ahora</span>
                  </>
                )}
              </button>

              {progress && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                  {progress}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
