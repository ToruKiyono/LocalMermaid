import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeSvgString } from '../utils/svg';

export interface MermaidPackage {
  id: string;
  label: string;
  version: string;
  scriptPath: string;
  downloadedAt?: string | null;
}

export interface MermaidRegistry {
  defaultVersion?: string | null;
  packages: MermaidPackage[];
}

interface MermaidInstance {
  initialize: (config: Record<string, unknown>) => void;
  parse: (text: string) => Promise<void> | void;
  render: (id: string, text: string) => Promise<{ svg: string }> | { svg: string };
}

interface UseMermaidOptions {
  theme: 'default' | 'dark';
}

export function useMermaid({ theme }: UseMermaidOptions) {
  const [registry, setRegistry] = useState<MermaidRegistry>({ packages: [] });
  const [activePackageId, setActivePackageId] = useState<string | null>(null);
  const [activePackage, setActivePackage] = useState<MermaidPackage | null>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const mermaidRef = useRef<MermaidInstance | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const renderToken = useRef(0);

  useEffect(() => {
    let mounted = true;
    fetch('/vendor/mermaid-meta.json')
      .then((res) => res.json())
      .then((data: MermaidRegistry) => {
        if (!mounted) return;
        setRegistry(data);
        if (!activePackageId) {
          const defaultId =
            data.defaultVersion && data.packages.find((item) => item.id === data.defaultVersion)
              ? data.defaultVersion
              : data.packages[0]?.id || null;
          setActivePackageId(defaultId);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError('无法加载 Mermaid 版本清单，请检查 public/vendor 目录。');
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activePackageId || registry.packages.length === 0) return;
    const selected = registry.packages.find((item) => item.id === activePackageId) || null;
    setActivePackage(selected);

    if (!selected) return;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/${selected.scriptPath}`.replace('//', '/');
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Mermaid 脚本加载失败'));
        scriptRef.current?.remove();
        scriptRef.current = script;
        document.head.appendChild(script);
      });

    setLoading(true);
    loadScript()
      .then(() => {
        const mermaidInstance = (window as unknown as { mermaid?: MermaidInstance }).mermaid;
        if (!mermaidInstance) {
          throw new Error('Mermaid 未挂载到全局对象');
        }
        mermaidInstance.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme,
          suppressErrorRendering: true,
          fontFamily: 'Inter, "Segoe UI", "PingFang SC", sans-serif'
        });
        mermaidRef.current = mermaidInstance;
        setError('');
      })
      .catch((err: Error) => {
        setError(err.message || 'Mermaid 初始化失败。');
      })
      .finally(() => setLoading(false));
  }, [activePackageId, registry.packages, theme]);

  const render = useCallback(async (code: string) => {
    if (!mermaidRef.current) {
      setError('Mermaid 未初始化完成。');
      return;
    }
    if (!code.trim()) {
      setError('请输入 Mermaid 代码。');
      return;
    }
    const token = ++renderToken.current;
    setLoading(true);
    try {
      await Promise.resolve(mermaidRef.current.parse(code));
      const result = await Promise.resolve(mermaidRef.current.render(`mermaid-${Date.now()}`, code));
      if (token !== renderToken.current) return;
      setSvg(normalizeSvgString(result.svg));
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Mermaid 渲染失败。';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    registry,
    activePackage,
    activePackageId,
    setActivePackageId,
    svg,
    error,
    loading,
    render
  };
}
