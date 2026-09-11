import React from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

export default function ToolHeader({ 
  title, 
  description, 
  icon: Icon, 
  iconColor = 'from-rose-500 to-red-600', 
  onBack, 
  onReset, 
  hasFiles = false 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 mb-5 sm:mb-6 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onBack}
          className="p-2 -ml-1 sm:-ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition shrink-0"
          title="Volver al inicio"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr ${iconColor} flex items-center justify-center text-white shadow-md shrink-0`}>
          {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </div>

        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate sm:whitespace-normal">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 sm:line-clamp-none max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {hasFiles && onReset && (
        <button
          onClick={onReset}
          className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Cambiar archivo</span>
        </button>
      )}
    </div>
  );
}
