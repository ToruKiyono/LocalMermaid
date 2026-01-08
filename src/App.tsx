import { ConfigProvider, message, theme as antdTheme } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiConfigModal } from './components/AiConfigModal';
import { AiQuickPanel } from './components/AiQuickPanel';
import { EditorPanel } from './components/EditorPanel';
import { ExamplesModal } from './components/ExamplesModal';
import { HeaderBar } from './components/HeaderBar';
import { PreviewPanel } from './components/PreviewPanel';
import { examples } from './data/examples';
import { useAiAssistant } from './hooks/useAiAssistant';
import { useMermaid } from './hooks/useMermaid';
import styles from './styles/App.module.css';
import { copyPngBlob, copyText } from './utils/clipboard';
import { svgToPngBlob } from './utils/svg';

export default function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [aiConfigOpen, setAiConfigOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [mermaidText, setMermaidText] = useState(examples[0].code);
  const latestMermaidText = useRef(mermaidText);

  const {
    registry,
    activePackageId,
    setActivePackageId,
    svg,
    error,
    loading,
    render
  } = useMermaid({ theme: themeMode === 'dark' ? 'dark' : 'default' });

  const {
    settings,
    updateSettings,
    activePrompt,
    savePrompt,
    deletePrompt,
    selectPrompt,
    status,
    error: aiError,
    loading: aiLoading,
    runAiTask
  } = useAiAssistant();

  useEffect(() => {
    document.body.dataset.theme = themeMode;
  }, [themeMode]);

  useEffect(() => {
    latestMermaidText.current = mermaidText;
  }, [mermaidText]);

  useEffect(() => {
    render(latestMermaidText.current);
  }, [activePackageId, render]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        render(mermaidText);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [mermaidText, render]);

  const themeConfig = useMemo(
    () => ({
      algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: '#1677ff'
      }
    }),
    [themeMode]
  );

  const handleRender = useCallback(() => {
    render(mermaidText);
  }, [mermaidText, render]);

  const handleSelectExample = useCallback((example: (typeof examples)[number]) => {
    setMermaidText(example.code);
    setExamplesOpen(false);
    render(example.code);
  }, [render]);

  const handleCopyCode = useCallback(async () => {
    await copyText(mermaidText);
    message.success('已复制 Mermaid 代码。');
  }, [mermaidText]);

  const handleCopySvg = useCallback(async () => {
    if (!svg) {
      message.warning('暂无可复制的 SVG。');
      return;
    }
    await copyText(svg);
    message.success('已复制 SVG 代码。');
  }, [svg]);

  const handleDownloadSvg = useCallback(() => {
    if (!svg) {
      message.warning('暂无可导出的 SVG。');
      return;
    }
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mermaid-diagram-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, [svg]);

  const handleCopyPng = useCallback(async () => {
    if (!svg) {
      message.warning('暂无可复制的 PNG。');
      return;
    }
    try {
      const blob = await svgToPngBlob(svg);
      await copyPngBlob(blob);
      message.success('已复制 PNG。');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PNG 复制失败。';
      message.error(msg);
    }
  }, [svg]);

  const handleDownloadPng = useCallback(async () => {
    if (!svg) {
      message.warning('暂无可导出的 PNG。');
      return;
    }
    try {
      const blob = await svgToPngBlob(svg);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mermaid-diagram-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PNG 导出失败。';
      message.error(msg);
    }
  }, [svg]);

  const handleAiGenerate = useCallback(async () => {
    const result = await runAiTask('generate', {
      promptOverride: quickPrompt,
      currentCode: mermaidText,
      extraInput: settings.extraInput,
      versionLabel: registry.packages.find((item) => item.id === activePackageId)?.version || ''
    });
    if (result) {
      setMermaidText(result);
      render(result);
    }
  }, [activePackageId, mermaidText, quickPrompt, registry.packages, render, runAiTask, settings.extraInput]);

  const handleAiModify = useCallback(async () => {
    const result = await runAiTask('modify', {
      promptOverride: quickPrompt,
      currentCode: mermaidText,
      extraInput: settings.extraInput,
      versionLabel: registry.packages.find((item) => item.id === activePackageId)?.version || ''
    });
    if (result) {
      setMermaidText(result);
      render(result);
    }
  }, [activePackageId, mermaidText, quickPrompt, registry.packages, render, runAiTask, settings.extraInput]);

  const handleAiTest = useCallback(async () => {
    const result = await runAiTask('test', {
      promptOverride: '',
      currentCode: mermaidText,
      extraInput: settings.extraInput,
      versionLabel: registry.packages.find((item) => item.id === activePackageId)?.version || ''
    });
    if (result) {
      setMermaidText(result);
      render(result);
    }
  }, [activePackageId, mermaidText, registry.packages, render, runAiTask, settings.extraInput]);

  const handleAutoFix = useCallback(async () => {
    if (!error) {
      message.warning('当前没有渲染错误。');
      return;
    }
    const result = await runAiTask('auto-fix', {
      promptOverride: '',
      currentCode: mermaidText,
      extraInput: settings.extraInput,
      errorMessage: error,
      versionLabel: registry.packages.find((item) => item.id === activePackageId)?.version || ''
    });
    if (result) {
      setMermaidText(result);
      render(result);
    }
  }, [activePackageId, error, mermaidText, registry.packages, render, runAiTask, settings.extraInput]);

  useEffect(() => {
    if (error && settings.autoFix) {
      void handleAutoFix();
    }
  }, [error, handleAutoFix, settings.autoFix]);

  return (
    <ConfigProvider theme={themeConfig}>
      <div className={styles.app}>
        <HeaderBar
          onOpenExamples={() => setExamplesOpen(true)}
          onOpenAiConfig={() => setAiConfigOpen(true)}
          onToggleTheme={(checked) => setThemeMode(checked ? 'dark' : 'light')}
          theme={themeMode}
        />
        <AiQuickPanel
          prompt={quickPrompt}
          onPromptChange={setQuickPrompt}
          onGenerate={handleAiGenerate}
          onModify={handleAiModify}
          onTest={handleAiTest}
          status={status}
          error={aiError}
          loading={aiLoading}
        />
        <div className={styles.grid}>
          <EditorPanel
            value={mermaidText}
            onChange={setMermaidText}
            onRender={handleRender}
            onCopy={handleCopyCode}
            onOpenExamples={() => setExamplesOpen(true)}
            loading={loading}
          />
          <PreviewPanel
            svg={svg}
            error={error}
            loading={loading}
            packages={registry.packages}
            activePackageId={activePackageId}
            onChangePackage={setActivePackageId}
            onCopySvg={handleCopySvg}
            onDownloadSvg={handleDownloadSvg}
            onCopyPng={handleCopyPng}
            onDownloadPng={handleDownloadPng}
            onAutoFix={handleAutoFix}
          />
        </div>
        <ExamplesModal
          open={examplesOpen}
          examples={examples}
          onSelect={handleSelectExample}
          onClose={() => setExamplesOpen(false)}
        />
        <AiConfigModal
          open={aiConfigOpen}
          onClose={() => setAiConfigOpen(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
          onSavePrompt={savePrompt}
          onDeletePrompt={deletePrompt}
          onSelectPrompt={selectPrompt}
          activePrompt={activePrompt}
        />
      </div>
    </ConfigProvider>
  );
}
