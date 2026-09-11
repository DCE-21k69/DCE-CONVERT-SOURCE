import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Files, 
  Scissors, 
  Minimize2, 
  LayoutGrid, 
  FileImage, 
  Images, 
  RotateCw, 
  Stamp, 
  Binary, 
  Lock, 
  PenTool, 
  FileText, 
  FileType,
  FileSearch,
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Cloud,
  Loader2 
} from 'lucide-react';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToolCard from './components/ToolCard';

// Code-split / Lazy-loaded tool components for blazing initial page load
const MergePdf = lazy(() => import('./tools/MergePdf'));
const SplitPdf = lazy(() => import('./tools/SplitPdf'));
const CompressPdf = lazy(() => import('./tools/CompressPdf'));
const OrganizePdf = lazy(() => import('./tools/OrganizePdf'));
const PdfToImage = lazy(() => import('./tools/PdfToImage'));
const ImageToPdf = lazy(() => import('./tools/ImageToPdf'));
const RotatePdf = lazy(() => import('./tools/RotatePdf'));
const WatermarkPdf = lazy(() => import('./tools/WatermarkPdf'));
const PageNumbersPdf = lazy(() => import('./tools/PageNumbersPdf'));
const ProtectPdf = lazy(() => import('./tools/ProtectPdf'));
const SignPdf = lazy(() => import('./tools/SignPdf'));
const PdfToWord = lazy(() => import('./tools/PdfToWord'));
const WordToPdf = lazy(() => import('./tools/WordToPdf'));
const ExtractText = lazy(() => import('./tools/ExtractText'));

const TOOLS = [
  {
    id: 'merge',
    title: 'Unir PDF',
    description: 'Une y combina múltiples archivos PDF en un solo documento en el orden exacto que desees.',
    icon: Files,
    color: 'from-rose-500 to-red-600',
    badge: 'Popular',
    category: 'organize'
  },
  {
    id: 'split',
    title: 'Dividir PDF',
    description: 'Extrae páginas específicas por rangos o separa cada página en su propio archivo PDF.',
    icon: Scissors,
    color: 'from-amber-500 to-orange-600',
    badge: 'Popular',
    category: 'organize'
  },
  {
    id: 'compress',
    title: 'Comprimir PDF',
    description: 'Reduce el peso de tu archivo PDF manteniendo la máxima calidad visual directamente en el navegador.',
    icon: Minimize2,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Recomendado',
    category: 'edit'
  },
  {
    id: 'organize',
    title: 'Organizar Páginas',
    description: 'Visualiza miniaturas, reordena páginas arrastrándolas, rota individualmente o elimina páginas sobrantes.',
    icon: LayoutGrid,
    color: 'from-violet-500 to-purple-600',
    badge: 'Completo',
    category: 'organize'
  },
  {
    id: 'pdf-to-img',
    title: 'PDF a JPG / PNG',
    description: 'Extrae cada página de tu documento como una imagen de alta definición descargable en formato individual o ZIP.',
    icon: FileImage,
    color: 'from-yellow-500 to-amber-600',
    badge: 'Popular',
    category: 'convert'
  },
  {
    id: 'img-to-pdf',
    title: 'Imagen a PDF',
    description: 'Convierte fotos JPG, PNG o WebP a documentos PDF limpios con control de orientación, tamaño y márgenes.',
    icon: Images,
    color: 'from-blue-500 to-indigo-600',
    badge: 'Útil',
    category: 'convert'
  },
  {
    id: 'rotate',
    title: 'Rotar PDF',
    description: 'Gira las páginas de tus documentos PDF 90°, 180° o 270° con previsualización en tiempo real.',
    icon: RotateCw,
    color: 'from-sky-500 to-blue-600',
    category: 'edit'
  },
  {
    id: 'watermark',
    title: 'Marca de Agua',
    description: 'Estampa texto personalizado, rótulos de confidencialidad o sellos con control de ángulo, opacidad y posición.',
    icon: Stamp,
    color: 'from-pink-500 to-rose-600',
    badge: 'Pro',
    category: 'edit'
  },
  {
    id: 'page-numbers',
    title: 'Numerar Páginas',
    description: 'Inserta números de página correlativos con estilos personalizados (Página X de Y, etc.) y márgenes.',
    icon: Binary,
    color: 'from-indigo-500 to-violet-600',
    category: 'edit'
  },
  {
    id: 'protect',
    title: 'Proteger con Contraseña',
    description: 'Cifra tus documentos PDF con contraseña fuerte mediante algoritmo AES-256 de grado militar.',
    icon: Lock,
    color: 'from-slate-700 to-slate-900',
    badge: 'Seguro',
    category: 'security'
  },
  {
    id: 'sign',
    title: 'Firmar PDF',
    description: 'Dibuja tu firma a mano alzada, escribe tu nombre o sube una imagen y colócala en cualquier página del PDF.',
    icon: PenTool,
    color: 'from-emerald-600 to-teal-600',
    badge: 'Destacado',
    category: 'edit'
  },
  {
    id: 'pdf-to-word',
    title: 'PDF a Word (.docx)',
    description: 'Convierte archivos PDF a documentos Word (.docx) 100% editables conservando títulos, párrafos y páginas.',
    icon: FileText,
    color: 'from-blue-600 to-indigo-700',
    badge: 'Popular',
    category: 'convert'
  },
  {
    id: 'word-to-pdf',
    title: 'Word a PDF (.docx a PDF)',
    description: 'Convierte tus documentos Word (.docx) a archivos PDF nítidos de alta definición con diseño fiel y motor vectorial.',
    icon: FileType,
    color: 'from-sky-600 to-blue-700',
    badge: 'Nuevo',
    category: 'convert'
  },
  {
    id: 'extract-text',
    title: 'Extractor de Texto de PDF',
    description: 'Extrae todo el texto plano de documentos PDF, revisa el conteo de palabras y cópialo o descárgalo en .txt.',
    icon: FileSearch,
    color: 'from-teal-600 to-cyan-700',
    badge: 'Útil',
    category: 'convert'
  }
];

