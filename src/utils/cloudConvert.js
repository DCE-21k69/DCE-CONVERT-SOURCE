/**
 * Document Conversion Utility for DCE Convert
 * Routes through secure /api/convert endpoint so API keys and external services
 * are completely hidden from the browser and end-users.
 */

export async function convertDocument({
  file,
  fromFormat,
  toFormat,
  onProgress
}) {
  onProgress?.('Preparando documento...');

  try {
    onProgress?.('Subiendo documento...');
    
    // Call secure proxy endpoint (/api/convert)
    const res = await fetch(`/api/convert?to=${toFormat}&from=${fromFormat}&filename=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      body: file
    });

    if (res.ok) {
      onProgress?.('Descargando archivo convertido...');
      return await res.blob();
    }

    // Try parsing error message
    const errorData = await res.json().catch(() => null);
    if (errorData && errorData.error) {
      throw new Error(errorData.error);
    }
    
    throw new Error(`Error en la conversión (Código: ${res.status})`);
  } catch (err) {
    console.error('Error al convertir:', err);
    throw err;
  }
}
