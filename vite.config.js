import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const DEFAULT_CLOUDCONVERT_KEYS = [
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiY2M2MTI4NzIxNDFmY2QzZDA1OTg2ZGVlMWI3M2QwZDgyYzBkODE2MzVjNDBlNGYwZGFiMzJmMTRmYTdjM2I0YTA5NjRjNTY3ZGViYjZlYmQiLCJpYXQiOjE3ODkwODYyMjkuNDkzODU0LCJuYmYiOjE3ODkwODYyMjkuNDkzODU2LCJleHAiOjQ5NDQ3NTk4MjkuNDg3NTMyLCJzdWIiOiI3NjkyODI3NiIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIl19.BPpaSBZQigxYMbmPL49hqSjJdrsWOIOREvvyWbo8tng1nEpSHuDCrr34rqaAPZh9A9zn4uXPoOMtIU4fb0DpvB9mmNipRPHepgoXobTOFMIars4OUPyZ3pUDvK1UbDumPKV8KfeeAYVMXHkLhr66u_M7jrjTp8JufUTGCz4sf4-rpqseyIHvrfayyyX9nDamlO_nqcxSwINhZzKjtI9YKLATnebNRk-iFhXZaNfH70FTZocNSeq74hOdzl8tDN9mqXEfL86sCBkp_YajZfkec55Oumq2IxAUaRx5JYJTXx3pIl3nAX7HEw5cpLDKkAWNmxdUkv-h-GOmN0jOnUHkCZRr85z4TdC6DMku5FBNwlyXxo4qyfp_wsroH57JkbKOYUFfLqn99oYYFjAqsjWl7EeyBI7N0ErWlQnUY1ms6ymSyxXlOpF14P6poyRi-FSy_DnciZRd_2tClfo_cVgX2_1jOWRNFDZbMA3ayygDs8ENQmbPtb4L3zQfjQkjxSlyW7ciR77Zd75BQWz6S-Q1w5PC-KtgJ2ERQUWAJo2n0c-GgufP15W7wNc4VUEb7VcnBVls6DADuEOzIeARWvqLFrVKSHkTdD-H79nYW1vAz-U70zz-OnzlN4EyAwmKtenh814iuhltjh8WBw3WK-hP_z2-a_WTrVJVnJmfANl6CwI",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZGM5ZjIzOGMzMjViNGVhYmIxNjc0MWNiODM2Yjc4MjZmODYzNjhlYWEwOGIwYjU2MmY4NDM0MWIwNDYwMjQ3ODBlZWRkMzU2Y2FhMjlhNTgiLCJpYXQiOjE3ODkwOTA2ODMuMjQ4OCwibmJmIjoxNzg5MDkwNjgzLjI0ODgwMiwiZXhwIjo0OTQ0NzY0MjgzLjI0MjAyMywic3ViIjoiNzY5Mjg3NjEiLCJzY29wZXMiOlsidXNlci5yZWFkIiwidGFzay5yZWFkIiwidGFzay53cml0ZSJdfQ.hJNz7PrEyI23yTQF-fvPEKBCb_wgWWvls2tfZgkgMhpk_0qpKOIrZShlvK-QcG7YeSK5FDFuNn6jFC6EITCVP3nKtSZDFMXQb_FCUt5WDTtcdT9RuKbEYtolB6vLVZKt9MKLZXr6qRRba4wavRozVkbgHoHPZwi50j7nUd3ay5PLvyvdVf4ZQnk0Lyj--olufiAGBc4V-XyKd3ZhsJaRsStINP0RljYk2_IxPXCfmrJ85MD3fkBLjU_v2JXNwqQNlsnYXjIRgeK5kRY5z_lkOfEpk-bpwd8f-AnGdJ3mtnPNCpLeiB2ckIHFJ0ELvNjPBQTKksnNeaW-521pjHwIp6WdgNirbt6r4U163XvdZH1di2yofGNUta4og_E20DlouNZrjKq3Avtw73MmmxdyZA82RoQ-4iil7F1qYYGfAdWnjNJJaZ4ouIiQhvwOhysgWAviNcu9zqDjgBqNG8wy8Luuv-MKBnoV-QgyVV5qdx_iF_nX6iKfirHZLaJOdEcLScaoIsWdPGFau6MCiyJuqEckHmt3UVML3ZlnLwU-xaubkv6aDWoTJ4_5PziReKRh3ZcOoyGCZZPFrbVKSngNi134utXb9shaj_-BLDOYxnUTw1l7N2SeSPsEJ7U_Aq6typ2AN-dMNrqUcROOvzmwn3RA56GuB0mjayv-UloWT6Q",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiOWE4YTlhYjVjYmI3YzJmMWZkNjkzN2IwYTc4NDM0NjhhNzEwYzc2MDMxZmM0NmZlMjM2MmU3M2NiOWEwZDkxZjQ0ZmZhMGQ3Y2NmNGQ5MjAiLCJpYXQiOjE3ODkwOTA3NzkuNjg3OTk0LCJuYmYiOjE3ODkwOTA3NzkuNjg3OTk2LCJleHAiOjQ5NDQ3NjQzNzkuNjgxNDkzLCJzdWIiOiI3NjkyODc3OSIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIl19.Zj5f3AgePZcxECTLigOyuUDBHL7YaXyUhBVpjQWNPxP5qNEyPtdkrv3X1RDpKAyxKvpkl7FaQDUot2ix8B5GEAfVOsZJmrm06FkksrzLFlfQB2e9Sr8wcywHyqwT_zFTT59ykIO7LVByB1inDfG2LDKI5d9gxgV9GgPBsO8O2g0G4WJ1CwzpoFIe36Xf8qnhuLKmaRezugl2D7xo167GQvg1ob0a_Lq4abDSw_efCz2vHB3qjp3Bc0ggu6Y2mX0o-fxDoR9r_fF0vdHb5M4_8mzztDjyWBhNOhH6OcNQg3twm_O9ygh_AhBXI7n1OYr9TXRuxy6Kps-IXJX0JyLgo_pSEIk2YTyAXgJuCMB8-AjgW5MKBa9N829LtzHxeB8Cx-SiLzc7Co8vnW2ulQYdAQ6oeLA_3hnzrf_HBuwbUFu86NKwKGvcTFlZM17iEeNTnsczahp-hm1BEziLHOWXtC7321_ypkzk4-PKKN9695Utampzggq7eW2CgeHhg6ZzaFhsBMoZubguBobUPaYD3UCGz7wEv827Ar8fBueZ5hXJGYjcL8eaKRRSYD9eyXpQm-8-NDNK0Mr-__d-lHdOi7V5UTc8DcrcVewapP6KatvjVSAEz3DSqB4xr7w7OEVOyWjtSsJmIgx3S9amTavAa1-FTXfvfIFlgy2ita-oWmA"
];