export default function App() {
  const [currentTool, setCurrentTool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dark mode initialization
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dce_dark_mode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dce_dark_mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Filter tools based on search and category
  const filteredTools = TOOLS.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const renderCurrentTool = () => {
    const handleBack = () => setCurrentTool(null);
    switch (currentTool) {
      case 'merge':
        return <MergePdf onBack={handleBack} />;
      case 'split':
        return <SplitPdf onBack={handleBack} />;
      case 'compress':
        return <CompressPdf onBack={handleBack} />;
      case 'organize':
        return <OrganizePdf onBack={handleBack} />;
      case 'pdf-to-img':
        return <PdfToImage onBack={handleBack} />;
      case 'img-to-pdf':
        return <ImageToPdf onBack={handleBack} />;
      case 'rotate':
        return <RotatePdf onBack={handleBack} />;
      case 'watermark':
        return <WatermarkPdf onBack={handleBack} />;
      case 'page-numbers':
        return <PageNumbersPdf onBack={handleBack} />;
      case 'protect':
        return <ProtectPdf onBack={handleBack} />;
      case 'sign':
        return <SignPdf onBack={handleBack} />;
      case 'pdf-to-word':
        return <PdfToWord onBack={handleBack} />;
      case 'word-to-pdf':
        return <WordToPdf onBack={handleBack} />;
      case 'extract-text':
        return <ExtractText onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-rose-500 selection:text-white">
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {currentTool ? (
          <Suspense fallback={
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cargando herramienta...</p>
            </div>
          }>
            {renderCurrentTool()}
          </Suspense>
        ) : (
          <div>
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>La alternativa 100% gratuita, privada y sin límites a iLovePDF</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Todas las herramientas para tus PDF en{' '}
                <span className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
                  un solo lugar
                </span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
                Une, divide, comprime, convierte, firma y edita tus archivos PDF directamente en tu navegador.
                Tus documentos nunca salen de tu dispositivo.
              </p>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                {[
                  { id: 'all', label: 'Todas las herramientas' },
                  { id: 'organize', label: 'Organizar y Unir' },
                  { id: 'convert', label: 'Convertir PDF' },
                  { id: 'edit', label: 'Editar y Firmar' },
                  { id: 'security', label: 'Seguridad' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                      categoryFilter === cat.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tools Grid */}
            {filteredTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredTools.map(tool => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onSelect={(id) => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setCurrentTool(id);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No se encontraron herramientas con la búsqueda "{searchQuery}".
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                  className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Restablecer filtros
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
