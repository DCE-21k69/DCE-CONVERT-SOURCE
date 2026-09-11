const API_KEY = process.env.CLOUDCONVERT_API_KEY || process.env.VITE_CLOUDCONVERT_API_KEY || "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiY2M2MTI4NzIxNDFmY2QzZDA1OTg2ZGVlMWI3M2QwZDgyYzBkODE2MzVjNDBlNGYwZGFiMzJmMTRmYTdjM2I0YTA5NjRjNTY3ZGViYjZlYmQiLCJpYXQiOjE3ODkwODYyMjkuNDkzODU0LCJuYmYiOjE3ODkwODYyMjkuNDkzODU2LCJleHAiOjQ5NDQ3NTk4MjkuNDg3NTMyLCJzdWIiOiI3NjkyODI3NiIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIl19.BPpaSBZQigxYMbmPL49hqSjJdrsWOIOREvvyWbo8tng1nEpSHuDCrr34rqaAPZh9A9zn4uXPoOMtIU4fb0DpvB9mmNipRPHepgoXobTOFMIars4OUPyZ3pUDvK1UbDumPKV8KfeeAYVMXHkLhr66u_M7jrjTp8JufUTGCz4sf4-rpqseyIHvrfayyyX9nDamlO_nqcxSwINhZzKjtI9YKLATnebNRk-iFhXZaNfH70FTZocNSeq74hOdzl8tDN9mqXEfL86sCBkp_YajZfkec55Oumq2IxAUaRx5JYJTXx3pIl3nAX7HEw5cpLDKkAWNmxdUkv-h-GOmN0jOnUHkCZRr85z4TdC6DMku5FBNwlyXxo4qyfp_wsroH57JkbKOYUFfLqn99oYYFjAqsjWl7EeyBI7N0ErWlQnUY1ms6ymSyxXlOpF14P6poyRi-FSy_DnciZRd_2tClfo_cVgX2_1jOWRNFDZbMA3ayygDs8ENQmbPtb4L3zQfjQkjxSlyW7ciR77Zd75BQWz6S-Q1w5PC-KtgJ2ERQUWAJo2n0c-GgufP15W7wNc4VUEb7VcnBVls6DADuEOzIeARWvqLFrVKSHkTdD-H79nYW1vAz-U70zz-OnzlN4EyAwmKtenh814iuhltjh8WBw3WK-hP_z2-a_WTrVJVnJmfANl6CwI";

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const toFormat = url.searchParams.get('to') || 'pdf';
    const filename = url.searchParams.get('filename') || `archivo.${toFormat}`;

    const arrayBuffer = await req.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return new Response(JSON.stringify({ error: 'Archivo vacío o no recibido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Create Job
    const jobRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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
      if (jobData.message && jobData.message.toLowerCase().includes('email address is not verified')) {
        return new Response(JSON.stringify({ error: 'Tu correo de CloudConvert aún no ha sido verificado. Revisa coladvocesai@gmail.com para activar las conversiones.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: jobData.message || 'Error al iniciar la conversión' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadTask = jobData.data.tasks.find(t => t.name === 'import-task');

    // 2. Upload file
    const formData = new FormData();
    for (const [k, v] of Object.entries(uploadTask.result.form.parameters || {})) {
      formData.append(k, v);
    }
    formData.append('file', new Blob([arrayBuffer]), filename);

    const uploadRes = await fetch(uploadTask.result.form.url, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok && uploadRes.status !== 200 && uploadRes.status !== 201 && uploadRes.status !== 204) {
      return new Response(JSON.stringify({ error: 'Error al procesar el archivo en el servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Poll
    let downloadUrl = null;
    for (let i = 0; i < 45; i++) {
      await new Promise(r => setTimeout(r, 1500));
      const pollRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      if (!pollRes.ok) continue;
      const pollData = await pollRes.json();
      if (pollData.data.status === 'finished') {
        const exportTask = pollData.data.tasks.find(t => t.name === 'export-task');
        downloadUrl = exportTask.result.files[0].url;
        break;
      } else if (pollData.data.status === 'error') {
        return new Response(JSON.stringify({ error: 'Ocurrió un error al convertir el documento' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (!downloadUrl) {
      return new Response(JSON.stringify({ error: 'Tiempo de espera agotado' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Download and return converted file stream
    const fileRes = await fetch(downloadUrl);
    const convertedBuffer = await fileRes.arrayBuffer();

    const contentType = toFormat === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new Response(convertedBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/convert"
};
