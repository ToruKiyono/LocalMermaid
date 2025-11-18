# LocalMermaid

一个可以在完全离线环境下使用的 Mermaid 渲染工作台，内置常用图表示例，支持本地编辑、实时渲染、错误提示与多版本切换。

## 功能特性

- 🚀 **开箱即用**：仓库自带 `public/vendor/mermaid.min.js`（当前为 v11.12.1）与版本清单，完全离线即可渲染。
- 🔁 **多版本切换**：读取 `mermaid-meta.json` 中的版本列表，前端可即时切换 Mermaid 内核并刷新当前图表。
- 🛠️ **编辑体验**：提供语法高亮、行号/行数统计、实时光标行列定位、快捷渲染（Ctrl/⌘ + Enter）、字体同步机制以及更宽广的编辑面板与示例库一键载入。
- 🖱️ **预览增强**：渲染结果面板支持缩放、平移、居中复位，默认将图表顶部居中展示，并可复制 PNG、导出 SVG/PNG。
- ⏫ **快速定位**：浮动按钮支持一键跳转页面顶部/底部，长页面也能迅速回到编辑器或示例区。
- 🔍 **语法校验**：渲染前自动调用 `mermaid.parse`，第一时间暴露语法错误并提示定位。
- 🎨 **示例图库**：涵盖流程、时序、状态、旅程、甘特、类图、ER、Git Graph、饼图、折线/柱状/XY 图、思维导图、时间线、需求图、象限图、C4、桑基图等 16+ 彩色案例，全部通过 v11.12.1 语法校验。

## 本次更新亮点

- ✍️ 修复语法高亮覆盖层与隐藏 textarea 字体参数不一致的问题，鼠标位置、选区与实际编辑的文本重新完全对齐。
- 📏 新增 `syncEditorTypography` + `--editor-font-size` 组合机制，自动读取 textarea 的字体/行高并同步到高亮层与行号栏，长文档滚动时也不会再出现错位。
- 📚 更新 README 的系统架构图、数据流图与调用图，记录字体同步阶段与其对编辑体验的守护逻辑。

## 使用指南

1. **立即可用的离线包**

   > 仓库已经内置 Mermaid v11.12.1 的构建文件与静态资源，无需执行任何安装命令即可直接打开 `public/index.html` 使用。

   ```bash
   npm install
   ```

   > 可选：如需验证 Node.js 与 NPM 是否可用，可运行 `npm install`。项目不再依赖任何第三方包，该命令会瞬间完成且不会访问外网。

  - **需要升级 Mermaid 版本时**：运行 `npm run fetch:mermaid`。脚本会先尝试从 GitHub Release（`https://github.com/mermaid-js/mermaid/releases/download/vX.Y.Z/mermaid.min.js`）下载，若该版本未提供构建产物，则自动回退到 jsDelivr / unpkg CDN，并在 `public/vendor/mermaid-meta.json` 的 `packages` 列表中更新默认条目。
  - **新增或替换本地版本**：可手动下载 `mermaid.min.js` 到 `public/vendor/` 任意子目录，并在 `mermaid-meta.json` 中追加一个条目：

    ```json
    {
      "id": "mermaid-11-1-0",
      "label": "Mermaid v11.1.0（手动导入）",
      "version": "11.1.0",
      "scriptPath": "vendor/mermaid-11.1.0/mermaid.min.js",
      "source": "GitHub Releases",
      "downloadUrl": "https://github.com/mermaid-js/mermaid/releases/download/v11.1.0/mermaid.min.js",
      "downloadedAt": "2025-02-18T09:00:00.000Z"
    }
    ```

    保存后刷新页面即可在「Mermaid 版本」下拉框中看到新选项。

     ```bash
     # GitHub Release（若该版本提供）
     curl -L "https://github.com/mermaid-js/mermaid/releases/download/v11.12.1/mermaid.min.js" -o public/vendor/mermaid.min.js

     # CDN 备选
     curl -L "https://cdn.jsdelivr.net/npm/mermaid@11.12.1/dist/mermaid.min.js" -o public/vendor/mermaid.min.js
     ```

   > 下载脚本会自动读取 `HTTPS_PROXY` / `HTTP_PROXY` 环境变量（目前支持 `http://` 代理）。如需在需要代理的网络中执行，可在运行命令前设置环境变量（例如 `export HTTPS_PROXY="http://127.0.0.1:7890"`）。

2. **启动本地预览服务器（可选）**

   ```bash
   npm run start
   ```

   访问终端输出的地址（默认 `http://localhost:4173` 即可加载主页），或直接使用文件协议打开 `public/index.html`。

