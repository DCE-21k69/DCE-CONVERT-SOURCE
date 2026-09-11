import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  FileImage, 
  Download, 
  Loader2, 
  AlertCircle, 
  Archive, 
  Sliders, 
  Image as ImageIcon 
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { readFileAsArrayBuffer, downloadFile, triggerConfetti } from '../utils/helpers';
import { pdfjsLib } from '../utils/pdfWorker';

export default function PdfToImage({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [format, setFormat] = useState('jpeg'); // 'jpeg' | 'png'
  const [scaleFactor, setScaleFactor] = useState(1.5); // 1.0, 1.5, 2.0
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelected = async ([selectedFile]) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Por favor selecciona un archivo PDF válido.');
      return;
    }
    setError(null);
    setFile(selectedFile);
    setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_imagenes');
    setImages([]);
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setImages([]);
      setProgress('Leyendo documento PDF...');

      const buffer = await readFileAsArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdfDoc = await loadingTask.promise;
      const totalPages = pdfDoc.numPages;

      const convertedImages = [];
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const extension = format === 'jpeg' ? 'jpg' : 'png';

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Renderizando página ${i} de ${totalPages} en alta calidad...`);
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: scaleFactor });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Fill background white for JPEG
        if (format === 'jpeg') {
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        const dataUrl = canvas.toDataURL(mimeType, 0.92);
        convertedImages.push({
          pageNumber: i,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
          extension
        });
      }

      setImages(convertedImages);
      setProgress(`¡${totalPages} páginas convertidas con éxito!`);
      triggerConfetti();
    } catch (err) {
      console.error('Error al convertir PDF a Imagen:', err);
      setError('Ocurrió un error al convertir el PDF. Puede que el archivo esté protegido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingle = (img) => {
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = `${baseName}_pagina_${img.pageNumber}.${img.extension}`;
    a.click();
  };

  const downloadAllZip = async () => {
    try {
      setProgress('Empaquetando imágenes en ZIP...');
      const zip = new JSZip();
      const zipBaseName = customFilename.trim() || `${file.name.replace(/\.[^/.]+$/, '')}_imagenes`;

      images.forEach(img => {
        const base64Data = img.dataUrl.split(',')[1];
        zip.file(`${zipBaseName}_pagina_${img.pageNumber}.${img.extension}`, base64Data, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadFile(zipBlob, `${zipBaseName}.zip`, 'application/zip');
      setProgress(null);
    } catch (err) {
      console.error('Error al crear ZIP:', err);
      setError('No se pudo generar el archivo ZIP.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader
        title="PDF a JPG / PNG"
        description="Extrae cada página de tu PDF como una imagen nítida en formato JPG o PNG. Descarga individualmente o todo en un ZIP."
        icon={FileImage}
        iconColor="from-yellow-500 to-amber-600"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setImages([]);
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
          title="Selecciona el PDF para convertirlo a imágenes"
          subtitle="Procesamiento ultrarrápido y privado directamente en tu navegador"
          buttonText="Seleccionar archivo PDF"
        />
      ) : (
        <div className="space-y-6">
          {/* Options & Controls */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Formato de Imagen
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('jpeg')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    format === 'jpeg'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  JPG (Menor peso)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('png')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                    format === 'png'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  PNG (Sin pérdidas)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Resolución / Calidad
              </label>
              <select
                value={scaleFactor}
                onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value={1.0}>Estándar (1x - Ideal para web)</option>
                <option value={1.5}>Alta Definición (1.5x - Recomendada)</option>
                <option value={2.0}>Ultra HD (2x - Máximo detalle para impresión)</option>
              </select>
            </div>
          </div>

          {/* Action trigger if not converted yet */}
          {images.length === 0 && (
            <div className="pt-2 flex flex-col items-center justify-center gap-3">
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Convirtiendo páginas...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>Convertir a {format.toUpperCase()} Ahora</span>
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

          {/* Converted images preview & download bar */}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="flex-1 max-w-xs">
                  <DownloadFilenameInput
                    value={customFilename}
                    onChange={setCustomFilename}
                    extension=".zip"
                    label="Nombre del archivo ZIP:"
                  />
                </div>

                <button
                  type="button"
                  onClick={downloadAllZip}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer shrink-0"
                >
                  <Archive className="w-4 h-4" />
                  <span>Descargar Todo en ZIP</span>
                </button>
              </div>

              {/* Grid of images */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div
                    key={img.pageNumber}
                    className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                  >
                    <div className="aspect-[3/4] p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40">
                      <img
                        src={img.dataUrl}
                        alt={`Página ${img.pageNumber}`}
                        className="max-h-full max-w-full object-contain rounded shadow-xs"
                      />
                    </div>
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Pág. {img.pageNumber}
                      </span>
                      <button
                        onClick={() => downloadSingle(img)}
                        className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        title="Descargar imagen"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
