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
const openAiButton = document.getElementById('openAiButton');
const closeAiButton = document.getElementById('closeAiButton');
const aiModal = document.getElementById('aiModal');
const aiModalOverlay = document.getElementById('aiModalOverlay');
const aiQuickPrompt = document.getElementById('aiQuickPrompt');
const aiQuickModifyButton = document.getElementById('aiQuickModifyButton');
const aiQuickGenerateButton = document.getElementById('aiQuickGenerateButton');
const aiModifyButton = document.getElementById('aiModifyButton');
const aiArchitectureButton = document.getElementById('aiArchitectureButton');
const aiEndpointInput = document.getElementById('aiEndpoint');
const aiModelInput = document.getElementById('aiModel');
const aiApiKeyInput = document.getElementById('aiApiKey');
const aiSystemPromptInput = document.getElementById('aiSystemPrompt');
const aiProxyToggle = document.getElementById('aiProxyToggle');
const aiAutoFixToggle = document.getElementById('aiAutoFixToggle');
const promptTitleInput = document.getElementById('promptTitle');
const promptBodyInput = document.getElementById('promptBody');
const promptExtraInput = document.getElementById('promptExtra');
const promptSelect = document.getElementById('promptSelect');
const promptApplyButton = document.getElementById('promptApplyButton');
const promptSaveButton = document.getElementById('promptSaveButton');
const promptDeleteButton = document.getElementById('promptDeleteButton');
const aiStatus = document.getElementById('aiStatus');

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
let aiSettings = null;
let isAutoFixing = false;

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const DEFAULT_LINE_HEIGHT = 1.62;

const AI_STORAGE_KEY = 'localmermaid-ai-settings';
const DEFAULT_AI_SETTINGS = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  apiKey: '',
  systemPrompt: '',
  useProxy: false,
  autoFix: false,
  extraInput: '',
  prompts: [
    {
      id: 'prompt-default-architecture',
      title: '默认架构图提示词',
      body:
        '你是 Mermaid 语法专家与系统架构师。\n请严格输出“可直接渲染”的 Mermaid 代码，不要输出任何解释、Markdown 或多余文本。\n要求：\n1) 选择合适的图类型（flowchart / C4 / sequence 等），保证结构清晰。\n2) 中文说明，避免语法错误。\n3) 对齐模块、数据流、依赖关系。\n4) 保证每行 Mermaid 语法完整可用。\n\n请基于以下信息生成架构图：\n- 系统名称\n- 主要模块\n- 数据流向\n- 关键依赖\n- 可选：部署环境、外部系统'
    }
  ],
  lastPromptId: 'prompt-default-architecture'
};

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
  syncEditorTypography();
  updateHighlight();
  setInitialExample();
  initializeAiAssistant();

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
    const message = parseError.str || parseError.message || '解析失败，请检查语法。';
    setStatusMessage(message, 'error');
    handleRenderError(message);
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
      const message = renderError.message || '渲染失败，请检查输入内容。';
      setStatusMessage(message, 'error');
      handleRenderError(message);
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

function updateQuickPromptState() {
  if (!aiQuickPrompt) return;
  const container = aiQuickPrompt.closest('.ai-quick');
  if (!container) return;
  const hasFocus = document.activeElement === aiQuickPrompt;
  container.classList.toggle('is-expanded', hasFocus);
  container.classList.toggle('is-collapsed', !hasFocus);
}

function openAiModal() {
  if (!aiModal) return;
  aiModal.classList.add('is-open');
  aiModal.setAttribute('aria-hidden', 'false');
}

function closeAiModal() {
  if (!aiModal) return;
  aiModal.classList.remove('is-open');
  aiModal.setAttribute('aria-hidden', 'true');
}

