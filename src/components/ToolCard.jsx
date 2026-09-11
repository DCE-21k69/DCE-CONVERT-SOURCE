import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function ToolCard({ tool, onSelect }) {
  const { id, title, description, icon: Icon, color, badge, category } = tool;

  return (
    <div
      onClick={() => onSelect(id)}
      className="group relative cursor-pointer flex flex-col justify-between p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-rose-500/40 dark:hover:border-rose-500/40 hover:-translate-y-1 active:scale-[0.98] transition-all duration-200"
    >
      {badge && (
        <span className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          {badge}
        </span>
      )}

      <div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr ${color} text-white flex items-center justify-center shadow-md mb-3 sm:mb-4 group-hover:scale-105 transition duration-200`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition leading-snug">
          {title}
        </h3>

        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-1.5 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400">
        <span>Abrir herramienta</span>
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition duration-200" />
      </div>
    </div>
  );
}
