import React from 'react';
import { FileEdit } from 'lucide-react';

export default function DownloadFilenameInput({ 
  value, 
  onChange, 
  extension = '.pdf',
  label = 'Nombre del archivo al descargar:' 
}) {
  return (
    <div className="w-full max-w-md mx-auto mb-4 text-left">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        <FileEdit className="w-3.5 h-3.5 text-rose-500" />
        <span>{label}</span>
      </label>
      <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-inner overflow-hidden focus-within:ring-2 focus-within:ring-rose-500/50 focus-within:border-rose-500 transition">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nombre del archivo"
          className="w-full px-3.5 py-2.5 bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none"
        />
        {extension && (
          <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700/80 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 select-none">
            {extension.startsWith('.') ? extension : `.${extension}`}
          </span>
        )}
      </div>
    </div>
  );
}
