import React, { useState } from 'react';
import { X, Cloud, Terminal, CheckCircle2, Copy, ExternalLink, ArrowRight, FolderArchive, GitBranch } from 'lucide-react';

export default function NetlifyModal({ isOpen, onClose }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isOpen) return null;

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Cómo subir tu página a Netlify
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Gratis, con dominio propio o subdominio .netlify.app y SSL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-6">
          
          {/* Method 1: Netlify Drop (Easiest) */}
          <div className="p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                <FolderArchive className="w-4 h-4" />
                Método 1: Netlify Drop (El más rápido y fácil - Sin Git)
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 font-semibold">
                Recomendado
              </span>
            </div>
            
            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2.5 list-decimal list-inside">
              <li>
                <span className="font-semibold">Compila tu proyecto</span> ejecutando en la terminal:
                <div className="mt-1.5 flex items-center justify-between p-2 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px]">
                  <span>npm run build</span>
                  <button
                    onClick={() => copyToClipboard('npm run build', 1)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                  >
                    {copiedIndex === 1 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 1 ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Esto genera la carpeta optimizada <code className="font-mono text-emerald-600 dark:text-emerald-400">dist/</code>.</p>
              </li>
              <li>
                Inicia sesión en{' '}
                <a
                  href="https://app.netlify.com/drop"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-rose-600 dark:text-rose-400 underline inline-flex items-center gap-0.5"
                >
                  app.netlify.com/drop <ExternalLink className="w-3 h-3" />
                </a>.
              </li>
              <li>
                <span className="font-semibold">Arrastra la carpeta <code className="font-mono">dist</code></span> de este proyecto directamente a la ventana de Netlify Drop.
              </li>
              <li>
                ¡Listo! En 5 segundos Netlify te entregará tu enlace activo para compartir con cualquier persona.
              </li>
            </ol>
          </div>

          {/* Method 2: Git & Continuous Deployment */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">
              <GitBranch className="w-4 h-4" />
              Método 2: Conexión con GitHub / GitLab (Despliegue Automático)
            </div>

            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside">
              <li>Crea un repositorio en GitHub y sube este código.</li>
              <li>En tu panel de Netlify, haz clic en <span className="font-semibold">"Add new site" → "Import an existing project"</span>.</li>
              <li>Elige tu repositorio de GitHub.</li>
              <li>
                Netlify detectará automáticamente el archivo preconfigurado <code className="font-mono text-cyan-600 dark:text-cyan-400">netlify.toml</code>:
                <ul className="pl-6 mt-1 space-y-0.5 text-[11px] text-slate-500 font-mono">
                  <li>• Build command: npm run build</li>
                  <li>• Publish directory: dist</li>
                </ul>
              </li>
              <li>Haz clic en <span className="font-semibold">"Deploy site"</span> y cada vez que hagas un cambio se actualizará en tiempo real.</li>
            </ol>
          </div>

          {/* Key Advantage Note */}
          <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 text-xs text-cyan-800 dark:text-cyan-300 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong>Ventaja clave:</strong> Al procesar todo en el navegador, tu cuenta de Netlify nunca consumirá límites de servidor, funciones serverless ni ancho de banda pesado de subida de archivos. ¡Es 100% gratis para siempre!
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition shadow"
          >
            Entendido, cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
