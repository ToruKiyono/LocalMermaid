import { Button, Input, Tooltip } from 'antd';
import styles from '../styles/App.module.css';

interface EditorPanelProps {
  value: string;
  lineCount: number;
  onChange: (value: string) => void;
  onRender: () => void;
  onCopy: () => void;
  onOpenExamples: () => void;
  loading: boolean;
}

export function EditorPanel({
  value,
  lineCount,
  onChange,
  onRender,
  onCopy,
  onOpenExamples,
  loading
}: EditorPanelProps) {
  return (
    <section className={`${styles.panel} ${styles.editorPanel}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Mermaid 编辑器面板</h2>
        <div className={styles.panelActions}>
          <Tooltip title="Ctrl / ⌘ + Enter">
            <Button type="primary" onClick={onRender} loading={loading}>
              渲染
            </Button>
          </Tooltip>
          <Button onClick={onCopy}>复制代码</Button>
          <Button onClick={onOpenExamples}>示例库</Button>
        </div>
      </div>
      <Input.TextArea
        className={styles.textarea}
        rows={16}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="在这里输入 Mermaid 代码..."
      />
      <div className={styles.panelActions}>
        <span className={styles.status}>行数：{lineCount}</span>
        <span className={styles.status}>提示：渲染前会使用 Mermaid.parse 进行校验。</span>
      </div>
    </section>
  );
}