function initializeAiAssistant() {
  aiSettings = loadAiSettings();
  applyAiSettingsToForm(aiSettings);
  refreshPromptSelect();
  if (aiSettings.lastPromptId) {
    const stored = aiSettings.prompts.find((item) => item.id === aiSettings.lastPromptId);
    if (stored) {
      applyPromptToEditor(stored);
    }
  }
  updateAiStatus('提示词与配置会保存在浏览器本地。', 'neutral');
}

function loadAiSettings() {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_AI_SETTINGS };
  }
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_AI_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    const storedPrompts = Array.isArray(parsed.prompts) && parsed.prompts.length ? parsed.prompts : null;
    return {
      ...DEFAULT_AI_SETTINGS,
      ...parsed,
      prompts: storedPrompts || DEFAULT_AI_SETTINGS.prompts,
      lastPromptId: parsed.lastPromptId || DEFAULT_AI_SETTINGS.lastPromptId
    };
  } catch (error) {
    console.warn('读取 AI 设置失败，将使用默认值。', error);
    return { ...DEFAULT_AI_SETTINGS };
  }
}

function persistAiSettings() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(aiSettings));
}

function applyAiSettingsToForm(settings) {
  if (aiEndpointInput) aiEndpointInput.value = settings.endpoint || '';
  if (aiModelInput) aiModelInput.value = settings.model || '';
  if (aiApiKeyInput) aiApiKeyInput.value = settings.apiKey || '';
  if (aiSystemPromptInput) aiSystemPromptInput.value = settings.systemPrompt || '';
  if (aiProxyToggle) aiProxyToggle.checked = Boolean(settings.useProxy);
  if (aiAutoFixToggle) aiAutoFixToggle.checked = Boolean(settings.autoFix);
  if (promptExtraInput) promptExtraInput.value = settings.extraInput || '';
}

function refreshPromptSelect() {
  if (!promptSelect) return;
  promptSelect.innerHTML = '';
  if (!aiSettings.prompts.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '暂无模板';
    promptSelect.appendChild(option);
    promptSelect.disabled = true;
    return;
  }
  aiSettings.prompts.forEach((prompt) => {
    const option = document.createElement('option');
    option.value = prompt.id;
    option.textContent = prompt.title || '未命名模板';
    promptSelect.appendChild(option);
  });
  promptSelect.disabled = false;
  if (aiSettings.lastPromptId) {
    promptSelect.value = aiSettings.lastPromptId;
  }
}

function updateAiStatus(message, tone = 'neutral') {
  if (!aiStatus) return;
  aiStatus.textContent = message;
  const colorMap = {
    neutral: 'var(--color-subtle)',
    info: 'var(--color-accent)',
    success: 'var(--color-accent)',
    error: 'var(--color-danger)'
  };
  aiStatus.style.color = colorMap[tone] || '';
}

function handleRenderError(message) {
  if (!aiSettings || !aiSettings.autoFix) return;
  if (isAutoFixing) return;
  if (!aiSettings.endpoint || !aiSettings.model || !aiSettings.apiKey) return;
  if (!mermaidInput || !mermaidInput.value.trim()) return;
  isAutoFixing = true;
  runAiTask('auto-fix', { errorMessage: message });
}

function syncAiSettingsFromForm() {
  if (aiEndpointInput) aiSettings.endpoint = aiEndpointInput.value.trim();
  if (aiModelInput) aiSettings.model = aiModelInput.value.trim();
  if (aiApiKeyInput) aiSettings.apiKey = aiApiKeyInput.value.trim();
  if (aiSystemPromptInput) aiSettings.systemPrompt = aiSystemPromptInput.value.trim();
  if (aiProxyToggle) aiSettings.useProxy = aiProxyToggle.checked;
  if (aiAutoFixToggle) aiSettings.autoFix = aiAutoFixToggle.checked;
  if (promptExtraInput) aiSettings.extraInput = promptExtraInput.value.trim();
  persistAiSettings();
}

