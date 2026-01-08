import { Button, Select, Tooltip } from 'antd';
import type { MermaidPackage } from '../hooks/useMermaid';
import styles from '../styles/App.module.css';

interface PreviewPanelProps {
  svg: string;
  error: string;
  loading: boolean;
  packages: MermaidPackage[];
  activePackageId: string | null;
  onChangePackage: (value: string) => void;
  onCopySvg: () => void;
  onDownloadSvg: () => void;
  onCopyPng: () => void;
  onDownloadPng: () => void;
  onAutoFix: () => void;
}

export function PreviewPanel({
  svg,
  error,
  loading,
  packages,
  activePackageId,
  onChangePackage,
  onCopySvg,
  onDownloadSvg,
  onCopyPng,
  onDownloadPng,
  onAutoFix
}: PreviewPanelProps) {
  return (
    <section className={`${styles.panel} ${styles.previewPanel}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>渲染结果面板</h2>
        <div className={styles.panelActions}>
          <Tooltip title="切换 Mermaid 版本">
            <Select
              value={activePackageId || undefined}
              placeholder="选择版本"
              onChange={onChangePackage}
              options={packages.map((pkg) => ({ label: pkg.label, value: pkg.id }))}
              style={{ minWidth: 220 }}
            />
          </Tooltip>
          <Tooltip title="AI 修复渲染错误">
            <Button onClick={onAutoFix} disabled={!error}>
              AI 修复
            </Button>
          </Tooltip>
        </div>
      </div>
      <div className={styles.panelActions}>
        <Button onClick={onCopySvg} disabled={!svg}>
          复制 SVG
        </Button>
        <Button onClick={onDownloadSvg} disabled={!svg}>
          下载 SVG
        </Button>
        <Button onClick={onCopyPng} disabled={!svg}>
          复制 PNG
        </Button>
        <Button onClick={onDownloadPng} disabled={!svg}>
          下载 PNG
        </Button>
      </div>
      {error ? <div className={`${styles.status} ${styles.statusError}`}>{error}</div> : null}
      {loading ? <div className={styles.status}>正在渲染 Mermaid...</div> : null}
      <div className={styles.previewContainer}>
        {svg ? <div className={styles.previewSvg} dangerouslySetInnerHTML={{ __html: svg }} /> : <span>暂无渲染内容。</span>}
      </div>
    </section>
  );
}
