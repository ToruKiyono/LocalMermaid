function ensureSvgNamespaces(svgElement: SVGSVGElement) {
  if (!svgElement.getAttribute('xmlns')) {
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  const usesXlink =
    svgElement.hasAttribute('xlink:href') ||
    Boolean(svgElement.querySelector('[xlink\\:href]'));
  if (usesXlink && !svgElement.getAttribute('xmlns:xlink')) {
    svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  }
}

export function normalizeSvgString(svgString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgNode = doc.documentElement;
  if (!svgNode || svgNode.nodeName.toLowerCase() !== 'svg') {
    return svgString;
  }
  const svgElement = document.importNode(svgNode, true) as SVGSVGElement;
  ensureSvgNamespaces(svgElement);
  if (!svgElement.getAttribute('preserveAspectRatio')) {
    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  svgElement.style.display = 'block';
  svgElement.style.maxWidth = '100%';
  svgElement.style.maxHeight = '100%';
  return new XMLSerializer().serializeToString(svgElement);
}

function parseSvgDimensions(svgString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement as SVGSVGElement | null;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg') return null;
  return calculateSvgDimensions(svg);
}

function calculateSvgDimensions(svgElement: SVGSVGElement) {
  let width = Number(svgElement.getAttribute('width'));
  let height = Number(svgElement.getAttribute('height'));
  const widthAttr = svgElement.getAttribute('width');
  const heightAttr = svgElement.getAttribute('height');
  const hasPercentageWidth = Boolean(widthAttr && widthAttr.includes('%'));
  const hasPercentageHeight = Boolean(heightAttr && heightAttr.includes('%'));

  if ((!Number.isFinite(width) || width <= 0 || hasPercentageWidth) && svgElement.viewBox?.baseVal) {
    if (Number.isFinite(svgElement.viewBox.baseVal.width) && svgElement.viewBox.baseVal.width > 0) {
      width = svgElement.viewBox.baseVal.width;
    }
    if (Number.isFinite(svgElement.viewBox.baseVal.height) && svgElement.viewBox.baseVal.height > 0) {
      height = svgElement.viewBox.baseVal.height;
    }
  }

  if ((!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) && svgElement.getBBox) {
    const bbox = svgElement.getBBox();
    if (bbox.width > 0) width = bbox.width;
    if (bbox.height > 0) height = bbox.height;
  }

  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    const rect = svgElement.getBoundingClientRect();
    if (rect.width > 0) width = rect.width;
    if (rect.height > 0) height = rect.height;
  }

  if (!Number.isFinite(width) || width <= 0) width = 800;
  if (!Number.isFinite(height) || height <= 0) height = 600;

  return { width, height };
}

function sanitizeSvgForCanvas(svgString: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.documentElement as SVGSVGElement | null;
  if (!svgElement || svgElement.nodeName.toLowerCase() !== 'svg') {
    return svgString;
  }
  ensureSvgNamespaces(svgElement);
  const styles = svgElement.querySelectorAll('style');
  styles.forEach((node) => {
    node.textContent = node.textContent || '';
  });
  Array.from(svgElement.querySelectorAll('image, use')).forEach((node) => {
    node.setAttribute('href', node.getAttribute('href') || node.getAttribute('xlink:href') || '');
  });
  return new XMLSerializer().serializeToString(svgElement);
}

function buildSvgDataUrl(svgString: string) {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export async function svgToPngBlob(svgString: string): Promise<Blob> {
  const safeSvg = sanitizeSvgForCanvas(svgString);
  const dimensions = parseSvgDimensions(safeSvg);
  const width = dimensions?.width || 800;
  const height = dimensions?.height || 600;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文。');
  }

  const image = new Image();
  image.crossOrigin = 'anonymous';

  const dataUrl = buildSvgDataUrl(safeSvg);

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('SVG 转换失败。'));
    image.src = dataUrl;
  });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG 导出失败。'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}