function applyPromptToEditor(prompt) {
  if (!prompt) return;
  if (promptTitleInput) promptTitleInput.value = prompt.title || '';
  if (promptBodyInput) promptBodyInput.value = prompt.body || '';
}

function savePromptTemplate() {
  if (!promptTitleInput || !promptBodyInput) return;
  const title = promptTitleInput.value.trim();
  const body = promptBodyInput.value.trim();
  if (!title && !body) {
    updateAiStatus('请输入模板标题或内容后再保存。', 'error');
    return;
  }
  const existingId = promptSelect && promptSelect.value ? promptSelect.value : null;
  const existingIndex = aiSettings.prompts.findIndex((item) => item.id === existingId);
  const payload = {
    id: existingId || `prompt-${Date.now()}`,
    title: title || '未命名模板',
    body
  };
  if (existingIndex >= 0) {
    aiSettings.prompts[existingIndex] = payload;
  } else {
    aiSettings.prompts.push(payload);
  }
  aiSettings.lastPromptId = payload.id;
  persistAiSettings();
  refreshPromptSelect();
  if (promptSelect) {
    promptSelect.value = payload.id;
  }
  updateAiStatus('模板已保存。', 'success');
}

function deletePromptTemplate() {
  if (!promptSelect || promptSelect.disabled || !promptSelect.value) {
    updateAiStatus('请选择需要删除的模板。', 'error');
    return;
  }
  const id = promptSelect.value;
  aiSettings.prompts = aiSettings.prompts.filter((item) => item.id !== id);
  if (aiSettings.lastPromptId === id) {
    aiSettings.lastPromptId = aiSettings.prompts[0]?.id || null;
  }
  persistAiSettings();
  refreshPromptSelect();
  applyPromptToEditor(aiSettings.prompts.find((item) => item.id === aiSettings.lastPromptId));
  updateAiStatus('模板已删除。', 'success');
}

function applySelectedPrompt() {
  if (!promptSelect || promptSelect.disabled || !promptSelect.value) {
    updateAiStatus('请选择可载入的模板。', 'error');
    return;
  }
  const selected = aiSettings.prompts.find((item) => item.id === promptSelect.value);
  if (!selected) return;
  aiSettings.lastPromptId = selected.id;
  persistAiSettings();
  applyPromptToEditor(selected);
  updateAiStatus('模板已载入。', 'info');
}