3. **开始绘制**

   - 在左侧编辑器输入 Mermaid 代码，点击“渲染”或使用 `Ctrl/⌘ + Enter` 快捷键。
   - 如有语法问题，错误信息会显示在预览区域顶部。
   - 支持语法高亮、行号/行数统计、光标行列提示、一键复制代码、复制 PNG、导出 SVG/PNG、版本切换，以及浅色/深色主题切换。
   - 预览面板内置缩放、平移与重置视图控制，帮助在大图场景下查看细节。

## 内置示例一览

| 图表类型 | 示例名称 |
| --- | --- |
| 🧭 流程类 | 全链路增长实验 |
| 🔁 时序图 | 实时平台回流 |
| 🧱 状态图 | 变更审批流 |
| 🔄 用户旅程 | 体验旅程 |
| 🧬 甘特图 | 迭代规划 |
| 🧩 类图 | 领域建模 |
| 🕸️ ER 图 | 电商模型 |
| 🔗 Git Graph | 版本发布 |
| 🌍 饼图 | 渠道构成 |
| 📈 折线图 | 活跃趋势 |
| 📊 柱状图 | 渠道转化率 |
| 📈 XY 图 | 转化 vs 留存 |
| 🧠 思维导图 | 项目规划 |
| 🗂️ 时间线 | 发布计划 |
| 🔄 Requirement | 需求追踪 |
| 🧭 象限图 | 优先级矩阵 |
| ⚙️ C4 | 系统容器视图 |
| 📊 Sankey | 漏斗流向 |

## 项目结构

```
LocalMermaid/
├── package.json                # NPM 脚本与项目元数据
├── public/
│   ├── assets/
│   │   ├── app.js             # 前端逻辑与渲染控制
│   │   └── styles.css         # 页面样式
│   ├── index.html             # 页面入口
│   └── vendor/                # 存放离线的 mermaid 发行文件
│       ├── mermaid.min.js     # 仓库默认内置的 Mermaid v11.12.1
│       └── mermaid-meta.json  # Mermaid 版本清单（支持多版本切换）
├── scripts/
│   ├── download-mermaid.cjs   # 下载最新 mermaid 的辅助脚本
│   ├── lib/
│   │   └── proxy.js           # 轻量代理解析与 CONNECT 实现
│   └── serve.cjs              # 简易静态服务器（可选）
└── README.md
```

## 系统架构图

```mermaid
graph TD
  User[用户浏览器] -->|打开| Index[index.html]
  Index --> App[assets/app.js]
  App --> VersionManifest[版本清单<br/>vendor/mermaid-meta.json]
  App --> VersionSelect[版本选择器<br/>versionSelect]
  App --> Loader[动态脚本加载器]
  Loader --> Mermaid[Mermaid 渲染引擎]
  App --> HighlightLayer[语法高亮 & 行号<br/>highlightLayer + gutter]
  App --> CursorIndicator[光标行列指示<br/>cursorPositionLabel]
  App --> OverlaySync[滚动/高度同步<br/>syncOverlayMetrics]
  App --> TypographySync[字体同步器<br/>--editor-font-size + syncEditorTypography]
  OverlaySync --> HighlightLayer
  OverlaySync --> Gutter[lineNumberGutter]
  TypographySync --> HighlightLayer
  TypographySync --> Gutter
  TypographySync --> Editor[编辑器 textarea]
  CursorIndicator --> FooterMetrics[底部指标<br/>panel__footer]
  App --> PanZoom[预览布局 & 平移缩放<br/>previewViewport]
  App --> LayoutTuner[工作区调优<br/>updateScrollControlsVisibility]
  App --> Examples[assets/examples.js<br/>示例集]
  Examples --> SyntaxAudit[语法校验（11.12.1）]
  SyntaxAudit --> Gallery[16 类示例<br/>flowchart/xychart/C4...]
  App --> Styles[assets/styles.css]
  LayoutTuner --> Styles
  LayoutTuner --> ScrollControls[快速滚动控制<br/>scrollControls]
  ScrollControls --> SmoothScroll[平滑滚动器<br/>scrollPage]
  Mermaid --> RenderPipeline[渲染流程<br/>mermaid.render]
  RenderPipeline --> SvgBuilder[SVG 构建器<br/>buildSvgElement]
  SvgBuilder --> NamespaceGuard[命名空间补全<br/>ensureSvgNamespaces]
  NamespaceGuard --> PreviewSizer[SVG 尺寸同步<br/>syncPreviewCanvasSize]
  PreviewSizer --> Preview[预览画布<br/>preview]
  PanZoom --> Preview
  SvgBuilder --> CanvasSanitizer[SVG 清理器<br/>sanitizeSvgForCanvas]
  CanvasSanitizer --> NamespaceGuard
  CanvasSanitizer --> DataUriEncoder[数据 URI 编码器<br/>buildSvgDataUrl]
  HighlightLayer --> Editor
  PreviewSizer --> Exporters[导出与复制模块]
  NamespaceGuard --> Exporters
  DataUriEncoder --> Exporters
  Exporters --> Clipboard[Clipboard API]
  Exporters --> FileSave[本地文件保存]
  Scripts[Node.js 脚本] --> Downloader[scripts/download-mermaid.cjs]
  Scripts --> ProxyHelper[scripts/lib/proxy.js]
  Scripts --> DevServer[scripts/serve.cjs]
  Downloader --> VersionManifest
  Downloader --> MermaidBundle[public/vendor/mermaid.min.js]
  DevServer -->|http://localhost:4173| User
```

