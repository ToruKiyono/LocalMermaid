#!/usr/bin/env node
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '../public');
const PORT = Number(process.env.PORT) || 4173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
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

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const origin = req.headers.origin || `http://${req.headers.host}`;

  if (requestUrl.pathname === '/proxy') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method Not Allowed' });
      return;
    }

    readJsonBody(req)
      .then(async (body) => {
        const endpoint = body?.endpoint;
        const payload = body?.payload;
        const apiKey = body?.apiKey;
        if (!endpoint || !payload) {
          sendJson(res, 400, { error: 'Missing endpoint or payload' });
          return;
        }
        if (!/^https?:\/\//i.test(endpoint)) {
          sendJson(res, 400, { error: 'Invalid endpoint' });
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
        res.writeHead(proxyResponse.status, { 'Content-Type': contentType });
        res.end(responseText);
      })
      .catch((error) => {
        sendJson(res, 500, { error: error.message });
      });
    return;
  }

  let relativePath = decodeURIComponent(requestUrl.pathname);

  if (relativePath.endsWith('/')) {
    relativePath = `${relativePath}index.html`;
  }

  // `path.join` 会在 Windows 下把 `/` 拼接成以反斜杠开头的绝对路径，
  // 因此我们仅移除前导斜杠，确保最终解析结果始终在静态目录内。
  const sanitized = relativePath.replace(/^[/\\]+/, '');
  const filePath = path.resolve(ROOT, sanitized);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (streamErr) => {
      res.writeHead(500);
      res.end(streamErr.message);
    });
  });
});

server.listen(PORT, () => {
  console.log(`本地服务器已启动：http://localhost:${PORT}`);
  console.log(`静态资源目录：${ROOT}`);
});
