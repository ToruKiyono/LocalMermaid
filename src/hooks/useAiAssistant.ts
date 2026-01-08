import { useCallback, useEffect, useMemo, useState } from 'react';

export type AiMode = 'generate' | 'modify' | 'auto-fix' | 'test';

export interface PromptTemplate {
  id: string;
  title: string;
  body: string;
}

export interface AiSettings {
  endpoint: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  useProxy: boolean;
  autoFix: boolean;
  extraInput: string;
  prompts: PromptTemplate[];
  lastPromptId: string | null;
}

export interface AiStatus {
  message: string;
  tone: 'info' | 'success' | 'error' | 'neutral';
}

const AI_STORAGE_KEY = 'localmermaid-ai-settings';

const DEFAULT_AI_SETTINGS: AiSettings = {
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini',
  apiKey: '',
  systemPrompt: '',
  useProxy: false,
  autoFix: false,
  extraInput: '',
  prompts: [
    {
      id: 'prompt-default-architecture',
      title: '默认架构图提示词',
      body:
        '你是 Mermaid 语法专家与系统架构师。\n请严格输出“可直接渲染”的 Mermaid 代码，不要输出任何解释、Markdown 或多余文本。\n要求：\n1) 选择合适的图类型（flowchart / C4 / sequence 等），保证结构清晰。\n2) 中文说明，避免语法错误。\n3) 对齐模块、数据流、依赖关系。\n4) 保证每行 Mermaid 语法完整可用。\n\n请基于以下信息生成架构图：\n- 系统名称\n- 主要模块\n- 数据流向\n- 关键依赖\n- 可选：部署环境、外部系统'
    }
  ],
  lastPromptId: 'prompt-default-architecture'
};

