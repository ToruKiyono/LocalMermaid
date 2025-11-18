import { examples } from './examples.js';

const mermaidInput = document.getElementById('mermaidInput');
const renderButton = document.getElementById('renderButton');
const copyButton = document.getElementById('copyButton');
const downloadButton = document.getElementById('downloadButton');
const copyDiagramButton = document.getElementById('copyDiagramButton');
const downloadPngButton = document.getElementById('downloadPngButton');
const preview = document.getElementById('preview');
const previewViewport = document.getElementById('previewViewport');
const errorBox = document.getElementById('errorBox');
const exampleSelect = document.getElementById('exampleSelect');
const examplesGrid = document.getElementById('examplesGrid');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const versionLabel = document.getElementById('versionLabel');
const versionSelect = document.getElementById('versionSelect');
const highlightLayer = document.getElementById('highlightLayer');
const lineNumberGutter = document.getElementById('lineNumberGutter');
const lineCountLabel = document.getElementById('lineCountLabel');
const cursorPositionLabel = document.getElementById('cursorPositionLabel');
const zoomInButton = document.getElementById('zoomInButton');
const zoomOutButton = document.getElementById('zoomOutButton');
const resetViewButton = document.getElementById('resetViewButton');
const zoomDisplay = document.getElementById('zoomDisplay');
const scrollControls = document.getElementById('scrollControls');
const scrollTopButton = document.getElementById('scrollTopButton');
const scrollBottomButton = document.getElementById('scrollBottomButton');

let currentTheme = 'default';
let currentSvg = '';
let messageTimer = null;
let renderToken = 0;
let reportedVersion = '';
let mermaidRegistry = { packages: [] };
let activePackage = null;
let mermaidReady = false;
let currentScriptElement = null;
let loadSequence = 0;
let panX = 0;
let panY = 0;
let scale = 1;
let isPanning = false;
let panPointerId = null;
let lastPanPosition = { x: 0, y: 0 };

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

const STATUS_COLOR_MAP = {
  neutral: 'var(--color-subtle)',
  info: 'rgba(56, 189, 248, 0.9)',
  success: 'rgba(56, 189, 248, 0.9)',
  error: ''
};

const HIGHLIGHT_RULES = [
  { regex: /%%[^\n]*/g, className: 'token-comment', priority: 0 },
  { regex: /"[^"\n]*"|'[^'\n]*'/g, className: 'token-string', priority: 1 },
  {
    regex:
      /\b(sequenceDiagram|classDiagram|stateDiagram-v2|stateDiagram|erDiagram|journey|gantt|gitGraph|mindmap|quadrantChart|timeline|flowchart|flowchart-v2|graph|pie)\b/g,
    className: 'token-keyword',
    priority: 2
  },
  {
    regex:
      /\b(subgraph|end|direction|TB|TD|LR|RL|BT|classDef|style|linkStyle|click|accTitle|accDescr|accDescription|activate|deactivate|alt|opt|loop|par|and|rect|else|note\s+(?:left|right|over))\b/g,
    className: 'token-directive',
    priority: 3
  },
  { regex: /\b\d+(?:\.\d+)?\b/g, className: 'token-number', priority: 4 }
];

const DEFAULT_CONFIG = {
  startOnLoad: false,
  securityLevel: 'strict',
  theme: currentTheme,
  fontFamily: 'Inter, "Segoe UI", "PingFang SC", sans-serif'
};

bootstrap();

async function bootstrap() {
  document.body.dataset.theme = currentTheme;
  if (themeToggle) {
    themeToggle.checked = currentTheme === 'dark';
  }
  updateThemeLabel();

  populateExampleSelect();
  populateExampleGrid();
  bindEvents();
  updateHighlight();
  setInitialExample();

  await loadMermaidRegistry();
  const defaultId = resolveDefaultPackageId();
  if (defaultId) {
    await activateMermaidPackage(defaultId, { silent: true });
  } else {
    setStatusMessage('未找到可用的 Mermaid 离线文件，请检查 vendor 目录。', 'error');
  }

  updateZoomIndicator();
  updateScrollControlsVisibility();
}

