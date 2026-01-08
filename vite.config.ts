import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Connect } from 'vite';

async function readJsonBody(req: Connect.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handleProxyRequest(req: Connect.IncomingMessage, res: Connect.ServerResponse) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const endpoint = body?.endpoint;
    const payload = body?.payload;
    const apiKey = body?.apiKey;

    if (!endpoint || !payload) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing endpoint or payload' }));
      return;
    }

    if (!/^https?:\/\//i.test(endpoint)) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid endpoint' }));
      return;
    }

    const proxyResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify(payload)
    });

    const contentType = proxyResponse.headers.get('content-type') || 'application/json; charset=utf-8';
    const responseText = await proxyResponse.text();
    res.statusCode = proxyResponse.status;
    res.setHeader('Content-Type', contentType);
    res.end(responseText);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy error';
    res.statusCode = 500;
    res.end(JSON.stringify({ error: message }));
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'localmermaid-proxy',
      configureServer(server) {
        server.middlewares.use('/proxy', (req, res) => {
          void handleProxyRequest(req, res);
        });
      }
    }
  ]
});