const DEFAULT_CONVERTAPI_SECRET = "WYDaiVKlTvXOvf62LtWPvcsa5Yr1gNca";

function getCloudConvertKeys() {
  const keys = [];
  const main = process.env.CLOUDCONVERT_API_KEYS || process.env.CLOUDCONVERT_API_KEY || process.env.VITE_CLOUDCONVERT_API_KEY;
  if (main) {
    main.split(',').map(s => s.trim()).filter(Boolean).forEach(k => keys.push(k));
  }
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`CLOUDCONVERT_API_KEY_${i}`];
    if (k && k.trim() && !keys.includes(k.trim())) {
      keys.push(k.trim());
    }
  }
  if (keys.length > 0) return keys;
  return DEFAULT_CLOUDCONVERT_KEYS;
}

function getConvertApiSecret() {
  return process.env.CONVERTAPI_SECRET || DEFAULT_CONVERTAPI_SECRET;
}

async function convertWithCloudConvert(apiKey, buffer, filename, toFormat) {
  const jobRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tasks: {
        'import-task': { operation: 'import/upload' },
        'convert-task': { operation: 'convert', input: 'import-task', output_format: toFormat },
        'export-task': { operation: 'export/url', input: 'convert-task' }
      }
    })
  });

  const jobData = await jobRes.json();
  if (!jobRes.ok) {
    const errMsg = jobData.message || (jobData.code ? `Error ${jobData.code}` : `Status ${jobRes.status}`);
    throw new Error(errMsg);
  }

  const uploadTask = jobData.data?.tasks?.find(t => t.name === 'import-task');
  if (!uploadTask || !uploadTask.result || !uploadTask.result.form) {
    throw new Error('No upload form returned by CloudConvert');
  }

  const formData = new FormData();
  for (const [k, v] of Object.entries(uploadTask.result.form.parameters || {})) {
    formData.append(k, v);
  }
  formData.append('file', new Blob([buffer]), filename);

  const uploadRes = await fetch(uploadTask.result.form.url, { method: 'POST', body: formData });
  if (!uploadRes.ok && uploadRes.status !== 200 && uploadRes.status !== 201 && uploadRes.status !== 204) {
    throw new Error(`Upload to CloudConvert failed with status ${uploadRes.status}`);
  }

  for (let i = 0; i < 45; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const pollRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    if (!pollRes.ok) continue;
    const pollData = await pollRes.json();
    if (pollData.data && pollData.data.status === 'finished') {
      const exportTask = pollData.data.tasks.find(t => t.name === 'export-task');
      if (exportTask && exportTask.result && exportTask.result.files && exportTask.result.files[0]) {
        const fileRes = await fetch(exportTask.result.files[0].url);
        if (!fileRes.ok) throw new Error('Failed to download converted file from CloudConvert');
        return Buffer.from(await fileRes.arrayBuffer());
      }
      throw new Error('Export task missing files in CloudConvert');
    } else if (pollData.data && pollData.data.status === 'error') {
      throw new Error('CloudConvert job returned error status');
    }
  }

  throw new Error('CloudConvert polling timed out');
}