function resolveDefaultPackageId() {
  if (!Array.isArray(mermaidRegistry.packages) || mermaidRegistry.packages.length === 0) {
    return null;
  }
  if (mermaidRegistry.defaultVersion) {
    const hit = mermaidRegistry.packages.find((item) => item.id === mermaidRegistry.defaultVersion);
    if (hit) {
      return hit.id;
    }
    const versionHit = mermaidRegistry.packages.find((item) => item.version === mermaidRegistry.defaultVersion);
    if (versionHit) {
      return versionHit.id;
    }
  }
  return mermaidRegistry.packages[0].id;
}

function updateThemeLabel() {
  if (themeLabel) {
    themeLabel.textContent = currentTheme === 'dark' ? '深色主题' : '浅色主题';
  }
}

function setStatusMessage(message = '', tone = 'neutral') {
  if (!errorBox) return;
  errorBox.textContent = message;
  if (!message) {
    errorBox.style.color = '';
    return;
  }
  const color = STATUS_COLOR_MAP[tone] ?? '';
  errorBox.style.color = color;
}

async function loadMermaidRegistry() {
  if (versionSelect) {
    versionSelect.disabled = true;
    versionSelect.innerHTML = '<option>加载中...</option>';
  }

  try {
    const response = await fetch('vendor/mermaid-meta.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const raw = await response.json();
    mermaidRegistry = normalizeRegistry(raw);
  } catch (error) {
    console.warn('读取 mermaid-meta.json 失败，将使用兜底配置。', error);
    mermaidRegistry = fallbackRegistry();
  }

  populateVersionSelect();
}

function normalizeRegistry(raw) {
  if (!raw) {
    return fallbackRegistry();
  }

  if (Array.isArray(raw.packages)) {
    const packages = raw.packages.map((item, index) => ({
      id: item.id || item.version || `package-${index + 1}`,
      label: item.label || `Mermaid ${item.version || item.id || index + 1}`,
      version: item.version || '',
      scriptPath: item.scriptPath || item.path || 'vendor/mermaid.min.js',
      source: item.source || raw.source || 'bundled',
      downloadUrl: item.downloadUrl || raw.downloadUrl,
      downloadedAt: item.downloadedAt || raw.downloadedAt,
      checksum: item.checksum || null,
      cacheKey: item.cacheKey || item.version || null
    }));

    return {
      defaultVersion: raw.defaultVersion || packages[0]?.id || null,
      packages
    };
  }

  if (raw.version) {
    return {
      defaultVersion: 'bundled-primary',
      packages: [
        {
          id: 'bundled-primary',
          label: `Mermaid ${raw.version}（内置）`,
          version: raw.version,
          scriptPath: 'vendor/mermaid.min.js',
          source: raw.source || 'bundled',
          downloadUrl: raw.downloadUrl || null,
          downloadedAt: raw.downloadedAt || null,
          checksum: raw.checksum || null,
          cacheKey: raw.version
        }
      ]
    };
  }

  return fallbackRegistry();
}

function fallbackRegistry() {
  return {
    defaultVersion: 'bundled-fallback',
    packages: [
      {
        id: 'bundled-fallback',
        label: 'Mermaid（默认内置）',
        version: '',
        scriptPath: 'vendor/mermaid.min.js',
        source: 'bundled',
        downloadUrl: null,
        downloadedAt: null,
        checksum: null,
        cacheKey: null
      }
    ]
  };
}

function populateVersionSelect() {
  if (!versionSelect) return;

  versionSelect.innerHTML = '';

  if (!mermaidRegistry.packages.length) {
    const option = document.createElement('option');
    option.textContent = '未找到版本';
    option.value = '';
    versionSelect.appendChild(option);
    versionSelect.disabled = true;
    return;
  }

  mermaidRegistry.packages.forEach((pkg) => {
    const option = document.createElement('option');
    option.value = pkg.id;
    const suffix = pkg.source === 'bundled' ? '（内置）' : '';
    option.textContent = pkg.label || `${pkg.version || pkg.id}${suffix}`;
    versionSelect.appendChild(option);
  });

  const defaultId = resolveDefaultPackageId();
  if (defaultId) {
    versionSelect.value = defaultId;
  }
  versionSelect.disabled = false;
}

async function activateMermaidPackage(packageId, { silent = false } = {}) {
  if (!packageId) return;
  const target = mermaidRegistry.packages.find((item) => item.id === packageId);
  if (!target) {
    if (!silent) {
      setStatusMessage('未找到所选的 Mermaid 版本。', 'error');
    }
    return;
  }

  if (activePackage?.id === target.id && mermaidReady) {
    return;
  }

  const sequence = ++loadSequence;
  mermaidReady = false;
  reportedVersion = '';
  setStatusMessage('正在加载 Mermaid 引擎，请稍候...', 'neutral');

  try {
    await loadMermaidScript(target, sequence);
  } catch (error) {
    console.error('加载 Mermaid 版本失败：', error);
    if (loadSequence === sequence) {
      setStatusMessage(`加载 Mermaid 失败：${error.message || error}`, 'error');
    }
    return;
  }

  if (loadSequence !== sequence) {
    return;
  }

  activePackage = target;
  if (versionSelect) {
    versionSelect.value = target.id;
  }
  initializeMermaid();
  renderDiagram();
  updateVersionLabel();
}

function loadMermaidScript(pkg, sequence) {
  return new Promise((resolve, reject) => {
    if (!pkg.scriptPath) {
      reject(new Error('缺少 Mermaid 文件路径。'));
      return;
    }

    if (currentScriptElement) {
      currentScriptElement.remove();
      currentScriptElement = null;
    }

    window.mermaid = undefined;

    const script = document.createElement('script');
    const cacheKey = pkg.cacheKey || pkg.version || Date.now().toString();
    const separator = pkg.scriptPath.includes('?') ? '&' : '?';
    script.src = `${pkg.scriptPath}${cacheKey ? `${separator}v=${encodeURIComponent(cacheKey)}` : ''}`;
    script.onload = () => {
      if (loadSequence !== sequence) {
        resolve();
        return;
      }
      currentScriptElement = script;
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('无法加载指定的 Mermaid 文件。'));
    };
    document.head.appendChild(script);
  });
}

