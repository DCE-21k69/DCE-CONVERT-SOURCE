# 📄 DCE Convert - Suite Completa de Herramientas PDF

Una alternativa completa, moderna, gratuita y 100% privada a **iLovePDF**. Diseñada para ejecutarse de forma local y lista para desplegarse en **Netlify** en segundos.

---

## 🌟 Características Principales

- **🔒 100% Privado (Client-Side)**: Todos los archivos PDF e imágenes se procesan directamente en el navegador del usuario mediante WebAssembly y JavaScript (`pdf-lib`, `pdf.js`, `docx`, `jszip`). **Ningún archivo se sube a internet ni a servidores externos.**
- **⚡ Sin Límites**: Sin cuotas de archivos por hora, sin marcas de agua de terceros, sin necesidad de registrarse.
- **☁️ Optimizado para Netlify**: Incluye `netlify.toml` preconfigurado y bundle estático optimizado en la carpeta `dist/`.
- **🎨 Diseño Moderno**: Modo Oscuro / Claro automático o manual, interfaz adaptada a móviles, tablets y PC, Drag & Drop (arrastrar y soltar) y previsualizaciones interactivas de miniaturas.

---

## 🛠️ Herramientas Incluidas

1. **Unir PDF**: Combina múltiples archivos PDF en el orden exacto que desees.
2. **Dividir PDF**: Extrae rangos de páginas específicos o separa cada página en su propio PDF en un archivo ZIP.
3. **Comprimir PDF**: Optimiza y reduce el tamaño del PDF con 3 niveles (Extrema, Recomendada, Baja).
4. **Organizar Páginas**: Vista de cuadrícula para reordenar páginas, girarlas individualmente o borrar las innecesarias.
5. **PDF a Imagen (JPG / PNG)**: Convierte páginas a imágenes de alta definición y descarga individual o en ZIP.
6. **Imagen a PDF**: Convierte imágenes JPG, PNG o WebP a PDF con selección de tamaño (A4, Carta), orientación y márgenes.
7. **Rotar PDF**: Rota permanentemente todas las páginas o solo pares/impares en 90°, 180° o 270°.
8. **Marca de Agua**: Estampa textos personalizados (ej. CONFIDENCIAL) con control de color, ángulo, tamaño, opacidad y posición.
9. **Numerar Páginas**: Agrega numeración correlativa ("Página X de Y", etc.) con selección de margen y opción de omitir portada.
10. **Proteger con Contraseña**: Cifra el documento con contraseña mediante el algoritmo estándar AES-256 bits.
11. **Firmar PDF**: Dibuja tu rúbrica con el ratón/táctil, escribe tu nombre o sube una imagen y ubícala interactivamente sobre el documento.
12. **PDF a Word (.docx) & Extractor**: Extrae el texto del PDF y genera un archivo Word (.docx) editable o texto plano (.txt).

---

## 🚀 Cómo Ejecutar Localmente

### Requisitos
- Node.js versión 18 o superior instalada.

### Pasos
1. Abre una terminal en esta carpeta (`DCE CONVERT`).
2. Instala las dependencias (si aún no lo has hecho):
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
4. Abre el enlace mostrado en la consola (por ejemplo: `http://localhost:5173`) en tu navegador web.

---

## 🌐 Cómo Subir la Página a Netlify (Gratis)

Tienes dos métodos muy sencillos:

### Método 1: Netlify Drop (El más fácil - Sin usar Git)

1. En tu terminal ejecuta el comando de compilación:
   ```bash
   npm run build
   ```
   *Esto creará la carpeta optimizada llamada `dist/` en tu proyecto.*
2. Ve a [https://app.netlify.com/drop](https://app.netlify.com/drop) en tu navegador e inicia sesión (o regístrate gratis).
3. **Arrastra la carpeta `dist`** directamente sobre el recuadro que indica *"Drag and drop your site output folder here"*.
4. ¡Listo! En unos 5 a 10 segundos, Netlify te dará una URL pública gratuita (ejemplo: `https://mi-pdf-convert.netlify.app`) con certificado SSL (HTTPS).

### Método 2: Conexión con GitHub / GitLab (Despliegue Automático)

1. Sube este proyecto a tu repositorio de GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - DCE Convert"
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```
2. Inicia sesión en [Netlify](https://app.netlify.com/) y presiona **"Add new site"** → **"Import an existing project"**.
3. Selecciona GitHub y elige tu repositorio.
4. Netlify leerá automáticamente el archivo `netlify.toml` ya incluido en el proyecto:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Haz clic en **"Deploy DCE Convert"**. Cada vez que hagas un cambio y lo subas con `git push`, tu web se actualizará sola.

---

## 📁 Estructura del Proyecto

```
DCE CONVERT/
├── dist/                     # Carpeta lista para producción / Netlify Drop
├── public/
│   └── pdf.worker.min.mjs    # Worker local de PDF.js para renderizado de alto rendimiento
├── src/
│   ├── components/           # Componentes UI (Navbar, Footer, Uploader, Cards, Modal)
│   ├── tools/                # Las 12 herramientas individuales de procesamiento PDF
│   ├── utils/                # Utilidades de renderizado, cifrado y descargas
│   ├── App.jsx               # Enrutador principal y catálogo de herramientas
│   ├── main.jsx              # Punto de entrada de React
│   └── index.css             # Estilos Tailwind CSS v4
├── netlify.toml              # Reglas de redirección SPA y encabezados de seguridad
├── vite.config.js            # Configuración de compilación Vite
└── package.json
```

---

## 🔒 Privacidad y Rendimiento

Al procesar todo en el navegador del usuario mediante APIs nativas de JavaScript y Canvas:
- Los documentos confidenciales de los usuarios nunca tocan servidores de terceros.
- Tu cuenta de Netlify **nunca consumirá límites de ancho de banda pesado ni funciones serverless**, manteniéndose 100% dentro del plan gratuito perpetuo.
