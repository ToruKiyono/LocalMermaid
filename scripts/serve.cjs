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

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
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
