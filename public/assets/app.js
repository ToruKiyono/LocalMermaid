import { examples } from './examples.js';

const mermaidInput = document.getElementById('mermaidInput');
const renderButton = document.getElementById('renderButton');
const copyButton = document.getElementById('copyButton');
const downloadButton = document.getElementById('downloadButton');
const preview = document.getElementById('preview');
const errorBox = document.getElementById('errorBox');
const exampleSelect = document.getElementById('exampleSelect');
const examplesGrid = document.getElementById('examplesGrid');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const versionLabel = document.getElementById('versionLabel');

let currentTheme = 'default';
let currentSvg = '';
let messageTimer = null;
let renderToken = 0;
let reportedVersion = '';
let mermaidMeta = null;

const DEFAULT_CONFIG = {
  startOnLoad: false,
  securityLevel: 'strict',
  theme: currentTheme,
  fontFamily: 'Inter, "Segoe UI", "PingFang SC", sans-serif'
};

function initializeMermaid() {
  if (!window.mermaid) {
    errorBox.textContent = '未加载 Mermaid 库，请确认已下载 mermaid.min.js 文件。';
    return;
  }

  window.mermaid.initialize(DEFAULT_CONFIG);

  try {
    const version = window.mermaid.version ? window.mermaid.version() : window.mermaid.mermaidAPI?.version();
    if (version) {
      reportedVersion = version;
      updateVersionLabel();
    }
  } catch (err) {
    console.warn('无法读取 Mermaid 版本信息：', err);
  }
}

function updateVersionLabel() {
  const parts = [];
  if (reportedVersion) {
    parts.push(`版本：${reportedVersion}`);
  }
  if (mermaidMeta?.source) {
    const sourceMap = {
      bundled: '来源：内置',
      'GitHub Releases': '来源：GitHub Release',
      'jsDelivr CDN': '来源：jsDelivr',
      'unpkg CDN': '来源：unpkg'
    };
    parts.push(sourceMap[mermaidMeta.source] || `来源：${mermaidMeta.source}`);
  }
  if (mermaidMeta?.downloadedAt) {
    const date = new Date(mermaidMeta.downloadedAt);
    if (!Number.isNaN(date.getTime())) {
      parts.push(`更新：${date.toISOString().slice(0, 10)}`);
    }
  }

  versionLabel.textContent = parts.join(' · ') || '版本：未知';
}

async function loadMermaidMeta() {
  try {
    const response = await fetch('vendor/mermaid-meta.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    mermaidMeta = await response.json();
    updateVersionLabel();
  } catch (error) {
    console.warn('读取 mermaid-meta.json 失败：', error);
  }
}

function populateExampleSelect() {
  examples.forEach((example, index) => {
    const option = document.createElement('option');
    option.value = example.id;
    option.textContent = `${index + 1}. ${example.name}`;
    exampleSelect.appendChild(option);
  });
}

function populateExampleGrid() {
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
  exampleSelect.value = id;
  renderDiagram();
}

function renderDiagram() {
  if (!window.mermaid) {
    return;
  }

  const code = mermaidInput.value.trim();
  errorBox.textContent = '';
  errorBox.style.color = '';
  preview.innerHTML = '';
  currentSvg = '';

  if (!code) {
    errorBox.textContent = '请输入 Mermaid 代码后再渲染。';
    errorBox.style.color = '';
    return;
  }

  try {
    window.mermaid.parse(code);
  } catch (parseError) {
    errorBox.textContent = parseError.str || parseError.message || '解析失败，请检查语法。';
    errorBox.style.color = '';
    return;
  }

  const renderId = `mermaid-${Date.now()}`;
  const token = ++renderToken;
  window.mermaid
    .render(renderId, code)
    .then(({ svg, bindFunctions }) => {
      if (token !== renderToken) {
        return;
      }
      preview.innerHTML = svg;
      currentSvg = svg;
      if (typeof bindFunctions === 'function') {
        bindFunctions(preview);
      }
    })
    .catch((renderError) => {
      errorBox.textContent = renderError.message || '渲染失败，请检查输入内容。';
      errorBox.style.color = '';
    });
}

function copyCode() {
  const code = mermaidInput.value;
  if (!code) {
    errorBox.textContent = '没有可复制的内容。';
    errorBox.style.color = '';
    return;
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        showTempMessage('代码已复制到剪贴板');
      })
      .catch(() => {
        errorBox.textContent = '复制失败，请检查浏览器权限。';
        errorBox.style.color = '';
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
    errorBox.textContent = '复制失败，请手动复制。';
    errorBox.style.color = '';
  }

  document.body.removeChild(textarea);
}

function downloadSvg() {
  if (!currentSvg) {
    errorBox.textContent = '请先渲染图表，再导出 SVG 文件。';
    errorBox.style.color = '';
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

function showTempMessage(message) {
  if (messageTimer) {
    clearTimeout(messageTimer);
    messageTimer = null;
  }

  errorBox.textContent = message;
  errorBox.style.color = 'rgba(56, 189, 248, 0.9)';
  messageTimer = window.setTimeout(() => {
    errorBox.textContent = '';
    errorBox.style.color = '';
    messageTimer = null;
  }, 2400);
}

function bindEvents() {
  renderButton.addEventListener('click', renderDiagram);
  downloadButton.addEventListener('click', downloadSvg);
  copyButton.addEventListener('click', copyCode);

  exampleSelect.addEventListener('change', (event) => {
    loadExample(event.target.value);
  });

  mermaidInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      renderDiagram();
    }
  });

  themeToggle.addEventListener('change', (event) => {
    const nextTheme = event.target.checked ? 'dark' : 'default';
    applyTheme(nextTheme);
  });
}

function applyTheme(theme) {
  currentTheme = theme;
  themeLabel.textContent = theme === 'dark' ? '深色主题' : '浅色主题';
  document.body.dataset.theme = theme;

  if (window.mermaid) {
    DEFAULT_CONFIG.theme = theme;
    window.mermaid.initialize({ ...DEFAULT_CONFIG });
    renderDiagram();
  }
}

function setInitialExample() {
  if (examples.length === 0) return;
  loadExample(examples[0].id);
}

document.body.dataset.theme = currentTheme;
themeToggle.checked = currentTheme === 'dark';
themeLabel.textContent = currentTheme === 'dark' ? '深色主题' : '浅色主题';
initializeMermaid();
loadMermaidMeta();
populateExampleSelect();
populateExampleGrid();
bindEvents();
setInitialExample();

