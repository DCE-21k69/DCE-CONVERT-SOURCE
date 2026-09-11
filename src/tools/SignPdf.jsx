import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import { 
  PenTool, 
  Download, 
  Loader2, 
  AlertCircle, 
  Eraser, 
  Upload, 
  Type, 
  Move, 
  Check,
  CheckCircle2
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { readFileAsArrayBuffer, downloadFile, generatePdfThumbnail } from '../utils/helpers';
import { pdfjsLib } from '../utils/pdfWorker';

export default function SignPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [numPages, setNumPages] = useState(1);
  const [targetPage, setTargetPage] = useState(1);
  const [pagePreview, setPagePreview] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 595, height: 842 });

  // Signature creation mode: 'draw' | 'upload' | 'type'
  const [signMode, setSignMode] = useState('draw');
  const [penColor, setPenColor] = useState('#000000');
  const [typedName, setTypedName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);

  // Signature placement on page (percentages or pt)
  const [sigPos, setSigPos] = useState({ x: 50, y: 80 }); // in percentages: 50% X, 80% Y
  const [sigWidthPercent, setSigWidthPercent] = useState(25); // 25% of page width

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

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
      setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_firmado');
      setIsLoadingDoc(true);
      setProgress('Cargando documento para firma...');

      const buffer = await readFileAsArrayBuffer(selectedFile);
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const pdfDoc = await loadingTask.promise;
      setNumPages(pdfDoc.numPages);
      setTargetPage(1);

      await loadPagePreview(selectedFile, 1);
    } catch (err) {
      console.error('Error al cargar PDF:', err);
      setError('No se pudo cargar el documento.');
    } finally {
      setIsLoadingDoc(false);
      setProgress(null);
    }
  };

  const loadPagePreview = async (fileObj, pNum) => {
    const thumb = await generatePdfThumbnail(fileObj, pNum, 0.8);
    if (thumb) {
      setPagePreview(thumb.dataUrl);
      setPageDimensions({ width: thumb.width, height: thumb.height });
    }
  };

  const handlePageChange = async (newPage) => {
    setTargetPage(newPage);
    if (file) {
      await loadPagePreview(file, newPage);
    }
  };

  // Drawing Canvas logic with accurate touch scaling for phones & tablets
  const startDrawing = (e) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    isDrawingRef.current = true;
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (canvasRef.current) {
      setSignatureDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureDataUrl(null);
    }
  };

  // Type signature generator
  const handleTypeSignature = (text) => {
    setTypedName(text);
    if (!text.trim()) {
      setSignatureDataUrl(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'italic 44px "Brush Script MT", "Segoe Script", cursive';
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 200, 75);

    setSignatureDataUrl(canvas.toDataURL('image/png'));
  };

  // Upload image signature
  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSignatureDataUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplySignature = async () => {
    if (!file || !signatureDataUrl) {
      setError('Por favor dibuja, escribe o sube una firma primero.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Estampando firma digital...');

      const buffer = await readFileAsArrayBuffer(file);
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const page = pages[targetPage - 1];
      const { width: pWidth, height: pHeight } = page.getSize();

      // Embed signature PNG
      const pngImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
      const signatureImage = await pdfDoc.embedPng(pngImageBytes);

      const sigImgAspect = signatureImage.height / signatureImage.width;
      const targetWidth = (pWidth * sigWidthPercent) / 100;
      const targetHeight = targetWidth * sigImgAspect;

      // In PDF coordinates: (0,0) is bottom-left
      // sigPos.x: percentage from left (0 to 100)
      // sigPos.y: percentage from top (0 to 100)
      const posX = (pWidth * sigPos.x) / 100 - targetWidth / 2;
      const posY = pHeight - ((pHeight * sigPos.y) / 100) - targetHeight / 2;

      page.drawImage(signatureImage, {
        x: Math.max(0, posX),
        y: Math.max(0, posY),
        width: targetWidth,
        height: targetHeight
      });

      setProgress('Generando documento PDF firmado...');
      const finalBytes = await pdfDoc.save();
      const baseName = customFilename.trim() || 'documento_firmado';
      downloadFile(finalBytes, `${baseName}.pdf`, 'application/pdf');
      setProgress('¡Documento firmado exitosamente!');
    } catch (err) {
      console.error('Error al firmar PDF:', err);
      setError('Ocurrió un error al estampar la firma.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <ToolHeader
        title="Firmar Documento PDF"
        description="Crea tu firma digital dibujando, escribiendo o subiendo una imagen, y colócala exactamente donde la necesitas en el PDF."
        icon={PenTool}
        iconColor="from-emerald-600 to-teal-600"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setSignatureDataUrl(null);
          clearCanvas();
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
          title="Selecciona el PDF que deseas firmar"
          subtitle="Firma contratos, solicitudes y documentos con total privacidad sin subirlos a internet"
          buttonText="Seleccionar archivo PDF"
        />
      ) : isLoadingDoc ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{progress}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Creation (Left side) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Signature Creation Tab */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  1. Crear tu Firma
                </span>
                
                {/* Pen color */}
                <div className="flex items-center gap-1.5">
                  {['#000000', '#1d4ed8', '#dc2626'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setPenColor(c);
                        if (signMode === 'type') handleTypeSignature(typedName);
                      }}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border-2 ${penColor === c ? 'border-emerald-500 scale-110' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Mode switch */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSignMode('draw')}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    signMode === 'draw'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Dibujar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignMode('type')}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    signMode === 'type'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Escribir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignMode('upload')}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    signMode === 'upload'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir</span>
                </button>
              </div>

              {/* Mode 1: Draw on canvas */}
              {signMode === 'draw' && (
                <div className="space-y-2">
                  <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-white overflow-hidden shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 cursor-crosshair touch-none"
                    />
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 shadow-xs"
                      title="Borrar lienzo"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Limpiar</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">Dibuja tu rúbrica con el ratón o en pantalla táctil.</p>
                </div>
              )}

              {/* Mode 2: Type signature */}
              {signMode === 'type' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => handleTypeSignature(e.target.value)}
                    placeholder="Escribe tu nombre y apellido..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none"
                  />
                  {typedName && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-white text-center">
                      <span
                        style={{ color: penColor }}
                        className="text-3xl font-normal italic font-serif"
                      >
                        {typedName}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Upload signature image */}
              {signMode === 'upload' && (
                <div>
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/40">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Subir imagen de firma (PNG transparente recomendado)
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Position & Size adjustments */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                2. Ubicación en el Documento
              </span>

              {/* Page selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Página a firmar:</span>
                <select
                  value={targetPage}
                  onChange={(e) => handlePageChange(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  {Array.from({ length: numPages }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Página {i + 1} de {numPages}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Posición Horizontal (X)</span>
                    <span className="text-emerald-600 font-bold">{sigPos.x}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={sigPos.x}
                    onChange={(e) => setSigPos({ ...sigPos, x: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Posición Vertical (Y)</span>
                    <span className="text-emerald-600 font-bold">{sigPos.y}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={sigPos.y}
                    onChange={(e) => setSigPos({ ...sigPos, y: parseInt(e.target.value, 10) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Tamaño de la Firma</span>
                    <span className="text-emerald-600 font-bold">{sigWidthPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={sigWidthPercent}
                    onChange={(e) => setSigWidthPercent(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Download Filename Input & Action Button */}
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension=".pdf"
              label="Nombre del archivo firmado al descargar:"
            />

            <button
              onClick={handleApplySignature}
              disabled={isProcessing || !signatureDataUrl}
              className="w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Firmando documento...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Estampar Firma y Descargar PDF</span>
                </>
              )}
            </button>

            {progress && (
              <p className="text-xs text-center text-slate-500 font-medium animate-pulse">
                {progress}
              </p>
            )}
          </div>

          {/* Interactive Document Preview (Right side) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              Vista previa: Página {targetPage} de {numPages}
            </div>

            <div
              className="relative w-full max-w-[320px] aspect-[1/1.41] bg-white rounded-lg shadow-md border border-slate-300 overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                setSigPos({ x: clickX, y: clickY });
              }}
              title="Haz clic en cualquier punto para mover la firma allí"
            >
              {pagePreview ? (
                <img
                  src={pagePreview}
                  alt="Vista previa del documento"
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Cargando página...
                </div>
              )}

              {/* Signature marker overlay */}
              {signatureDataUrl && (
                <div
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center border-2 border-dashed border-emerald-500 bg-emerald-500/10 rounded"
                  style={{
                    left: `${sigPos.x}%`,
                    top: `${sigPos.y}%`,
                    width: `${sigWidthPercent}%`,
                    height: 'auto'
                  }}
                >
                  <img
                    src={signatureDataUrl}
                    alt="Firma"
                    className="w-full object-contain"
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 mt-2 text-center">
              💡 Tip: Puedes hacer clic en cualquier parte de la página para colocar la firma.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
