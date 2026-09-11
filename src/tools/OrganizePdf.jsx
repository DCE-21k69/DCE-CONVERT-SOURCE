import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { 
  LayoutGrid, 
  RotateCw, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  Loader2, 
  AlertCircle,
  GripVertical
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { extractAllPdfThumbnails, readFileAsArrayBuffer, downloadFile } from '../utils/helpers';

export default function OrganizePdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
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
      setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_organizado');
      setIsLoading(true);
      setProgress('Generando miniaturas de las páginas...');

      const result = await extractAllPdfThumbnails(selectedFile);
      if (result && result.pages) {
        setPages(result.pages);
      }
    } catch (err) {
      console.error('Error loading PDF for organize:', err);
      setError('No se pudo procesar el PDF. Verifica que no tenga contraseña.');
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  const movePage = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= pages.length) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[target];
    newPages[target] = temp;
    setPages(newPages);
  };

  const handleDropReorder = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined || fromIndex === toIndex) return;
    const newPages = [...pages];
    const [moved] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, moved);
    setPages(newPages);
    setDraggedIndex(null);
  };

  const rotatePage = (index) => {
    setPages(pages.map((p, idx) => {
      if (idx === index) {
        return { ...p, rotation: (p.rotation + 90) % 360 };
      }
      return p;
    }));
  };

  const rotateAllPages = () => {
    setPages(pages.map(p => ({
      ...p,
      rotation: (p.rotation + 90) % 360
    })));
  };

  const removePage = (index) => {
    if (pages.length <= 1) {
      setError('El documento debe contener al menos una página.');
      return;
    }
    setError(null);
    setPages(pages.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    if (pages.length === 0) {
      setError('No quedan páginas en el documento.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Construyendo nuevo PDF organizado...');

      const buffer = await readFileAsArrayBuffer(file);
      const originalPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const item = pages[i];
        setProgress(`Organizando página ${i + 1} de ${pages.length}...`);
        
        const [copiedPage] = await newPdf.copyPages(originalPdf, [item.pageIndex]);
        
        if (item.rotation) {
          const currentRot = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRot + item.rotation) % 360));
        }

        newPdf.addPage(copiedPage);
      }

      setProgress('Guardando archivo...');
      const finalBytes = await newPdf.save();
      const baseName = customFilename.trim() || 'documento_organizado';
      downloadFile(finalBytes, `${baseName}.pdf`, 'application/pdf');
      setProgress('¡Guardado con éxito!');
    } catch (err) {
      console.error('Error al guardar PDF organizado:', err);
      setError('Ocurrió un error al guardar el PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <ToolHeader
        title="Organizar y Eliminar Páginas"
        description="Reordena páginas arrastrándolas libremente o con botones, gíralas individualmente o elimina las que ya no necesitas."
        icon={LayoutGrid}
        iconColor="from-violet-500 to-purple-600"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setPages([]);
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
          title="Selecciona el PDF para organizar sus páginas"
          subtitle="Previsualiza cada página y arrástrala con el ratón o usa botones para ajustar el orden"
          buttonText="Seleccionar archivo PDF"
        />
      ) : isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{progress}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                {pages.length} páginas en el documento
              </span>
              <span className="text-xs text-violet-600 dark:text-violet-400 font-medium hidden sm:inline">
                ✨ ¡Puedes arrastrar y soltar las páginas para moverlas!
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={rotateAllPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 transition shadow-xs"
              >
                <RotateCw className="w-3.5 h-3.5 text-violet-500" />
                <span>Girar todas 90°</span>
              </button>
            </div>
          </div>

          {/* Thumbnails grid with Drag & Drop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
            {pages.map((p, idx) => {
              const isBeingDragged = draggedIndex === idx;

              return (
                <div
                  key={`${p.pageIndex}-${idx}`}
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
                  className={`group flex flex-col rounded-xl overflow-hidden border bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                    isBeingDragged
                      ? 'opacity-40 scale-95 border-dashed border-violet-500 ring-2 ring-violet-500/50'
                      : 'border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-violet-500/50 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Header with index badge and drag handle */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-500 transition" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Pág. {idx + 1}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      (Orig: {p.pageNumber})
                    </span>
                  </div>

                  {/* Page preview with rotation */}
                  <div className="aspect-[3/4] p-3 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden pointer-events-none">
                    <div
                      style={{
                        transform: `rotate(${p.rotation}deg)`,
                        transition: 'transform 0.2s ease'
                      }}
                      className="max-h-full max-w-full flex items-center justify-center"
                    >
                      <img
                        src={p.dataUrl}
                        alt={`Página ${p.pageNumber}`}
                        className="max-h-48 object-contain rounded shadow-xs pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Individual controls */}
                  <div 
                    className="p-1.5 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => movePage(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Mover a la izquierda"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => rotatePage(idx)}
                      className="p-1.5 rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition"
                      title="Girar 90° a la derecha"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removePage(idx)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Eliminar página"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => movePage(idx, 1)}
                      disabled={idx === pages.length - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      title="Mover a la derecha"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Download Filename & Action Button */}
          <div className="pt-2 flex flex-col items-center justify-center gap-2">
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension=".pdf"
              label="Nombre del archivo al descargar:"
            />

            <button
              onClick={handleSave}
              disabled={isProcessing || pages.length === 0}
              className="w-full sm:w-auto min-w-[260px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-violet-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando nuevo PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Guardar y Descargar PDF Organizado</span>
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