function initializeMermaid() {
  if (!window.mermaid) {
    setStatusMessage('未能加载 Mermaid 库，请确认离线文件是否存在。', 'error');
    return;
  }

  DEFAULT_CONFIG.theme = currentTheme;
  window.mermaid.initialize({ ...DEFAULT_CONFIG });
  mermaidReady = true;

  try {
    const version = window.mermaid.version ? window.mermaid.version() : window.mermaid.mermaidAPI?.version();
    if (version) {
      reportedVersion = version;
    }
  } catch (err) {
    console.warn('无法读取 Mermaid 版本信息：', err);
  }

  updateVersionLabel();
  setStatusMessage('', 'neutral');
}

function updateVersionLabel() {
  if (!versionLabel) return;

  if (!activePackage) {
    versionLabel.textContent = '版本：未知';
    return;
  }

  const parts = [];
  const resolvedVersion = reportedVersion || activePackage.version || '未知';
  parts.push(`版本：${resolvedVersion}`);

  if (activePackage.source) {
    const sourceMap = {
      bundled: '来源：内置',
      'GitHub Releases': '来源：GitHub Release',
      'jsDelivr CDN': '来源：jsDelivr',
      'unpkg CDN': '来源：unpkg'
    };
    parts.push(sourceMap[activePackage.source] || `来源：${activePackage.source}`);
  }

  if (activePackage.downloadedAt) {
    const date = new Date(activePackage.downloadedAt);
    if (!Number.isNaN(date.getTime())) {
      parts.push(`更新：${date.toISOString().slice(0, 10)}`);
    }
  }

  versionLabel.textContent = parts.join(' · ');
}

function populateExampleSelect() {
  if (!exampleSelect) return;
  exampleSelect.innerHTML = '';
  examples.forEach((example, index) => {
    const option = document.createElement('option');
    option.value = example.id;
    option.textContent = `${index + 1}. ${example.name}`;
    exampleSelect.appendChild(option);
  });
}

