import React, { useState } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { 
  Images, 
  Download, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  ArrowLeft, 
  ArrowRight, 
  FilePlus2,
  Settings2,
  GripVertical
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { readFileAsArrayBuffer, readFileAsDataURL, downloadFile } from '../utils/helpers';

export default function ImageToPdf({ onBack }) {
  const [images, setImages] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [customFilename, setCustomFilename] = useState('Imagenes_Convertidas');
  const [pageSize, setPageSize] = useState('A4'); // 'A4' | 'Letter' | 'Fit'
  const [orientation, setOrientation] = useState('auto'); // 'auto' | 'portrait' | 'landscape'
  const [margin, setMargin] = useState(0); // 0, 20, 40
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const handleFilesSelected = async (selectedFiles) => {
    const validFiles = selectedFiles.filter(f => 
      f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      setError('Por favor selecciona imágenes válidas (JPG, PNG o WebP).');
      return;
    }

    setError(null);
    const newItems = [];
    for (const f of validFiles) {
      const dataUrl = await readFileAsDataURL(f);
      newItems.push({
        file: f,
        name: f.name,
        dataUrl
      });
    }

    setImages(prev => [...prev, ...newItems]);
  };

  const moveImage = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setImages(copy);
  };

  const handleDropReorder = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined || fromIndex === toIndex) return;
    const copy = [...images];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    setImages(copy);
    setDraggedIndex(null);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Creando documento PDF...');

      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < images.length; i++) {
        setProgress(`Procesando imagen ${i + 1} de ${images.length}...`);
        const item = images[i];
        
        // Convert image to PNG/JPG buffer via an offscreen canvas to standardize WebP/PNG/JPG
        const img = new Image();
        img.src = item.dataUrl;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const jpegBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
        const jpegBuffer = await jpegBlob.arrayBuffer();
        const embeddedImg = await pdfDoc.embedJpg(jpegBuffer);

        const imgWidth = embeddedImg.width;
        const imgHeight = embeddedImg.height;

        let pageWidth, pageHeight;

        if (pageSize === 'Fit') {
          pageWidth = imgWidth + margin * 2;
          pageHeight = imgHeight + margin * 2;
        } else {
          const standardSize = pageSize === 'Letter' ? PageSizes.Letter : PageSizes.A4;
          let isLandscape = false;
          if (orientation === 'landscape') {
            isLandscape = true;
          } else if (orientation === 'auto') {
            isLandscape = imgWidth > imgHeight;
          }

          if (isLandscape) {
            pageWidth = Math.max(standardSize[0], standardSize[1]);
            pageHeight = Math.min(standardSize[0], standardSize[1]);
          } else {
            pageWidth = Math.min(standardSize[0], standardSize[1]);
            pageHeight = Math.max(standardSize[0], standardSize[1]);
          }
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // Calculate fitted image dimensions maintaining aspect ratio
        const availWidth = pageWidth - margin * 2;
        const availHeight = pageHeight - margin * 2;
        const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);

        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;

        const posX = margin + (availWidth - finalWidth) / 2;
        const posY = margin + (availHeight - finalHeight) / 2;

        page.drawImage(embeddedImg, {
          x: posX,
          y: posY,
          width: finalWidth,
          height: finalHeight
        });
      }

      setProgress('Guardando archivo PDF...');
      const pdfBytes = await pdfDoc.save();
      const baseName = customFilename.trim() || 'Imagenes_Convertidas';
      downloadFile(pdfBytes, `${baseName}.pdf`, 'application/pdf');
      setProgress('¡PDF generado con éxito!');
    } catch (err) {
      console.error('Error al convertir imágenes a PDF:', err);
      setError('Hubo un error al crear el PDF a partir de las imágenes.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader
        title="Imagen a PDF"
        description="Convierte fotografías e imágenes JPG, PNG o WebP a un documento PDF limpio y perfectamente dimensionado."
        icon={Images}
        iconColor="from-blue-500 to-indigo-600"
        onBack={onBack}
        onReset={() => setImages([])}
        hasFiles={images.length > 0}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {images.length === 0 ? (
        <FileUploader
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          multiple={true}
          onFilesSelected={handleFilesSelected}
          title="Selecciona o arrastra tus imágenes"
          subtitle="Soporta múltiples imágenes JPG, PNG o WebP simultáneamente"
          buttonText="Seleccionar imágenes"
        />
      ) : (
        <div className="space-y-6">
          {/* Options toolbar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Tamaño de Página
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="A4">A4 (Estándar internacional)</option>
                <option value="Letter">Carta / Letter</option>
                <option value="Fit">Ajustar al tamaño exacto de la foto</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Orientación
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                disabled={pageSize === 'Fit'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none disabled:opacity-50"
              >
                <option value="auto">Automática (según cada foto)</option>
                <option value="portrait">Vertical (Portrait)</option>
                <option value="landscape">Horizontal (Landscape)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Márgenes
              </label>
              <select
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value={0}>Sin margen (Ajuste completo)</option>
                <option value={20}>Margen pequeño (20 px)</option>
                <option value={40}>Margen amplio (40 px)</option>
              </select>
            </div>
          </div>

          {/* Images header & add more */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {images.length} {images.length === 1 ? 'imagen lista' : 'imágenes listas'}
            </span>

            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 cursor-pointer transition shadow-xs">
              <FilePlus2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Añadir más fotos</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {/* Grid of images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
            {images.map((img, idx) => {
              const isBeingDragged = draggedIndex === idx;

              return (
                <div
                  key={idx}
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
                  className={`group flex flex-col rounded-xl overflow-hidden border bg-white dark:bg-slate-800 shadow-sm transition cursor-grab active:cursor-grabbing select-none ${
                    isBeingDragged
                      ? 'opacity-40 border-dashed border-blue-500 scale-95'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-500/50'
                  }`}
                >
                  <div className="aspect-[4/3] p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-950/40 pointer-events-none">
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="max-h-full max-w-full object-contain rounded pointer-events-none"
                    />
                  </div>
                  <div 
                    className="p-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-3 h-3 text-slate-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === images.length - 1}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action button */}
          <div className="pt-2 flex flex-col items-center justify-center gap-2">
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension=".pdf"
              label="Nombre del archivo PDF resultante:"
            />

            <button
              onClick={handleGeneratePdf}
              disabled={isProcessing}
              className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Convertir a PDF Ahora ({images.length} fotos)</span>
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