## 数据流图

```mermaid
flowchart LR
  subgraph 浏览器
    VersionManifest[(mermaid-meta.json)] --> LoaderState[动态加载 Mermaid]
    VersionSelect[版本选择器] --> LoaderState
    LoaderState -->|成功| MermaidReady[Mermaid 初始化]
    LoaderState -->|失败| ErrorBox[错误提示]
    MermaidReady --> Render[mermaid.render]
    EditorInput[编辑器输入] --> Highlight[语法高亮 + 行号]
    EditorInput --> TypographySyncDF[字体同步器]
    TypographySyncDF --> Highlight
    TypographySyncDF --> LineNumbers[lineNumberGutter]
    Highlight --> EditorScroll[滚动同步]
    EditorScroll --> OverlaySizer[高度同步]
    LineNumbers --> OverlaySizer
    EditorInput --> Validate[mermaid.parse 校验]
    Validate -->|成功| Render
    Validate -->|失败| ErrorBox
    Render --> SvgBuilderDF[SVG 构建器]
    SvgBuilderDF --> NamespaceGuardDF[命名空间补全]
    NamespaceGuardDF --> PreviewSizerDF[SVG 尺寸同步]
    PreviewSizerDF --> Preview[SVG 预览画布]
    Preview --> PanZoom[缩放/平移状态]
    PanZoom --> Preview
    NamespaceGuardDF --> SvgExport[导出 SVG]
    SvgBuilderDF --> CanvasSanitizerDF[SVG 清理器]
    CanvasSanitizerDF --> NamespaceGuardDF
    CanvasSanitizerDF --> DataUriEncoderDF[数据 URI 编码]
    DataUriEncoderDF --> PngPipeline[SVG → PNG]
    PreviewSizerDF --> PngPipeline
    Examples[示例库选择] --> ExampleValidator["示例语法校验 (11.12.1)"]
    ExampleValidator --> EditorInput
    Examples --> GalleryBoard[图表示例卡片]
    EditorInput --> CursorTracker[光标位置计算]
    CursorTracker --> FooterStats[底部状态显示]
    OverlaySizer --> FooterStats
    ThemeToggle[主题切换] --> MermaidConfig[Mermaid 配置]
    MermaidConfig --> Render
    PngPipeline --> ClipboardPNG[复制 PNG]
    PngPipeline --> PngDownload[下载 PNG]
    CopyButton[复制代码] --> ClipboardText[剪贴板]
    LayoutMonitor[滚动状态监听<br/>updateScrollControlsVisibility] --> ScrollControlsUI[顶部/底部按钮]
    ScrollControlsUI --> SmoothScrollDF[scrollPage 平滑滚动]
    SmoothScrollDF --> WindowScroll[window.scrollTo]
    WindowScroll --> LayoutMonitor
  end
  Downloader[download-mermaid.cjs] -->|GitHub Release 优先| Github[mermaid.min.js]
  Downloader -->|CDN 回退| CDN[jsDelivr / unpkg]
  Downloader --> ProxyHelper[lib/proxy.js]
  ProxyHelper --> ProxyEnv[HTTPS_PROXY / HTTP_PROXY]
  Github --> MermaidBundle[更新后的 mermaid.min.js]
  CDN --> MermaidBundle
  MermaidBundle --> Downloader
  Downloader --> ManifestUpdate[写入 mermaid-meta.json]
  ManifestUpdate --> VersionManifest
```

