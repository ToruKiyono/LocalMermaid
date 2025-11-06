#!/usr/bin/env node
/*
 * 下载最新版本的 mermaid.min.js 到 public/vendor 目录。
 */
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { URL } = require('node:url');

const DEST_DIR = path.resolve(__dirname, '../public/vendor');
const DEST_FILE = path.join(DEST_DIR, 'mermaid.min.js');
const META_FILE = path.join(DEST_DIR, 'mermaid-meta.json');
const VERSION_ENDPOINT = 'https://registry.npmjs.org/mermaid/latest';

async function main() {
  try {
    ensureDirectory(DEST_DIR);
    const latest = await fetchJson(VERSION_ENDPOINT);
    if (!latest?.version) {
      throw new Error('无法获取 Mermaid 最新版本号。');
    }

    const version = latest.version;
    const downloadUrl = `https://cdn.jsdelivr.net/npm/mermaid@${version}/dist/mermaid.min.js`;
    console.log(`准备下载 Mermaid v${version}...`);
    await downloadFile(downloadUrl, DEST_FILE);
    fs.writeFileSync(
      META_FILE,
      JSON.stringify({ version, downloadedAt: new Date().toISOString(), downloadUrl }, null, 2),
      'utf8'
    );
    console.log(`下载完成，文件已保存到 ${DEST_FILE}`);
  } catch (error) {
    console.error('下载失败：', error.message);
    process.exitCode = 1;
  }
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function fetchJson(url) {
  return request(url).then((buffer) => JSON.parse(buffer.toString('utf8')));
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    requestStream(url)
      .then((stream) => {
        stream.pipe(file);
        stream.on('error', (err) => {
          file.close();
          reject(err);
        });
        file.on('finish', () => {
          file.close(resolve);
        });
        file.on('error', (err) => {
          file.close();
          reject(err);
        });
      })
      .catch((error) => {
        file.close();
        reject(error);
      });
  });
}

function request(url) {
  return requestStream(url).then(
    (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      })
  );
}

function requestStream(targetUrl, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const urlObject = new URL(targetUrl);
    const requestOptions = {
      protocol: urlObject.protocol,
      hostname: urlObject.hostname,
      path: urlObject.pathname + urlObject.search,
      headers: {
        'User-Agent': 'LocalMermaidDownloader/1.0'
      }
    };

    const req = https.request(requestOptions, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        if (redirectCount > 5) {
          reject(new Error('重定向次数过多，终止下载。'));
          req.destroy();
          return;
        }
        const nextUrl = new URL(res.headers.location, targetUrl).toString();
        req.destroy();
        resolve(requestStream(nextUrl, redirectCount + 1));
        return;
      }

      if (status < 200 || status >= 300) {
        reject(new Error(`请求失败：HTTP ${status}`));
        req.destroy();
        return;
      }

      resolve(res);
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

if (require.main === module) {
  main();
}