function populateExampleGrid() {
  if (!examplesGrid) return;
  examplesGrid.innerHTML = '';
  examples.forEach((example) => {
    const card = document.createElement('article');
    card.className = 'example-card';
    card.innerHTML = `
      <h3>${example.name}</h3>
      <p>${example.description}</p>
      <pre><code>${escapeHtml(example.code)}</code></pre>
      <button type="button" data-example="${example.id}">使用此示例</button>
    `;
    card.querySelector('button').addEventListener('click', () => {
      loadExample(example.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    examplesGrid.appendChild(card);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function loadExample(id) {
  const example = examples.find((item) => item.id === id);
  if (!example) return;
  mermaidInput.value = example.code;
  if (exampleSelect) {
    exampleSelect.value = id;
  }
  updateHighlight();
  renderDiagram();
}

function renderDiagram() {
  if (!window.mermaid || !mermaidReady) {
    if (mermaidInput.value.trim()) {
      setStatusMessage('Mermaid 引擎正在加载，请稍候...', 'neutral');
    }
    return;
  }

  const code = mermaidInput.value.trim();
  if (!code) {
    setStatusMessage('请输入 Mermaid 代码后再渲染。', 'neutral');
    return;
  }

  try {
    window.mermaid.parse(code);
  } catch (parseError) {
    setStatusMessage(parseError.str || parseError.message || '解析失败，请检查语法。', 'error');
    return;
  }

  setStatusMessage('', 'neutral');
  preview.innerHTML = '';
  if (preview.style.width) {
    preview.style.width = '';
  }
  if (preview.style.height) {
    preview.style.height = '';
  }
  currentSvg = '';

  const renderId = `mermaid-${Date.now()}`;
  const token = ++renderToken;
  window.mermaid
    .render(renderId, code)
    .then(({ svg, bindFunctions }) => {
      if (token !== renderToken) {
        return;
      }
      let svgElement;
      try {
        svgElement = buildSvgElement(svg);
      } catch (error) {
        console.error('无法解析渲染结果：', error);
        setStatusMessage('渲染结果解析失败，请重试。', 'error');
        return;
      }
      preview.replaceChildren(svgElement);
      syncPreviewCanvasSize(svgElement);
      currentSvg = new XMLSerializer().serializeToString(svgElement);
      if (typeof bindFunctions === 'function') {
        bindFunctions(preview);
      }
      resetView(true);
    })
    .catch((renderError) => {
      setStatusMessage(renderError.message || '渲染失败，请检查输入内容。', 'error');
    });
}

function ensureSvgNamespaces(svgElement) {
  if (!svgElement) return;

  if (!svgElement.getAttribute('xmlns')) {
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const usesXlink =
    svgElement.hasAttribute('xlink:href') ||
    svgElement.querySelector('[xlink\\:href]');
  if (usesXlink && !svgElement.getAttribute('xmlns:xlink')) {
    svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }
}

function buildSvgElement(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(parseError.textContent || '无法解析生成的 SVG 文本。');
  }

  const svgNode = doc.documentElement;
  if (!svgNode || svgNode.nodeName.toLowerCase() !== 'svg') {
    throw new Error('渲染结果不是有效的 SVG 元素。');
  }

  const svgElement = document.importNode(svgNode, true);
  ensureSvgNamespaces(svgElement);

  if (!svgElement.getAttribute('preserveAspectRatio')) {
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  svgElement.style.display = 'block';
  svgElement.style.maxWidth = '100%';
  svgElement.style.maxHeight = '100%';
  svgElement.style.pointerEvents = 'auto';
  return svgElement;
}

function syncPreviewCanvasSize(svgElement) {
  if (!preview || !svgElement) return;

  const { width, height } = calculateSvgDimensions(svgElement);
  preview.style.width = `${width}px`;
  preview.style.height = `${height}px`;
}

function copyCode() {
  const code = mermaidInput.value;
  if (!code) {
    setStatusMessage('没有可复制的内容。', 'neutral');
    return;
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        showTempMessage('代码已复制到剪贴板');
      })
      .catch(() => {
        setStatusMessage('复制失败，请检查浏览器权限。', 'error');
      });
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = code;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showTempMessage('代码已复制到剪贴板');
    } else {
      throw new Error('复制命令返回失败');
    }
  } catch (err) {
    setStatusMessage('复制失败，请手动复制。', 'error');
  }

  document.body.removeChild(textarea);
}

function downloadSvg() {
  if (!currentSvg) {
    setStatusMessage('请先渲染图表，再导出 SVG 文件。', 'neutral');
    return;
  }

  const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mermaid-diagram-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showTempMessage('SVG 导出成功');
}

async function copyDiagramImage() {
  if (!currentSvg) {
    setStatusMessage('请先渲染图表，再复制图像。', 'neutral');
    return;
  }

  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
    setStatusMessage('当前浏览器不支持复制 PNG，请尝试下载后手动复制。', 'error');
    return;
  }

  try {
    const blob = await svgToPngBlob(currentSvg);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showTempMessage('PNG 图像已复制到剪贴板');
  } catch (err) {
    console.error(err);
    setStatusMessage('复制 PNG 失败，请检查浏览器权限或重试。', 'error');
  }
}

async function downloadPng() {
  if (!currentSvg) {
    setStatusMessage('请先渲染图表，再下载 PNG。', 'neutral');
    return;
  }

  try {
    const blob = await svgToPngBlob(currentSvg);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mermaid-diagram-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showTempMessage('PNG 下载完成');
  } catch (err) {
    console.error(err);
    setStatusMessage('导出 PNG 失败，请重试。', 'error');
  }
}

function showTempMessage(message) {
  if (messageTimer) {
    clearTimeout(messageTimer);
    messageTimer = null;
  }

  setStatusMessage(message, 'success');
  messageTimer = window.setTimeout(() => {
    setStatusMessage('', 'neutral');
    messageTimer = null;
  }, 2400);
}

function scrollPage(direction) {
  const doc = document.documentElement;
  const target = direction === 'top' ? 0 : Math.max(0, doc.scrollHeight - doc.clientHeight);
  window.scrollTo({ top: target, behavior: 'smooth' });
}

function updateScrollControlsVisibility() {
  if (!scrollControls) return;

  const doc = document.documentElement;
  const scrollable = Math.max(0, doc.scrollHeight - doc.clientHeight);
  const shouldShow = scrollable > 180;
  const atTop = window.scrollY <= 48;
  const atBottom = window.scrollY >= scrollable - 48;

  scrollControls.classList.toggle('is-visible', shouldShow && (!atTop || !atBottom));

  if (scrollTopButton) {
    scrollTopButton.disabled = atTop;
    scrollTopButton.setAttribute('aria-disabled', String(atTop));
  }

  if (scrollBottomButton) {
    const disableBottom = atBottom || !shouldShow;
    scrollBottomButton.disabled = disableBottom;
    scrollBottomButton.setAttribute('aria-disabled', String(disableBottom));
  }
}

function bindEvents() {
  if (renderButton) {
    renderButton.addEventListener('click', renderDiagram);
  }
  if (downloadButton) {
    downloadButton.addEventListener('click', downloadSvg);
  }
  if (copyButton) {
    copyButton.addEventListener('click', copyCode);
  }
  if (copyDiagramButton) {
    copyDiagramButton.addEventListener('click', copyDiagramImage);
  }
  if (downloadPngButton) {
    downloadPngButton.addEventListener('click', downloadPng);
  }
  if (zoomInButton) {
    zoomInButton.addEventListener('click', () => zoomBy(1.2));
  }
  if (zoomOutButton) {
    zoomOutButton.addEventListener('click', () => zoomBy(1 / 1.2));
  }
  if (resetViewButton) {
    resetViewButton.addEventListener('click', () => resetView(true));
  }

  if (exampleSelect) {
    exampleSelect.addEventListener('change', (event) => {
      loadExample(event.target.value);
    });
  }

  mermaidInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      renderDiagram();
    }
  });

  mermaidInput.addEventListener('input', updateHighlight);
  mermaidInput.addEventListener('scroll', syncScrollPosition);
  mermaidInput.addEventListener('keyup', updateCursorPosition);
  mermaidInput.addEventListener('click', updateCursorPosition);
  mermaidInput.addEventListener('pointerup', updateCursorPosition);
  mermaidInput.addEventListener('blur', updateCursorPosition);

  document.addEventListener('selectionchange', handleSelectionChange);

  if (themeToggle) {
    themeToggle.addEventListener('change', (event) => {
      const nextTheme = event.target.checked ? 'dark' : 'default';
      applyTheme(nextTheme);
    });
  }

  if (versionSelect) {
    versionSelect.addEventListener('change', (event) => {
      activateMermaidPackage(event.target.value);
    });
  }

  if (previewViewport) {
    previewViewport.addEventListener('pointerdown', onPanStart);
    previewViewport.addEventListener('pointermove', onPanMove);
    previewViewport.addEventListener('pointerup', onPanEnd);
    previewViewport.addEventListener('pointerleave', onPanEnd);
    previewViewport.addEventListener('pointercancel', onPanEnd);
  }

  if (scrollTopButton) {
    scrollTopButton.addEventListener('click', () => scrollPage('top'));
  }

  if (scrollBottomButton) {
    scrollBottomButton.addEventListener('click', () => scrollPage('bottom'));
  }

  window.addEventListener('scroll', updateScrollControlsVisibility, { passive: true });
  window.addEventListener('resize', updateScrollControlsVisibility);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.body.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.checked = theme === 'dark';
  }
  updateThemeLabel();

  if (window.mermaid && mermaidReady) {
    DEFAULT_CONFIG.theme = theme;
    window.mermaid.initialize({ ...DEFAULT_CONFIG });
    renderDiagram();
  }
}

