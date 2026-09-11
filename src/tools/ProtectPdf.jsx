import React, { useState } from 'react';
import * as pdfLib from 'pdf-lib';
import { configure, lock } from 'pdf-lib-encrypt';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Download, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  KeyRound 
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ToolHeader from '../components/ToolHeader';
import DownloadFilenameInput from '../components/DownloadFilenameInput';
import { readFileAsArrayBuffer, downloadFile, formatBytes } from '../utils/helpers';

// Initialize configure once
configure(pdfLib);

export default function ProtectPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [customFilename, setCustomFilename] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [algo, setAlgo] = useState('aes256'); // 'aes256' | 'rc4'
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
    setCustomFilename(selectedFile.name.replace(/\.[^/.]+$/, '') + '_protegido');
  };

  const handleProtect = async () => {
    if (!file) return;

    if (!password) {
      setError('Debes ingresar una contraseña para proteger el PDF.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress('Cifrando documento con algoritmo de alta seguridad...');

      const buffer = await readFileAsArrayBuffer(file);
      const encryptedBytes = await lock(buffer, password, { algo });

      setProgress('Guardando PDF protegido...');
      const baseName = customFilename.trim() || 'documento_protegido';
      downloadFile(encryptedBytes, `${baseName}.pdf`, 'application/pdf');
      setProgress('¡Documento protegido con éxito!');
    } catch (err) {
      console.error('Error al cifrar PDF:', err);
      setError('Ocurrió un error al cifrar el documento. Verifica que el archivo no esté previamente bloqueado.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader
        title="Proteger PDF con Contraseña"
        description="Añade cifrado AES-256 a tu documento para impedir accesos no autorizados. Solo quienes conozcan la clave podrán abrirlo."
        icon={Lock}
        iconColor="from-slate-700 to-slate-900"
        onBack={onBack}
        onReset={() => {
          setFile(null);
          setPassword('');
          setConfirmPassword('');
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
          title="Selecciona el PDF que deseas proteger"
          subtitle="Cifrado robusto con WebCrypto local sin enviar tu contraseña a servidores"
          buttonText="Seleccionar archivo PDF"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tamaño: {formatBytes(file.size)}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              Listo para cifrar
            </span>
          </div>

          {/* Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Contraseña de Apertura
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Escribe una contraseña segura"
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Repetir Contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la misma contraseña"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-500/50"
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Nivel de Cifrado
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAlgo('aes256')}
                  className={`p-3 rounded-xl border text-left transition ${
                    algo === 'aes256'
                      ? 'border-slate-900 dark:border-white bg-slate-900/5 dark:bg-white/10 ring-1 ring-slate-900 dark:ring-white'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white">
                    AES-256 bits (Recomendado)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Máxima protección estándar para documentos modernos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAlgo('rc4')}
                  className={`p-3 rounded-xl border text-left transition ${
                    algo === 'rc4'
                      ? 'border-slate-900 dark:border-white bg-slate-900/5 dark:bg-white/10 ring-1 ring-slate-900 dark:ring-white'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white">
                    RC4-128 bits (Legacy)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Compatible con lectores y dispositivos antiguos.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 flex flex-col items-center justify-center gap-2">
            <DownloadFilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              extension=".pdf"
              label="Nombre del archivo protegido al descargar:"
            />

            <button
              onClick={handleProtect}
              disabled={isProcessing || !password}
              className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Cifrando PDF...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Proteger y Descargar PDF</span>
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
