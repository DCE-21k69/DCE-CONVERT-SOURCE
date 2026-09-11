import React, { useState } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { 
  Stamp, 
  Download, 
  Loader2, 
  AlertCircle, 
  Eye 
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { readFileAsArrayBuffer, downloadFile, generatePdfThumbnail } from '../utils/helpers';

export default function WatermarkPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [text, setText] = useState('CONFIDENCIAL');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ef4444'); // red-500
  const [opacity, setOpacity] = useState(0.35);
  const [rotation, setRotation] = useState(45); // 0, 45, -45, 90
  const [position, setPosition] = useState('center'); // 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  const [previewThumb, setPreviewThumb] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const hexToRgb01 = (hex) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    return { r, g, b };
  };

  const handleFileSelected = async ([selectedFile]) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Por favor selecciona un archivo PDF válido.');
      return;
    }

    try {
      setError(null);
      setFile(selectedFile);
      setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_marca_agua');
      const thumb = await generatePdfThumbnail(selectedFile, 1, 0.6);
      if (thumb) {
        setPreviewThumb(thumb.dataUrl);
      }
    } catch (err) {
      console.error('Error generating preview:', err);
    }
  };

  const handleApplyWatermark = async () => {
    if (!file || !text.trim()) {
      setError('Por favor escribe un texto para la marca de agua.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Iniciando estampado de marca de agua...');

      const buffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      const { r, g, b } = hexToRgb01(color);

      for (let i = 0; i < pages.length; i++) {
        setProgress(`Aplicando marca de agua a página ${i + 1} de ${pages.length}...`);
        const page = pages[i];
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x = width / 2;
        let y = height / 2;

        if (position === 'center') {
          // Adjust for center pivot
          const rad = (rotation * Math.PI) / 180;
          x = (width - textWidth * Math.cos(rad)) / 2;
          y = (height - textWidth * Math.sin(rad)) / 2;
        } else if (position === 'top-left') {
          x = 40;
          y = height - 60;
        } else if (position === 'top-right') {
          x = width - textWidth - 40;
          y = height - 60;
        } else if (position === 'bottom-left') {
          x = 40;
          y = 40;
        } else if (position === 'bottom-right') {
          x = width - textWidth - 40;
          y = 40;
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: parseFloat(opacity),
          rotate: degrees(rotation)
        });
      }

      setProgress('Generando documento PDF final...');
      const finalBytes = await pdfDoc.save();
      const baseName = customFilename.trim() || 'documento_marca_agua';
      downloadFile(finalBytes, `${baseName}.pdf`, 'application/pdf');
      setProgress('¡Marca de agua aplicada con éxito!');
    } catch (err) {
      console.error('Error al aplicar marca de agua:', err);
      setError('Ocurrió un error al estampar la marca de agua.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader
        title="Marca de Agua en PDF"
        description="Agrega marcas de agua de texto personalizables con control total de color, opacidad, ángulo y posición."
        icon={Stamp}
        iconColor="from-pink-500 to-rose-600"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setPreviewThumb(null);
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
          title="Selecciona el PDF para agregar marca de agua"
          subtitle="Protege tus derechos o marca borradores con tu texto personalizado"
          buttonText="Seleccionar archivo PDF"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls settings (left side) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              {/* Text input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Texto de la Marca de Agua
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Ej. CONFIDENCIAL / BORRADOR / MI EMPRESA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>

              {/* Quick Text presets */}
              <div className="flex flex-wrap gap-1.5">
                {['CONFIDENCIAL', 'BORRADOR', 'SOLO COPIA', 'PROHIBIDA REPRODUCCIÓN'].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setText(preset)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Sliders and selects grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Font size */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Tamaño de Fuente</span>
                    <span className="text-rose-500">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="96"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Opacidad</span>
                    <span className="text-rose-500">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                    />
                    <div className="flex gap-1.5">
                      {['#ef4444', '#3b82f6', '#10b981', '#64748b', '#000000'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-full border-2 transition ${
                            color.toLowerCase() === c ? 'border-rose-500 scale-110 shadow-xs' : 'border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rotation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rotación
                  </label>
                  <select
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value={45}>45° Diagonal Ascendente</option>
                    <option value={-45}>-45° Diagonal Descendente</option>
                    <option value={0}>0° Horizontal</option>
                    <option value={90}>90° Vertical</option>
                  </select>
                </div>
              </div>

              {/* Position */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Posición
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'center', label: 'Centro' },
                    { id: 'top-left', label: 'Sup. Izquierda' },
                    { id: 'top-right', label: 'Sup. Derecha' },
                    { id: 'bottom-left', label: 'Inf. Izquierda' },
                    { id: 'bottom-right', label: 'Inf. Derecha' }
                  ].map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition ${
                        position === pos.id
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="flex flex-col items-center justify-center gap-2">
              <DownloadFilenameInput
                value={customFilename}
                onChange={setCustomFilename}
                extension=".pdf"
                label="Nombre del archivo con marca de agua:"
              />

              <button
                onClick={handleApplyWatermark}
                disabled={isProcessing || !text.trim()}
                className="w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Estampando marca de agua...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Aplicar y Descargar PDF con Marca de Agua</span>
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

          {/* Real-time live visual preview (right side) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
              <Eye className="w-4 h-4" />
              <span>Simulación en tiempo real (Página 1)</span>
            </div>

            <div className="relative w-full max-w-[280px] aspect-[1/1.41] bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden flex items-center justify-center">
              {previewThumb ? (
                <img
                  src={previewThumb}
                  alt="Vista previa"
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="text-xs text-slate-400">Página de ejemplo</div>
              )}

              {/* Watermark overlay on preview */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                style={{
                  alignItems: position.includes('top') ? 'flex-start' : position.includes('bottom') ? 'flex-end' : 'center',
                  justifyContent: position.includes('left') ? 'flex-start' : position.includes('right') ? 'flex-end' : 'center',
                  padding: '24px'
                }}
              >
                <span
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    color: color,
                    opacity: opacity,
                    fontSize: `${Math.max(14, Math.round(fontSize * 0.45))}px`,
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase'
                  }}
                >
                  {text || 'MARCA DE AGUA'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