function buildAiRequestPayload(mode, promptBody, currentCode, extraInput = '', errorMessage = '') {
  const systemParts = [
    '你是资深 Mermaid 架构师与前端工程师。',
    '请只返回 Mermaid 代码，不要包含解释或 Markdown。'
  ];
  if (aiSettings.systemPrompt) {
    systemParts.push(aiSettings.systemPrompt);
  }

  let userPrompt = '';
  if (mode === 'modify') {
    userPrompt = `请根据以下需求修改 Mermaid 代码，并输出完整的新图表：\n需求：${promptBody || '优化图表排版与可读性'}\n\n当前 Mermaid 代码：\n${currentCode}`;
  } else if (mode === 'auto-fix') {
    userPrompt = `请修复以下 Mermaid 渲染错误，并输出完整可用的 Mermaid 代码：\n渲染错误：${errorMessage || '未知错误'}\n\n当前 Mermaid 代码：\n${currentCode}`;
  } else {
    userPrompt = `请根据以下描述生成 Mermaid 架构图，优先使用 flowchart 或 C4 容器图：\n描述：${promptBody}\n\n请确保输出可直接渲染。`;
  }

  if (extraInput) {
    userPrompt += `\n\n补充信息：\n${extraInput}`;
  }

  return {
    model: aiSettings.model,
    messages: [
      { role: 'system', content: systemParts.join('\n') },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2
  };
}

function extractAiContent(payload) {
  if (!payload) return '';
  if (Array.isArray(payload.choices) && payload.choices[0]) {
    return payload.choices[0].message?.content || payload.choices[0].text || '';
  }
  if (payload.output_text) {
    return payload.output_text;
  }
  if (payload.message?.content) {
    return payload.message.content;
  }
  return '';
}

function extractMermaidCode(content) {
  if (!content) return '';
  const match = content.match(/```(?:mermaid)?\s*([\s\S]*?)```/i);
  if (match) {
    return match[1].trim();
  }
  return content.trim();
}

function applyMermaidCode(code) {
  if (!code) return;
  mermaidInput.value = code;
  updateHighlight();
  renderDiagram();
}

async function runAiTask(mode, options = {}) {
  if (!aiEndpointInput || !aiModelInput || !aiApiKeyInput) return;
  syncAiSettingsFromForm();
  const promptBody =
    options.promptOverride !== undefined
      ? String(options.promptOverride).trim()
      : promptBodyInput
        ? promptBodyInput.value.trim()
        : '';
  const extraInput = promptExtraInput ? promptExtraInput.value.trim() : '';
  if (!promptBody && mode !== 'auto-fix') {
    updateAiStatus('请先填写提示词内容。', 'error');
    return;
  }
  if (!aiSettings.endpoint || !aiSettings.model || !aiSettings.apiKey) {
    updateAiStatus('请先补全 API 地址、模型名称和 API Key。', 'error');
    return;
  }
  const currentCode = mermaidInput?.value || '';
  const payload = buildAiRequestPayload(
    mode,
    promptBody,
    currentCode,
    extraInput,
    options.errorMessage || ''
  );
  updateAiStatus('正在请求模型，请稍候...', 'info');

  const isProxy = Boolean(aiSettings.useProxy);
  const requestUrl = isProxy ? '/proxy' : aiSettings.endpoint;
  const requestBody = isProxy
    ? JSON.stringify({ endpoint: aiSettings.endpoint, payload, apiKey: aiSettings.apiKey })
    : JSON.stringify(payload);
  const headers = isProxy
    ? { 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json', Authorization: `Bearer ${aiSettings.apiKey}` };

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: requestBody
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    const data = await response.json();
    const content = extractAiContent(data);
    const mermaidCode = extractMermaidCode(content);
    if (!mermaidCode) {
      updateAiStatus('未能解析出 Mermaid 代码，请检查模型输出。', 'error');
      return;
    }
    applyMermaidCode(mermaidCode);
    updateAiStatus(
      mode === 'modify'
        ? '已更新 Mermaid 代码。'
        : mode === 'auto-fix'
          ? '已自动修复 Mermaid 代码。'
          : '已生成 Mermaid 架构图。',
      'success'
    );
  } catch (error) {
    console.error('AI 请求失败：', error);
    const message = error.message || error;
    const corsHint = String(message).includes('CORS')
      ? '（可能是 CORS 限制，可勾选“通过本地代理请求”）'
      : '';
    updateAiStatus(`AI 请求失败：${message}${corsHint}`, 'error');
  } finally {
    if (mode === 'auto-fix') {
      isAutoFixing = false;
    }
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

  if (openAiButton) {
    openAiButton.addEventListener('click', openAiModal);
  }
  if (closeAiButton) {
    closeAiButton.addEventListener('click', closeAiModal);
  }
  if (aiModalOverlay) {
    aiModalOverlay.addEventListener('click', closeAiModal);
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAiModal();
    }
  });
  if (aiQuickModifyButton) {
    aiQuickModifyButton.addEventListener('click', () => {
      const prompt = aiQuickPrompt ? aiQuickPrompt.value : '';
      runAiTask('modify', { promptOverride: prompt });
    });
  }
  if (aiQuickGenerateButton) {
    aiQuickGenerateButton.addEventListener('click', () => {
      const prompt = aiQuickPrompt ? aiQuickPrompt.value : '';
      runAiTask('architecture', { promptOverride: prompt });
    });
  }
  if (aiQuickPrompt) {
    updateQuickPromptState();
    aiQuickPrompt.addEventListener('focus', updateQuickPromptState);
    aiQuickPrompt.addEventListener('blur', updateQuickPromptState);
  }

  if (aiEndpointInput) {
    aiEndpointInput.addEventListener('change', syncAiSettingsFromForm);
  }
  if (aiModelInput) {
    aiModelInput.addEventListener('change', syncAiSettingsFromForm);
  }
  if (aiApiKeyInput) {
    aiApiKeyInput.addEventListener('change', syncAiSettingsFromForm);
  }
  if (aiSystemPromptInput) {
    aiSystemPromptInput.addEventListener('change', syncAiSettingsFromForm);
  }
  if (aiProxyToggle) {
    aiProxyToggle.addEventListener('change', syncAiSettingsFromForm);
  }
  if (aiAutoFixToggle) {
    aiAutoFixToggle.addEventListener('change', syncAiSettingsFromForm);
  }
  if (promptApplyButton) {
    promptApplyButton.addEventListener('click', applySelectedPrompt);
  }
  if (promptSaveButton) {
    promptSaveButton.addEventListener('click', savePromptTemplate);
  }
  if (promptDeleteButton) {
    promptDeleteButton.addEventListener('click', deletePromptTemplate);
  }
  if (promptSelect) {
    promptSelect.addEventListener('change', () => {
      aiSettings.lastPromptId = promptSelect.value || null;
      persistAiSettings();
    });
  }
  if (promptExtraInput) {
    promptExtraInput.addEventListener('change', syncAiSettingsFromForm);
  }
  if (aiModifyButton) {
    aiModifyButton.addEventListener('click', () => runAiTask('modify'));
  }
  if (aiArchitectureButton) {
    aiArchitectureButton.addEventListener('click', () => runAiTask('architecture'));
  }

  window.addEventListener('scroll', updateScrollControlsVisibility, { passive: true });
  window.addEventListener('resize', () => {
    updateScrollControlsVisibility();
    syncEditorTypography();
  });

  if (document.fonts && typeof document.fonts.addEventListener === 'function') {
    document.fonts.addEventListener('loadingdone', syncEditorTypography);
  }
}

