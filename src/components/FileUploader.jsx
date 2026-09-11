import React, { useRef, useState } from 'react';
import { UploadCloud, Plus } from 'lucide-react';

export default function FileUploader({ 
  onFilesSelected, 
  accept = '.pdf,application/pdf', 
  multiple = false, 
  title = 'Selecciona o arrastra tus archivos PDF',
  subtitle = 'Los archivos se procesan de forma 100% privada en tu navegador',
  buttonText = 'Elegir archivo(s)'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (multiple) {
        onFilesSelected(Array.from(e.dataTransfer.files));
      } else {
        onFilesSelected([e.dataTransfer.files[0]]);
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (multiple) {
        onFilesSelected(Array.from(e.target.files));
      } else {
        onFilesSelected([e.target.files[0]]);
      }
    }
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-12 text-center transition-all duration-200 group select-none ${
        isDragging
          ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 scale-[1.01]'
          : 'border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 hover:border-rose-500/80 hover:bg-rose-500/[0.02] dark:hover:border-rose-500/50 shadow-sm'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 group-hover:scale-105 group-hover:shadow-rose-500/40 transition-all duration-200">
          <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>

        <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md px-2">
          {subtitle}
        </p>

        <button
          type="button"
          className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-rose-600/20 active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{buttonText}</span>
        </button>

        <div className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
          Formatos admitidos: {accept.replaceAll('application/', '')}
        </div>
      </div>
    </div>
  );
}