async function convertWithConvertApi(secret, buffer, filename, toFormat) {
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  const fromFormat = extMatch ? extMatch[1].toLowerCase() : (toFormat === 'pdf' ? 'docx' : 'pdf');

  const formData = new FormData();
  formData.append('File', new Blob([buffer]), filename);

  const res = await fetch(`https://v2.convertapi.com/convert/${fromFormat}/to/${toFormat}?Secret=${secret}`, {
    method: 'POST',
    body: formData
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || !data.Files || !data.Files[0]) {
    const msg = data?.message || data?.Error || `ConvertAPI error status ${res.status}`;
    throw new Error(msg);
  }

  const fileInfo = data.Files[0];
  if (fileInfo.FileData) {
    return Buffer.from(fileInfo.FileData, 'base64');
  }
  if (fileInfo.Url) {
    const fileRes = await fetch(fileInfo.Url);
    if (!fileRes.ok) throw new Error('Failed to download file from ConvertAPI');
    return Buffer.from(await fileRes.arrayBuffer());
  }

  throw new Error('ConvertAPI did not return file data or URL');
}

async function cascadeConvert(buffer, filename, toFormat) {
  const cloudConvertKeys = getCloudConvertKeys();
  const convertApiSecret = getConvertApiSecret();

  for (let i = 0; i < cloudConvertKeys.length; i++) {
    const key = cloudConvertKeys[i];
    try {
      return await convertWithCloudConvert(key, buffer, filename, toFormat);
    } catch (err) {
      console.warn(`[DCE Convert] CloudConvert account #${i + 1} failed: ${err.message}. Cascading to next available account...`);
    }
  }

  if (convertApiSecret) {
    try {
      console.log('[DCE Convert] Cascading to ConvertAPI backup engine...');
      return await convertWithConvertApi(convertApiSecret, buffer, filename, toFormat);
    } catch (err) {
      console.error(`[DCE Convert] ConvertAPI backup failed: ${err.message}`);
    }
  }

  throw new Error('Todas las cuotas de conversión gratuitas del servidor están agotadas temporalmente. Por favor intenta más tarde.');
}

/**
 * Secure local proxy plugin for /api/convert
 * Automatically cascades through CloudConvert accounts and ConvertAPI backup
 */
const apiConvertPlugin = () => ({
  name: 'api-convert-plugin',
  configureServer(server) {
    server.middlewares.use('/api/convert', async (req, res, next) => {
      if (req.method !== 'POST') return next();

      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const toFormat = url.searchParams.get('to') || 'pdf';
        const filename = url.searchParams.get('filename') || `archivo.${toFormat}`;

        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const convertedBuffer = await cascadeConvert(buffer, filename, toFormat);
        const contentType = toFormat === 'pdf' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.end(convertedBuffer);
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Error interno del servidor' }));
      }
    });
  }
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiConvertPlugin()
  ],
  optimizeDeps: {
    include: ['pdfjs-dist', 'pdf-lib']
  },
  build: {
    target: 'esnext'
  }
});
