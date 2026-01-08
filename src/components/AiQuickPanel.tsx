import { Button, Input, Tooltip } from 'antd';
import type { AiStatus } from '../hooks/useAiAssistant';
import styles from '../styles/App.module.css';

interface AiQuickPanelProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  onModify: () => void;
  onTest: () => void;
  status: AiStatus;
  error: string;
  loading: boolean;
}

export function AiQuickPanel({
  prompt,
  onPromptChange,
  onGenerate,
  onModify,
  onTest,
  status,
  error,
  loading
}: AiQuickPanelProps) {
  return (
    <section className={`${styles.panel} ${styles.aiPanel}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>AI 快速输入面板</h2>
        <div className={styles.panelActions}>
          <Tooltip title="测试 AI 接口连通性">
            <Button onClick={onTest} loading={loading}>
              测试 AI 接口
            </Button>
          </Tooltip>
          <Tooltip title="让 AI 修改当前 Mermaid">
            <Button type="primary" onClick={onModify} loading={loading}>
              AI 修改当前图
            </Button>
          </Tooltip>
          <Tooltip title="根据描述生成新图">
            <Button onClick={onGenerate} loading={loading}>
              AI 生成架构图
            </Button>
          </Tooltip>
        </div>
      </div>
      <div className={styles.formColumn}>
        {status.message ? (
          <div className={styles.aiStatusCard}>
            <strong>AI 状态：</strong>
            {status.message}
          </div>
        ) : null}
        {error ? <div className={styles.aiErrorCard}>{error}</div> : null}
        <Input.TextArea
          rows={3}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="例如：把节点改成更简洁的中文描述，并补充数据流..."
        />
        <span className={styles.status}>提示：AI 配置与提示词模板在右上角“AI 配置”中维护。</span>
      </div>
    </section>
  );
}
