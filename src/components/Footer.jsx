import React from 'react';
  import { Shield, Zap, Lock, Heart, CheckCircle2, Cloud } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Features banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                100% Privado y Seguro
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tus archivos nunca viajan por internet ni a servidores de terceros. Todo se procesa localmente en tu navegador.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Gratis y Sin Restricciones
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sin registros obligatorios, sin límites de conversión por hora y sin marcas de agua no deseadas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Optimizado para Netlify
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Diseñado como arquitectura estática JAMstack. Súbelo arrastrando la carpeta <code className="text-cyan-500 font-mono">dist</code> o vía Git.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} DCE Convert - Suite de Herramientas PDF de Código Abierto.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
              Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> para la comunidad
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