function setInitialExample() {
  if (examples.length === 0) return;
  loadExample(examples[0].id);
}

function buildHighlightedHtml(source) {
  if (!source) {
    return '&nbsp;';
  }

  const matches = [];

  HIGHLIGHT_RULES.forEach((rule) => {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match;
    while ((match = regex.exec(source)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        className: rule.className,
        priority: rule.priority
      });

      if (match.index === regex.lastIndex) {
        regex.lastIndex += 1;
      }
    }
  });

  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return b.end - a.end;
    return a.priority - b.priority;
  });

  const filtered = [];
  let lastEnd = -1;

  matches.forEach((match) => {
    if (match.start >= lastEnd) {
      filtered.push(match);
      lastEnd = match.end;
    }
  });

  let cursor = 0;
  let html = '';

  filtered.forEach((match) => {
    if (cursor < match.start) {
      html += escapeHtml(source.slice(cursor, match.start));
    }
    html += `<span class="${match.className}">${escapeHtml(source.slice(match.start, match.end))}</span>`;
    cursor = match.end;
  });

  if (cursor < source.length) {
    html += escapeHtml(source.slice(cursor));
  }

  return html || '&nbsp;';
}

function updateHighlight() {
  if (!highlightLayer || !mermaidInput) return;
  const value = mermaidInput.value;
  highlightLayer.innerHTML = buildHighlightedHtml(value);
  highlightLayer.style.transform = `translate(${-mermaidInput.scrollLeft}px, ${-mermaidInput.scrollTop}px)`;
  syncOverlayMetrics();
  updateLineDecorations(value);
  updateCursorPosition();
}

