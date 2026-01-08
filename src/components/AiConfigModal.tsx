import { Button, Input, Modal, Select, Switch } from 'antd';
import { useEffect, useState } from 'react';
import type { AiSettings, PromptTemplate } from '../hooks/useAiAssistant';
import styles from '../styles/App.module.css';

interface AiConfigModalProps {
  open: boolean;
  settings: AiSettings;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<AiSettings>) => void;
  onSavePrompt: (prompt: { id?: string; title: string; body: string }) => void;
  onDeletePrompt: (id: string) => void;
  onSelectPrompt: (id: string) => void;
  activePrompt: PromptTemplate | undefined;
}

export function AiConfigModal({
  open,
  settings,
  onClose,
  onUpdateSettings,
  onSavePrompt,
  onDeletePrompt,
  onSelectPrompt,
  activePrompt
}: AiConfigModalProps) {
  const [promptTitle, setPromptTitle] = useState('');
  const [promptBody, setPromptBody] = useState('');

  useEffect(() => {
    if (activePrompt) {
      setPromptTitle(activePrompt.title);
      setPromptBody(activePrompt.body);
    }
  }, [activePrompt]);

  return (
    <Modal title="AI 配置中心" open={open} onCancel={onClose} footer={null} width={920}>
      <div className={styles.formColumn}>
        <div className={styles.formRow}>
          <Input
            value={settings.endpoint}
            onChange={(event) => onUpdateSettings({ endpoint: event.target.value })}
            placeholder="API 地址"
          />
          <Input
            value={settings.model}
            onChange={(event) => onUpdateSettings({ model: event.target.value })}
            placeholder="模型名称"
          />
          <Input.Password
            value={settings.apiKey}
            onChange={(event) => onUpdateSettings({ apiKey: event.target.value })}
            placeholder="API Key"
          />
          <Input
            value={settings.systemPrompt}
            onChange={(event) => onUpdateSettings({ systemPrompt: event.target.value })}
            placeholder="系统提示词（可选）"
          />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formColumn}>
            <span className={styles.status}>使用本地代理转发请求</span>
            <Switch
              checked={settings.useProxy}
              onChange={(checked) => onUpdateSettings({ useProxy: checked })}
            />
          </div>
          <div className={styles.formColumn}>
            <span className={styles.status}>渲染失败时自动修复</span>
            <Switch
              checked={settings.autoFix}
              onChange={(checked) => onUpdateSettings({ autoFix: checked })}
            />
          </div>
          <Input
            value={settings.extraInput}
            onChange={(event) => onUpdateSettings({ extraInput: event.target.value })}
            placeholder="默认补充信息"
          />
        </div>
        <div className={styles.formRow}>
          <Select
            value={settings.lastPromptId || undefined}
            onChange={onSelectPrompt}
            options={settings.prompts.map((item) => ({ label: item.title, value: item.id }))}
            placeholder="选择提示词模板"
          />
          <Input
            value={promptTitle}
            onChange={(event) => setPromptTitle(event.target.value)}
            placeholder="模板标题"
          />
        </div>
        <Input.TextArea
          rows={6}
          value={promptBody}
          onChange={(event) => setPromptBody(event.target.value)}
          placeholder="模板内容"
        />
        <div className={styles.panelActions}>
          <Button type="primary" onClick={() => onSavePrompt({ id: activePrompt?.id, title: promptTitle, body: promptBody })}>
            保存模板
          </Button>
          <Button
            danger
            onClick={() => {
              if (activePrompt?.id) {
                onDeletePrompt(activePrompt.id);
              }
            }}
          >
            删除模板
          </Button>
        </div>
      </div>
    </Modal>
  );
}
