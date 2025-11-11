'use strict';

/**
 * 轻量级的代理解析与 HTTP CONNECT 实现，避免依赖外部 NPM 包。
 * 仅支持通过 http:// 代理隧穿到 HTTPS 目标，满足离线/受限网络环境的下载需求。
 */

const net = require('node:net');
const tls = require('node:tls');
const https = require('node:https');
const { URL } = require('node:url');

function getProxyForUrl(urlString) {
  try {
    const url = new URL(urlString);
    const protocol = url.protocol;
    const hostname = url.hostname;
    const port = url.port || (protocol === 'https:' ? '443' : '80');
    if (!hostname) {
      return '';
    }

    const noProxy = process.env.NO_PROXY || process.env.no_proxy;
    if (noProxy && shouldBypassProxy(hostname, port, noProxy)) {
      return '';
    }

    if (protocol === 'http:') {
      return (
        process.env.HTTP_PROXY ||
        process.env.http_proxy ||
        process.env.ALL_PROXY ||
        process.env.all_proxy ||
        ''
      );
    }

    if (protocol === 'https:') {
      return (
        process.env.HTTPS_PROXY ||
        process.env.https_proxy ||
        process.env.HTTP_PROXY ||
        process.env.http_proxy ||
        process.env.ALL_PROXY ||
        process.env.all_proxy ||
        ''
      );
    }

    return '';
  } catch (error) {
    console.warn(`无法解析目标 URL（${urlString}）：${error.message}`);
    return '';
  }
}

function shouldBypassProxy(hostname, port, noProxyValue) {
  if (!noProxyValue) {
    return false;
  }

  const noProxyList = noProxyValue.split(',').map((item) => item.trim()).filter(Boolean);
  if (noProxyList.length === 0) {
    return false;
  }

  const host = hostname.toLowerCase();
  const hostPort = port ? String(port) : '';

  for (const entry of noProxyList) {
    if (entry === '*') {
      return true;
    }

    const [patternHostRaw, patternPortRaw] = entry.split(':');
    const patternHost = (patternHostRaw || '').toLowerCase();
    const patternPort = patternPortRaw ? patternPortRaw.trim() : '';

    if (patternPort && patternPort !== hostPort) {
      continue;
    }

    if (!patternHost) {
      continue;
    }

    if (patternHost === host) {
      return true;
    }

    if (patternHost.startsWith('.')) {
      if (host.endsWith(patternHost)) {
        return true;
      }
      continue;
    }

    if (patternHost.startsWith('*')) {
      const suffix = patternHost.slice(1);
      if (suffix && host.endsWith(suffix)) {
        return true;
      }
      continue;
    }
  }

  return false;
}

function createHttpProxyAgent(proxyUrl) {
  let parsed;
  try {
    parsed = new URL(proxyUrl);
  } catch (error) {
    console.warn(`代理地址无效（${proxyUrl}）：${error.message}`);
    return undefined;
  }

  if (parsed.protocol !== 'http:') {
    console.warn(`仅支持 http:// 代理，当前为 ${parsed.protocol || '未知协议'}，将直接发起请求。`);
    return undefined;
  }

  const proxyAuth = buildProxyAuthorization(parsed);
  const proxyHost = parsed.hostname;
  const proxyPort = Number(parsed.port || 80);

  return new https.Agent({
    keepAlive: true,
    createConnection: (options, callback) => {
      const targetHost = options.host || options.hostname;
      const targetPort = options.port || (options.protocol === 'http:' ? 80 : 443);

      if (!targetHost) {
        callback(new Error('缺少目标主机信息，无法通过代理建立连接。'));
        return;
      }

      const socket = net.connect({ host: proxyHost, port: proxyPort });
      let settled = false;

      const cleanup = (error) => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        callback(error);
      };

      socket.setTimeout(30000, () => {
        cleanup(new Error('连接代理服务器超时。'));
      });

      socket.on('error', (error) => {
        cleanup(error);
      });

      socket.once('connect', () => {
        let hostHeader = targetHost;
        if (!hostHeader.includes(':')) {
          hostHeader = `${hostHeader}:${targetPort}`;
        }

        let connectRequest = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n`;
        connectRequest += `Host: ${hostHeader}\r\n`;
        connectRequest += 'Proxy-Connection: Keep-Alive\r\n';
        if (proxyAuth) {
          connectRequest += `Proxy-Authorization: ${proxyAuth}\r\n`;
        }
        connectRequest += '\r\n';

        socket.write(connectRequest);
      });

      let responseBuffer = '';
      socket.setEncoding('utf8');

      const handleData = (chunk) => {
        responseBuffer += chunk;
        if (!responseBuffer.includes('\r\n\r\n')) {
          return;
        }

        socket.removeListener('data', handleData);
        socket.setEncoding(null);

        const [headerSection] = responseBuffer.split('\r\n\r\n');
        const statusLine = headerSection.split('\r\n')[0] || '';
        const statusMatch = statusLine.match(/^HTTP\/(?:1\.0|1\.1|2)\s+(\d+)/i);
        const statusCode = statusMatch ? Number(statusMatch[1]) : NaN;

        if (Number.isNaN(statusCode) || statusCode !== 200) {
          cleanup(new Error(`代理 CONNECT 返回异常状态：${statusLine || '未知'}`));
          return;
        }

        const secureSocket = tls.connect({
          socket,
          servername: options.servername || targetHost
        });

        secureSocket.once('secureConnect', () => {
          if (settled) {
            secureSocket.destroy();
            return;
          }
          settled = true;
          secureSocket.setTimeout(0);
          callback(null, secureSocket);
        });

        secureSocket.once('error', (error) => {
          cleanup(error);
        });
      };

      socket.on('data', handleData);
    }
  });
}

function buildProxyAuthorization(urlObject) {
  if (!urlObject.username && !urlObject.password) {
    return '';
  }

  const username = decodeURIComponent(urlObject.username || '');
  const password = decodeURIComponent(urlObject.password || '');
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

module.exports = {
  getProxyForUrl,
  createHttpProxyAgent
};
