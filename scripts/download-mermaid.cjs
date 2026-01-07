#!/usr/bin/env node
/*
 * 下载最新版本的 mermaid.min.js 到 public/vendor 目录。
 */
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { URL } = require('node:url');
const { getProxyForUrl, createHttpProxyAgent } = require('./lib/proxy');

const DEST_DIR = path.resolve(__dirname, '../public/vendor');
const DEST_FILE = path.join(DEST_DIR, 'mermaid.min.js');
const META_FILE = path.join(DEST_DIR, 'mermaid-meta.json');
const DEFAULT_PACKAGE_ID = 'bundled-primary';
const SCRIPT_PATH = 'vendor/mermaid.min.js';
const VERSION_ENDPOINT = 'https://registry.npmjs.org/mermaid/latest';
const SOURCES = [
  {
    name: 'GitHub Releases',
    buildUrl: (version) => `https://github.com/mermaid-js/mermaid/releases/download/v${version}/mermaid.min.js`
  },
  {
    name: 'jsDelivr CDN',
    buildUrl: (version) => `https://cdn.jsdelivr.net/npm/mermaid@${version}/dist/mermaid.min.js`
  },
  {
    name: 'unpkg CDN',
    buildUrl: (version) => `https://unpkg.com/mermaid@${version}/dist/mermaid.min.js`
  }
];

async function main() {
  try {
    ensureDirectory(DEST_DIR);
    const latest = await fetchJson(VERSION_ENDPOINT);
    if (!latest?.version) {
      throw new Error('无法获取 Mermaid 最新版本号。');
    }

    const version = latest.version;
    const { sourceName, downloadUrl } = await downloadWithFallback(version);
    const meta = normalizeMeta(readExistingMeta());
    const entry = {
      id: DEFAULT_PACKAGE_ID,
      label: `Mermaid v${version}（内置）`,
      version,
      scriptPath: SCRIPT_PATH,
      source: sourceName,
      downloadUrl,
      downloadedAt: new Date().toISOString()
    };
    meta.defaultVersion = entry.id;
    meta.packages = upsertPackage(meta.packages, entry);
    writeMeta(meta);
    console.log(`下载完成，文件已保存到 ${DEST_FILE}（来源：${sourceName}）`);
  } catch (error) {
    console.error('下载失败：', formatError(error));
    if (error?.response?.statusCode) {
      console.error(`HTTP 状态码：${error.response.statusCode}`);
    }
    if (error instanceof AggregateError && error.errors?.length) {
      const nested = error.errors.map((item) => formatError(item)).join('；');
      console.error(`详细错误：${nested}`);
    }
    if (!process.env.HTTPS_PROXY && !process.env.HTTP_PROXY) {
      console.error('如需通过代理访问，请设置 HTTPS_PROXY 或 HTTP_PROXY 环境变量后重试。');
    }
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

async function downloadWithFallback(version) {
  let lastError = null;
  for (const source of SOURCES) {
    const url = source.buildUrl(version);
    console.log(`尝试从 ${source.name} 获取 Mermaid v${version}...`);
    try {
      await downloadFile(url, DEST_FILE);
      return { sourceName: source.name, downloadUrl: url };
    } catch (error) {
      lastError = error;
      console.warn(`${source.name} 下载失败（${formatError(error)}），尝试下一个来源。`);
    }
  }

  throw lastError || new Error('所有下载来源均不可用。');
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const cleanup = (error) => {
      file.close(() => {
        if (fs.existsSync(dest)) {
          try {
            fs.unlinkSync(dest);
          } catch (unlinkError) {
            console.warn(`清理临时文件失败：${unlinkError.message}`);
          }
        }
        reject(error);
      });
    };
    requestStream(url)
      .then((stream) => {
        stream.pipe(file);
        stream.on('error', (err) => {
          cleanup(err);
        });
        file.on('finish', () => {
          file.close(resolve);
        });
        file.on('error', (err) => {
          cleanup(err);
        });
      })
      .catch((error) => {
        cleanup(error);
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
      },
      agent: buildAgent(targetUrl)
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

function buildAgent(targetUrl) {
  const proxyUrl = getProxyForUrl(targetUrl);
  if (!proxyUrl) {
    return undefined;
  }

  const agent = createHttpProxyAgent(proxyUrl);
  if (!agent) {
    console.warn('代理不可用或协议不受支持，改为直接发起请求。');
  }
  return agent;
}

function readExistingMeta() {
  if (!fs.existsSync(META_FILE)) {
    return null;
  }
  try {
    const content = fs.readFileSync(META_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('读取现有 mermaid-meta.json 失败，将覆盖写入新文件。', error);
    return null;
  }
}

function normalizeMeta(raw) {
  if (!raw) {
    return { defaultVersion: DEFAULT_PACKAGE_ID, packages: [] };
  }

  if (Array.isArray(raw.packages)) {
    return {
      defaultVersion: raw.defaultVersion || DEFAULT_PACKAGE_ID,
      packages: raw.packages.map((item, index) => ({
        id: item.id || item.version || `package-${index + 1}`,
        label: item.label || `Mermaid ${item.version || item.id || index + 1}`,
        version: item.version || '',
        scriptPath: item.scriptPath || item.path || SCRIPT_PATH,
        source: item.source || raw.source || 'bundled',
        downloadUrl: item.downloadUrl || raw.downloadUrl || null,
        downloadedAt: item.downloadedAt || raw.downloadedAt || null,
        checksum: item.checksum || null,
        cacheKey: item.cacheKey || null
      }))
    };
  }

  if (raw.version) {
    return {
      defaultVersion: DEFAULT_PACKAGE_ID,
      packages: [
        {
          id: DEFAULT_PACKAGE_ID,
          label: `Mermaid v${raw.version}（内置）`,
          version: raw.version,
          scriptPath: SCRIPT_PATH,
          source: raw.source || 'bundled',
          downloadUrl: raw.downloadUrl || null,
          downloadedAt: raw.downloadedAt || null,
          checksum: raw.checksum || null,
          cacheKey: raw.cacheKey || raw.version || null
        }
      ]
    };
  }

  return { defaultVersion: DEFAULT_PACKAGE_ID, packages: [] };
}

function upsertPackage(list, entry) {
  const packages = Array.isArray(list) ? [...list] : [];
  const index = packages.findIndex((pkg) => pkg.id === entry.id || pkg.scriptPath === entry.scriptPath);
  if (index >= 0) {
    packages[index] = { ...packages[index], ...entry };
  } else {
    packages.push(entry);
  }
  return packages;
}

function writeMeta(meta) {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2), 'utf8');
}

function formatError(error) {
  if (!error) {
    return '未知错误';
  }

  if (error instanceof AggregateError) {
    const base = error.message && error.message !== 'AggregateError' ? error.message : '请求失败';
    if (error.errors?.length) {
      const nested = error.errors.map((item) => formatError(item)).join('；');
      return `${base}（${nested}）`;
    }
    return base;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch (_) {
    return String(error);
  }
}

if (require.main === module) {
  main();
}