function loadSettings(): AiSettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const raw = window.localStorage.getItem(AI_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    return {
      ...DEFAULT_AI_SETTINGS,
      ...parsed,
      prompts: parsed.prompts?.length ? parsed.prompts : DEFAULT_AI_SETTINGS.prompts,
      lastPromptId: parsed.lastPromptId || DEFAULT_AI_SETTINGS.lastPromptId
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

function saveSettings(settings: AiSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(settings));
}

function buildAiRequestPayload(
  settings: AiSettings,
  mode: AiMode,
  promptBody: string,
  currentCode: string,
  extraInput: string,
  errorMessage: string,
  versionLabelText: string
) {
  const systemParts = [
    '你是资深 Mermaid 架构师与前端工程师。',
    '请只返回 Mermaid 代码，不要包含解释或 Markdown。'
  ];
  if (settings.systemPrompt) {
    systemParts.push(settings.systemPrompt);
  }

  let userPrompt = '';
  if (mode === 'modify') {
    userPrompt = `请根据以下需求修改 Mermaid 代码，并输出完整的新图表：\n需求：${promptBody || '优化图表排版与可读性'}\n\n当前 Mermaid 代码：\n${currentCode}`;
  } else if (mode === 'auto-fix') {
    userPrompt = `请修复以下 Mermaid 渲染错误，并输出完整可用的 Mermaid 代码：\n渲染错误：${errorMessage || '未知错误'}\nMermaid 版本：${versionLabelText || '未知'}\n\n修复要求：\n1) 严格遵守当前 Mermaid 版本支持的语法与关键字。\n2) 检查并补全缺失的 end、括号或块结构，避免缩进/分支错误。\n3) 若当前图类型不被该版本支持，请转换为等价的 flowchart 并保留含义。\n4) 保留原始语义与节点命名，尽量少改动非错误部分。\n\n当前 Mermaid 代码：\n${currentCode}`;
  } else if (mode === 'test') {
    userPrompt = '请返回一个最简单可渲染的 Mermaid 图（例如 graph TD; A-->B）。';
  } else {
    userPrompt = `请根据以下描述生成 Mermaid 架构图，优先使用 flowchart 或 C4 容器图：\n描述：${promptBody}\n\n请确保输出可直接渲染。`;
  }

  if (extraInput) {
    userPrompt += `\n\n补充信息：\n${extraInput}`;
  }

  return {
    model: settings.model,
    messages: [
      { role: 'system', content: systemParts.join('\n') },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.2
  };
}

function extractAiContent(payload: any) {
  if (!payload) return '';
  if (Array.isArray(payload.choices) && payload.choices[0]) {
    return payload.choices[0].message?.content || payload.choices[0].text || '';
  }
  if (payload.output_text) {
    return payload.output_text;
  }
  if (payload.message?.content) {
    return payload.message.content;
  }
  return '';
}

function extractMermaidCode(content: string) {
  if (!content) return '';
  const match = content.match(/```(?:mermaid)?\s*([\s\S]*?)```/i);
  if (match) {
    return match[1].trim();
  }
  return content.trim();
}

function getStatusMessageForMode(mode: AiMode) {
  if (mode === 'modify') return '正在请求 AI 修改 Mermaid，请稍候...';
  if (mode === 'auto-fix') return '正在请求 AI 修复渲染错误，请稍候...';
  if (mode === 'test') return '正在测试 AI 接口可用性...';
  return '正在请求 AI 生成 Mermaid，请稍候...';
}

export function useAiAssistant() {
  const [settings, setSettings] = useState<AiSettings>(() => loadSettings());
  const [status, setStatus] = useState<AiStatus>({ message: '', tone: 'neutral' });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const activePrompt = useMemo(
    () => settings.prompts.find((item) => item.id === settings.lastPromptId) || settings.prompts[0],
    [settings]
  );

  const updateSettings = useCallback((patch: Partial<AiSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const savePrompt = useCallback((payload: { id?: string; title: string; body: string }) => {
    setSettings((prev) => {
      const id = payload.id || `prompt-${Date.now()}`;
      const existingIndex = prev.prompts.findIndex((item) => item.id === id);
      const updatedPrompts = [...prev.prompts];
      const item = { id, title: payload.title || '未命名模板', body: payload.body };
      if (existingIndex >= 0) {
        updatedPrompts[existingIndex] = item;
      } else {
        updatedPrompts.push(item);
      }
      return { ...prev, prompts: updatedPrompts, lastPromptId: id };
    });
    setStatus({ message: '模板已保存。', tone: 'success' });
  }, []);

  const deletePrompt = useCallback((id: string) => {
    setSettings((prev) => {
      const nextPrompts = prev.prompts.filter((item) => item.id !== id);
      const nextLast = prev.lastPromptId === id ? nextPrompts[0]?.id || null : prev.lastPromptId;
      return { ...prev, prompts: nextPrompts, lastPromptId: nextLast };
    });
    setStatus({ message: '模板已删除。', tone: 'success' });
  }, []);

  const selectPrompt = useCallback((id: string) => {
    setSettings((prev) => ({ ...prev, lastPromptId: id }));
    setStatus({ message: '模板已载入。', tone: 'info' });
  }, []);

  const runAiTask = useCallback(
    async (mode: AiMode, options: {
      promptOverride?: string;
      currentCode: string;
      extraInput: string;
      errorMessage?: string;
      versionLabel?: string;
    }) => {
      if (!settings.endpoint || !settings.model || !settings.apiKey) {
        const message = '请先补全 API 地址、模型名称和 API Key。';
        setError(message);
        setStatus({ message, tone: 'error' });
        return null;
      }

      if (!options.promptOverride && mode !== 'auto-fix' && mode !== 'test') {
        const message = '请先填写提示词内容。';
        setError(message);
        setStatus({ message, tone: 'error' });
        return null;
      }

      const payload = buildAiRequestPayload(
        settings,
        mode,
        options.promptOverride || '',
        options.currentCode,
        options.extraInput,
        options.errorMessage || '',
        options.versionLabel || ''
      );

      setLoading(true);
      setError('');
      const statusMessage = getStatusMessageForMode(mode);
      setStatus({ message: statusMessage, tone: 'info' });

      const isProxy = Boolean(settings.useProxy);
      const requestUrl = isProxy ? '/proxy' : settings.endpoint;
      const requestBody = isProxy
        ? JSON.stringify({ endpoint: settings.endpoint, payload, apiKey: settings.apiKey })
        : JSON.stringify(payload);
      const headers = isProxy
        ? { 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json', Authorization: `Bearer ${settings.apiKey}` };

      try {
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers,
          body: requestBody
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }
        const data = await response.json();
        const content = extractAiContent(data);
        const mermaidCode = extractMermaidCode(content);
        if (!mermaidCode) {
          const message = '未能解析出 Mermaid 代码，请检查模型输出。';
          setStatus({ message, tone: 'error' });
          setError(message);
          return null;
        }
        const successMessage =
          mode === 'modify'
            ? '已更新 Mermaid 代码。'
            : mode === 'auto-fix'
              ? '已自动修复 Mermaid 代码。'
              : mode === 'test'
                ? 'AI 接口可用，已返回示例 Mermaid。'
                : '已生成 Mermaid 架构图。';
        setStatus({ message: successMessage, tone: 'success' });
        return mermaidCode;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI 请求失败。';
        setStatus({ message, tone: 'error' });
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [settings]
  );

  return {
    settings,
    updateSettings,
    activePrompt,
    savePrompt,
    deletePrompt,
    selectPrompt,
    status,
    error,
    loading,
    runAiTask
  };
}