function updateLineDecorations(value) {
  if (!lineNumberGutter && !lineCountLabel) return;
  const count = calculateLineCount(value);
  if (lineNumberGutter) {
    const numbers = [];
    for (let index = 1; index <= count; index += 1) {
      numbers.push(`<span>${index}</span>`);
    }
    lineNumberGutter.innerHTML = numbers.join('');
    lineNumberGutter.style.transform = `translateY(${-mermaidInput.scrollTop}px)`;
    syncOverlayMetrics();
  }
  if (lineCountLabel) {
    lineCountLabel.textContent = `行数：${count}`;
  }
}

function calculateLineCount(value) {
  if (!value) return 1;
  let count = value.split('\n').length;
  if (value.endsWith('\n')) {
    count += 1;
  }
  return Math.max(1, count);
}

function calculateCursorPosition() {
  if (!mermaidInput) {
    return { line: 1, column: 1 };
  }
  const caret = mermaidInput.selectionStart ?? 0;
  const value = mermaidInput.value.slice(0, caret);
  const segments = value.split('\n');
  const line = segments.length;
  const column = (segments.pop() || '').length + 1;
  return { line, column };
}

function updateCursorPosition() {
  if (!cursorPositionLabel || !mermaidInput) return;
  const { line, column } = calculateCursorPosition();
  cursorPositionLabel.textContent = `光标：第 ${line} 行，第 ${column} 列`;
}

