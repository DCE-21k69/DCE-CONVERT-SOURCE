import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  FilePlus2, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Download, 
  Loader2, 
  Files, 
  CheckCircle2, 
  AlertCircle,
  GripVertical 
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { formatBytes, readFileAsArrayBuffer, downloadFile } from '../utils/helpers';

export default function MergePdf({ onBack }) {
  const [files, setFiles] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [customFilename, setCustomFilename] = useState('PDF_Unido_DCE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const handleFilesSelected = (newFiles) => {
    const validPdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfs.length === 0) {
      setError('Por favor selecciona archivos PDF válidos.');
      return;
    }
    setError(null);
    setFiles(prev => {
      const updated = [...prev, ...validPdfs];
      if (!customFilename || customFilename === 'PDF_Unido_DCE') {
        setCustomFilename(validPdfs[0].name.replace(/\.[^/.]+$/, '') + '_unido');
      }
      return updated;
    });
  };

  const moveFile = (index, direction) => {
    const newFiles = [...files];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newFiles.length) return;
    const temp = newFiles[index];
    newFiles[index] = newFiles[targetIndex];
    newFiles[targetIndex] = temp;
    setFiles(newFiles);
  };

  const handleDropReorder = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined || fromIndex === toIndex) return;
    const newFiles = [...files];
    const [moved] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, moved);
    setFiles(newFiles);
    setDraggedIndex(null);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Debes agregar al menos 2 archivos PDF para poder unirlos.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Iniciando unión de documentos...');

      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        setProgress(`Procesando archivo ${i + 1} de ${files.length}: ${files[i].name}...`);
        const fileBuffer = await readFileAsArrayBuffer(files[i]);
        const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      setProgress('Generando documento PDF final...');
      const mergedPdfBytes = await mergedPdf.save();
      const filename = (customFilename.trim() || 'PDF_Unido') + '.pdf';
      downloadFile(mergedPdfBytes, filename, 'application/pdf');
      setProgress('¡Completado con éxito!');
    } catch (err) {
      console.error('Error al unir PDFs:', err);
      setError('Ocurrió un error al unir los archivos. Verifica que ningún PDF esté dañado o protegido con contraseña.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader
        title="Unir archivos PDF"
        description="Combina dos o más archivos PDF en el orden exacto que desees. Arrastra los archivos para ordenarlos libremente."
        icon={Files}
        iconColor="from-rose-500 to-red-600"
        onBack={onBack}
        onReset={() => setFiles([])}
        hasFiles={files.length > 0}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {files.length === 0 ? (
        <FileUploader
          multiple={true}
          onFilesSelected={handleFilesSelected}
          title="Selecciona o arrastra los PDFs que deseas unir"
          subtitle="Puedes seleccionar múltiples archivos a la vez para combinarlos"
          buttonText="Seleccionar archivos PDF"
        />
      ) : (
        <div className="space-y-6">
          {/* File list header & Add more */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {files.length} {files.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                (Tamaño total: {formatBytes(totalSize)})
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium block sm:inline sm:ml-2">
                ✨ ¡Arrastra las filas para reordenar!
              </span>
            </div>

            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 cursor-pointer transition shadow-sm">
              <FilePlus2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Añadir más PDFs</span>
              <input
                type="file"
                multiple
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {/* Draggable/Reorderable file list */}
          <div className="space-y-2">
            {files.map((file, idx) => {
              const isBeingDragged = draggedIndex === idx;

              return (
                <div
                  key={`${file.name}-${idx}`}
                  draggable={true}
                  onDragStart={(e) => {
                    setDraggedIndex(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropReorder(draggedIndex, idx);
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border shadow-sm transition cursor-grab active:cursor-grabbing select-none ${
                    isBeingDragged
                      ? 'opacity-40 border-dashed border-rose-500 scale-[0.99]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => moveFile(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Mover arriba"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFile(idx, 1)}
                      disabled={idx === files.length - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Mover abajo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition ml-1"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button & custom filename */}
          <div className="pt-4 flex flex-col items-center justify-center gap-2">
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension=".pdf"
              label="Nombre del archivo unido al descargar:"
            />

            <button
              onClick={handleMerge}
              disabled={isProcessing || files.length < 2}
              className="w-full sm:w-auto min-w-[260px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold text-sm shadow-lg shadow-rose-600/25 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unir {files.length} PDFs Ahora</span>
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