## 调用图

```mermaid
graph TD
  bootstrap --> loadRegistry[loadMermaidRegistry]
  bootstrap --> populateSelect[populateExampleSelect]
  bootstrap --> populateGrid[populateExampleGrid]
  bootstrap --> bind[bindEvents]
  bootstrap --> updateHighlight
  bootstrap --> syncTypography[syncEditorTypography]
  bootstrap --> setInitialExample
  loadRegistry --> populateVersionSelect
  bind --> render[renderDiagram]
  bind --> copy[copyCode]
  bind --> download[downloadSvg]
  bind --> copyPng[copyDiagramImage]
  bind --> downloadPng[downloadPng]
  bind --> applyTheme
  bind --> activate[activateMermaidPackage]
  bind --> updateHighlight
  bind --> syncScroll[syncScrollPosition]
  bind --> cursorEvents[handleSelectionChange]
  bind --> resizeHandler[window.resize handler]
  bind --> fontWatcher[document.fonts.loadingdone]
  activate --> loadScript[loadMermaidScript]
  activate --> initialize[initializeMermaid]
  activate --> render
  initialize --> updateVersionLabel
  render --> svgBuilder[buildSvgElement]
  render --> namespaceGuard[ensureSvgNamespaces]
  namespaceGuard --> sizeSync[syncPreviewCanvasSize]
  render --> resetView
  render --> setStatus[setStatusMessage]
  svgBuilder --> domParser[DOMParser.parseFromString]
  svgBuilder --> xmlSerializer[XMLSerializer]
  svgBuilder --> namespaceGuard
  sizeSync --> sizeCalc[calculateSvgDimensions]
  sizeCalc --> parseDim[parseDimension]
  resetView --> applyPanZoom
  zoom[zoomBy] --> applyPanZoom
  applyTheme --> render
  applyTheme --> syncTypography
  updateHighlight --> buildHighlight[buildHighlightedHtml]
  updateHighlight --> updateLines[updateLineDecorations]
  updateHighlight --> overlaySync[syncOverlayMetrics]
  updateHighlight --> cursorUpdate[updateCursorPosition]
  updateLines --> calcLines[calculateLineCount]
  updateLines --> overlaySync
  syncScroll --> overlaySync
  cursorEvents --> cursorUpdate
  cursorUpdate --> cursorCalc[calculateCursorPosition]
  resizeHandler --> syncTypography
  fontWatcher --> syncTypography
  syncTypography --> normalizeLineHeight[normalizeLineHeight]
  normalizeLineHeight --> lineHeightRatio[getEditorLineHeightRatio]
  overlaySync --> surfaceHeight[getEditorSurfaceHeight]
  copyPng --> svgToPng[svgToPngBlob]
  downloadPng --> svgToPng
  svgToPng --> sanitizeSvg[sanitizeSvgForCanvas]
  svgToPng --> dataUriBuilder[buildSvgDataUrl]
  dataUriBuilder --> svgToPng
  sanitizeSvg --> namespaceGuard
  svgToPng --> parseSize[parseSvgDimensions]
  parseSize --> sizeCalc
  showMessage[showTempMessage] --> setStatus
  render --> showMessage
  download --> showMessage
  copy --> showMessage
  copyPng --> showMessage
  downloadPng --> showMessage
  bind --> scrollVisibility[updateScrollControlsVisibility]
  scrollVisibility --> scrollControlsState[滚动按钮状态管理]
  scrollPage --> smoothScrollCall[window.scrollTo]
```

## 用户视角用例

```mermaid
flowchart TD
  User((用户))
  subgraph LocalMermaid[LocalMermaid 工作台]
    UC1[选择预置示例]
    UC2[编辑并渲染 Mermaid 图]
    UC3[查看渲染错误提示]
    UC4[复制当前代码]
    UC5[导出 SVG 文件]
    UC6[切换浅色/深色主题]
    UC7[复制渲染 PNG]
    UC8[下载 PNG 图像]
    UC9[切换 Mermaid 版本]
    UC10[缩放/平移预览图]
    UC11[查看行号与行数]
    UC12[查看光标所在行列]
    UC13[浏览多类型示例]
    UC14[一键跳转顶部/底部]
  end
  User --> UC1
  User --> UC2
  User --> UC3
  User --> UC4
  User --> UC5
  User --> UC6
  User --> UC7
  User --> UC8
  User --> UC9
  User --> UC10
  User --> UC11
  User --> UC12
  User --> UC13
  User --> UC14
```

## 许可证

MIT