function handleSelectionChange() {
  if (document.activeElement !== mermaidInput) return;
  updateCursorPosition();
}

function getEditorSurfaceHeight() {
  if (!mermaidInput) return 0;
  return Math.max(mermaidInput.scrollHeight, mermaidInput.clientHeight);
}

function syncOverlayMetrics() {
  const height = getEditorSurfaceHeight();
  if (height <= 0) return;
  if (highlightLayer) {
    highlightLayer.style.minHeight = `${height}px`;
  }
  if (lineNumberGutter) {
    lineNumberGutter.style.height = `${height}px`;
    lineNumberGutter.style.minHeight = `${height}px`;
  }
}

function syncScrollPosition() {
  if (highlightLayer) {
    highlightLayer.style.transform = `translate(${-mermaidInput.scrollLeft}px, ${-mermaidInput.scrollTop}px)`;
  }
  if (lineNumberGutter) {
    lineNumberGutter.style.transform = `translateY(${-mermaidInput.scrollTop}px)`;
  }
  syncOverlayMetrics();
}

function onPanStart(event) {
  if (event.button !== 0) return;
  if (!previewViewport) return;
  isPanning = true;
  panPointerId = event.pointerId;
  lastPanPosition = { x: event.clientX, y: event.clientY };
  previewViewport.classList.add('is-panning');
  previewViewport.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function onPanMove(event) {
  if (!isPanning || event.pointerId !== panPointerId) return;
  if (!previewViewport) return;
  const deltaX = event.clientX - lastPanPosition.x;
  const deltaY = event.clientY - lastPanPosition.y;
  lastPanPosition = { x: event.clientX, y: event.clientY };
  panX += deltaX;
  panY += deltaY;
  applyPanZoom();
  event.preventDefault();
}

function onPanEnd(event) {
  if (!isPanning || event.pointerId !== panPointerId) return;
  if (!previewViewport) return;
  isPanning = false;
  panPointerId = null;
  previewViewport.classList.remove('is-panning');
  if (previewViewport.hasPointerCapture(event.pointerId)) {
    previewViewport.releasePointerCapture(event.pointerId);
  }
  event.preventDefault();
}

function zoomBy(factor) {
  const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
  if (Math.abs(nextScale - scale) < 0.001) {
    return;
  }
  scale = nextScale;
  applyPanZoom();
}

function resetView(immediate = false) {
  panX = 0;
  panY = 0;
  scale = 1;
  applyPanZoom(immediate);
}

function applyPanZoom(immediate = false) {
  if (!preview) return;
  if (immediate) {
    preview.classList.add('no-transition');
  }
  preview.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  updateZoomIndicator();
  if (immediate) {
    requestAnimationFrame(() => {
      preview.classList.remove('no-transition');
    });
  }
}

function updateZoomIndicator() {
  if (!zoomDisplay) return;
  const percentage = Math.round(scale * 100);
  zoomDisplay.textContent = `${percentage}%`;
}

function parseSvgDimensions(svgString) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.documentElement;
    return calculateSvgDimensions(svg);
  } catch (error) {
    console.warn('无法解析 SVG 尺寸，使用默认值。', error);
    return { width: 1024, height: 768 };
  }
}

