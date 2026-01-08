export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export async function copyPngBlob(blob: Blob) {
  const clipboardItem = (window as any).ClipboardItem;
  if (!navigator.clipboard?.write || !clipboardItem) {
    throw new Error('当前浏览器不支持复制图片。');
  }
  await navigator.clipboard.write([new clipboardItem({ 'image/png': blob })]);
}