function applyTheme(theme) {
  currentTheme = theme;
  document.body.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.checked = theme === 'dark';
  }
  updateThemeLabel();
  syncEditorTypography();

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

function syncEditorTypography() {
  if (!mermaidInput) return;
  const styles = window.getComputedStyle(mermaidInput);
  const fontSize = styles.fontSize || '';
  const lineHeight = normalizeLineHeight(styles.lineHeight, fontSize);
  const fontFamily = styles.fontFamily || '';
  const letterSpacing = styles.letterSpacing || '';

  if (highlightLayer) {
    highlightLayer.style.fontSize = fontSize;
    highlightLayer.style.lineHeight = lineHeight;
    highlightLayer.style.fontFamily = fontFamily;
    highlightLayer.style.letterSpacing = letterSpacing;
  }

  if (lineNumberGutter) {
    lineNumberGutter.style.fontSize = fontSize;
    lineNumberGutter.style.lineHeight = lineHeight;
  }
}

function normalizeLineHeight(rawLineHeight, fontSize) {
  if (rawLineHeight && rawLineHeight !== 'normal') {
    return rawLineHeight;
  }

  const numericFontSize = parseFloat(fontSize) || 16;
  const ratio = getEditorLineHeightRatio();
  return `${(numericFontSize * ratio).toFixed(3)}px`;
}

function getEditorLineHeightRatio() {
  const root = document.documentElement;
  if (!root) {
    return DEFAULT_LINE_HEIGHT;
  }

  const styles = window.getComputedStyle(root);
  const value = parseFloat(styles.getPropertyValue('--editor-line-height'));
  return Number.isFinite(value) ? value : DEFAULT_LINE_HEIGHT;
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