function calculateSvgDimensions(svgElement) {
  if (!svgElement) {
    return { width: 1024, height: 768 };
  }

  const widthAttr = svgElement.getAttribute('width');
  const heightAttr = svgElement.getAttribute('height');
  let width = parseDimension(widthAttr);
  let height = parseDimension(heightAttr);

  const hasPercentageWidth = typeof widthAttr === 'string' && /%$/.test(widthAttr.trim());
  const hasPercentageHeight = typeof heightAttr === 'string' && /%$/.test(heightAttr.trim());

  if ((!Number.isFinite(width) || width <= 0 || hasPercentageWidth) && svgElement.viewBox?.baseVal) {
    if (Number.isFinite(svgElement.viewBox.baseVal?.width) && svgElement.viewBox.baseVal.width > 0) {
      width = svgElement.viewBox.baseVal.width;
    }
    if (Number.isFinite(svgElement.viewBox.baseVal?.height) && svgElement.viewBox.baseVal.height > 0) {
      height = svgElement.viewBox.baseVal.height;
    }
  }

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    try {
      const bbox = svgElement.getBBox();
      if ((!Number.isFinite(width) || width <= 0) && Number.isFinite(bbox?.width) && bbox.width > 0) {
        width = bbox.width;
      }
      if ((!Number.isFinite(height) || height <= 0) && Number.isFinite(bbox?.height) && bbox.height > 0) {
        height = bbox.height;
      }
    } catch (error) {
      // getBBox 可能在 SVG 未完全挂载时抛出异常，忽略即可
    }
  }

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    const rect = svgElement.getBoundingClientRect();
    if ((!Number.isFinite(width) || width <= 0) && Number.isFinite(rect?.width) && rect.width > 0) {
      width = rect.width;
    }
    if ((!Number.isFinite(height) || height <= 0) && Number.isFinite(rect?.height) && rect.height > 0) {
      height = rect.height;
    }
  }

  if (!Number.isFinite(width) || width <= 0) {
    width = 1024;
  }
  if (!Number.isFinite(height) || height <= 0) {
    height = 768;
  }

  return { width, height };
}

function parseDimension(raw) {
  if (typeof raw !== 'string') {
    return Number.NaN;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return Number.NaN;
  }

  const value = Number.parseFloat(trimmed.replace(/(px|em|rem|vh|vw)$/i, ''));
  return Number.isFinite(value) ? value : Number.NaN;
}

function sanitizeSvgForCanvas(svgString) {
  if (!svgString) {
    return svgString;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error(parseError.textContent || 'Invalid SVG');
    }

    const svgElement = doc.documentElement;
    ensureSvgNamespaces(svgElement);
    const styles = svgElement.querySelectorAll('style');
    styles.forEach((styleEl) => {
      const original = styleEl.textContent || '';
      let cleaned = original.replace(/@import[^;]+;?/gi, '');
      cleaned = cleaned.replace(/url\((['"]?)(https?:)?\/\/[^)]+\)/gi, 'none');
      if (cleaned !== original) {
        styleEl.textContent = cleaned;
      }
    });

    Array.from(svgElement.querySelectorAll('image, use')).forEach((node) => {
      const href = node.getAttribute('href') || node.getAttribute('xlink:href');
      if (href && /^https?:\/\//i.test(href)) {
        node.remove();
      }
    });

    return new XMLSerializer().serializeToString(svgElement);
  } catch (error) {
    console.warn('SVG 清理失败，将使用原始内容。', error);
    return svgString;
  }
}

function buildSvgDataUrl(svgString) {
  if (typeof svgString !== 'string' || !svgString.trim()) {
    throw new Error('缺少可用于导出的 SVG 内容。');
  }

  try {
    const encoded = encodeURIComponent(svgString);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  } catch (error) {
    throw new Error('无法编码 SVG 内容以生成数据 URI。');
  }
}

function svgToPngBlob(svgString) {
  const safeSvg = sanitizeSvgForCanvas(svgString);
  const { width, height } = parseSvgDimensions(safeSvg);
  const scaleFactor = Math.min(3, Math.max(1, 2048 / Math.max(width, height)));

  return new Promise((resolve, reject) => {
    let url;
    try {
      url = buildSvgDataUrl(safeSvg);
    } catch (error) {
      reject(error);
      return;
    }

    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scaleFactor));
      canvas.height = Math.max(1, Math.round(height * scaleFactor));
      const ctx = canvas.getContext('2d');
      const background = getComputedStyle(document.body).getPropertyValue('--color-bg') || '#ffffff';
      ctx.fillStyle = background.trim() || '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const finalize = (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('PNG 导出失败：无法生成图像。'));
        }
      };

      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          finalize(blob);
        }, 'image/png');
        return;
      }

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const byteString = atob(dataUrl.split(',')[1]);
        const buffer = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i += 1) {
          buffer[i] = byteString.charCodeAt(i);
        }
        finalize(new Blob([buffer], { type: 'image/png' }));
      } catch (conversionError) {
        reject(new Error('PNG 导出失败：浏览器不支持必要的 API。'));
      }
    };

    image.onerror = () => {
      reject(new Error('无法加载 SVG 以生成 PNG。'));
    };

    image.src = url;
  });
}
