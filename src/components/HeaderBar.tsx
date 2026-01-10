import { Button, Switch, Tooltip } from 'antd';
import styles from '../styles/App.module.css';

interface HeaderBarProps {
  onOpenExamples: () => void;
  onOpenAiConfig: () => void;
  onToggleTheme: (checked: boolean) => void;
  theme: 'light' | 'dark';
}

export function HeaderBar({ onOpenExamples, onOpenAiConfig, onToggleTheme, theme }: HeaderBarProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTitle}>
        <h1>LocalMermaid</h1>
        <span className={styles.headerSubtitle}>React + Ant Design 离线 Mermaid 工作台</span>
      </div>
      <div className={styles.headerActions}>
        <Tooltip title="打开示例库">
          <Button onClick={onOpenExamples}>示例库</Button>
        </Tooltip>
        <Tooltip title="配置 AI 接口与提示词">
          <Button type="primary" onClick={onOpenAiConfig}>
            AI 配置
          </Button>
        </Tooltip>
        <Tooltip title="切换浅色/深色主题">
          <Switch checkedChildren="深色" unCheckedChildren="浅色" checked={theme === 'dark'} onChange={onToggleTheme} />
        </Tooltip>
      </div>
    </header>
  );
}
