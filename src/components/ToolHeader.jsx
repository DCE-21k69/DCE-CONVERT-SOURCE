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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-start sm:items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          title="Volver al inicio"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${iconColor} flex items-center justify-center text-white shadow-md shrink-0`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {hasFiles && onReset && (
        <button
          onClick={onReset}
          className="self-end sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Cambiar archivo(s)
        </button>
      )}
    </div>
  );
}
