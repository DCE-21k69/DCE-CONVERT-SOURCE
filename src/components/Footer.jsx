import React from 'react';
import { Lock, Zap, Smartphone, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 sm:mt-24 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        
        {/* Features banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-8 sm:pb-10 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                100% Privado y Seguro
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Tus archivos nunca viajan por servidores innecesarios. Se procesan de forma rápida y confidencial.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Gratis y Sin Restricciones
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Sin registros obligatorios, sin límites de conversión por hora y sin marcas de agua molestas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:col-span-2 md:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Compatible con Celular, Tablet y PC
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Diseñado para adaptarse a cualquier pantalla táctil o de escritorio con la máxima velocidad.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 sm:pt-8 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <p>© {new Date().getFullYear()} DCE Convert - Suite de Herramientas PDF Completa.</p>
          <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>para la comunidad</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
