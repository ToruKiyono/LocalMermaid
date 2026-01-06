export const examples = [
  {
    id: 'flowchart-growth',
    name: '🧭 流程图：全链路增长实验',
    description: '覆盖拉新、激活与转化的彩色流程图，展示不同路径的策略。',
    code: `%%{init: {'theme': 'forest', 'themeVariables': { 'primaryColor': '#38bdf8', 'secondaryColor': '#fef3c7', 'tertiaryColor': '#dcfce7'}}}%%
graph TD
    classDef positive fill:#dcfce7,stroke:#16a34a,color:#065f46,font-weight:600;
    classDef warning fill:#fee2e2,stroke:#fb7185,color:#b91c1c,font-weight:600;
    A[访客进入着陆页] --> B{是否完成注册}
    B -- 是 --> C[展示个性化仪表盘]
    B -- 否 --> D[触发注册流程]
    C --> E[激活邮件服务]
    D -->|高意向| F[分配销售跟进]
    D -->|继续培育| G[投放再营销广告]
    E --> H[生成试用数据面板]
    F --> I[销售成单]
    G --> I
    class C,E,H positive
    class F,G warning`
  },
  {
    id: 'sequence-platform',
    name: '🔁 Sequence Diagram：实时平台回流',
    description: '展示缓存、服务与消息队列协作的彩色时序图。',
    code: `%%{init: {'sequence': {'mirrorActors': false, 'actorFontWeight': 600}, 'themeVariables': {'primaryColor': '#bae6fd'}}}%%
sequenceDiagram
    autonumber
    participant Client as 客户端
    participant Edge as 边缘缓存
    participant API as 应用服务
    participant MQ as 消息队列
    participant DB as 数据库

    Client->>Edge: GET /reports
    Edge-->>Client: 命中缓存?
    alt 缓存命中
      Edge-->>Client: 返回 200 + 缓存内容
    else 缓存未命中
      Edge->>API: 转发请求
      API->>DB: 查询最新报表
      DB-->>API: 返回数据
      API->>MQ: 推送缓存刷新事件
      API-->>Client: 返回 200 + 报表
    end
    MQ-->>Edge: 刷新缓存`
  },
  {
    id: 'state-approval',
    name: '🧱 State Diagram：变更审批流',
    description: '通过粉色系状态图呈现多层审批与发布状态。',
    code: `%%{init: {'themeVariables': {'primaryColor': '#f9a8d4', 'secondaryColor': '#fdf2f8', 'tertiaryColor': '#fce7f3'}}}%%
stateDiagram-v2
    [*] --> 草稿
    草稿 --> 待评审: 提交审核
    待评审 --> 评审中: 审核人领取
    评审中 --> 变更中: 请求修改
    变更中 --> 草稿: 作者更新
    评审中 --> 已通过: 审核通过
    已通过 --> 已归档: 发布时间到达
    已归档 --> [*]
    state 已通过 {
      [*] --> 待发布
      待发布 --> 已发布: 发布到生产
    }`
  },
  {
    id: 'journey-experience',
    name: '🔄 User Journey：体验旅程',
    description: '彩色旅程图对比不同角色在关键阶段的情绪评分。',
    code: `%%{init: {'themeVariables': {'journeyTaskFill': '#bfdbfe', 'journeyTaskTextColor': '#0f172a', 'journeyStrokeColor': '#1d4ed8'}}}%%
journey
    title SaaS 客户生命周期
    section 认知阶段
      了解产品优势: 4: 市场团队
      观看功能直播: 5: 客户成功
    section 试用阶段
      注册并导入数据: 3: 用户
      邀请团队成员: 4: 用户
    section 付费阶段
      订阅专业版: 5: 财务
      启用安全审计: 5: 安全管理员
    section 成长期
      评估业务指标: 4: 运营
      参与共创计划: 5: 产品`
  },
  {
    id: 'gantt-iteration',
    name: '🧬 Gantt Chart：迭代规划',
    description: '使用双色甘特图描述跨职能迭代排期。',
    code: `%%{init: {'themeVariables': {'ganttBarColor': '#38bdf8', 'ganttBarColor2': '#f97316', 'ganttSectionBkgColor': '#f1f5f9'}}}%%
gantt
    title 2025 春季版本迭代
    dateFormat  YYYY-MM-DD
    section 规划与设计
    竞品调研            :done,    a1, 2025-02-10, 5d
    交互原型            :active,  a2, 2025-02-14, 6d
    section 开发联调
    API 重构            :         b1, after a2, 10d
    Web 前端            :         b2, after a2, 12d
    移动端适配          :         b3, after a2, 8d
    section 测试与发布
    灰度发布            :         c1, after b1, 5d
    全量上线            :milestone,c2, 2025-03-18, 1d`
  },
  {
    id: 'class-domain',
    name: '🧩 Class Diagram：领域建模',
    description: '强调聚合之间关系的领域类图，含彩色分类。',
    code: `%%{init: {'themeVariables': {'primaryColor': '#a855f7', 'secondaryColor': '#ede9fe', 'tertiaryColor': '#f5f3ff'}}}%%
classDiagram
    class 用户 {
      +UUID id
      +string name
      +string email
      +verifyPassword()
    }
    class 订单 {
      +UUID id
      +Date createdAt
      +Decimal totalPrice
      +confirm()
      +cancel()
    }
    class 商品 {
      +UUID id
      +string title
      +Decimal price
      +int stock
    }
    class 优惠券 {
      +UUID id
      +string code
      +Decimal discount
      +apply()
    }
    用户 "1" -- "*" 订单 : 创建
    订单 "1" -- "*" 商品 : 包含
    订单 o--o 优惠券 : 使用
    商品 --> 订单 : 更新库存`
  },
  {
    id: 'er-commerce',
    name: '🕸️ Entity Relationship Diagram：电商模型',
    description: '实体关系图展示用户、订单、结算的多彩关系网络。',
    code: `%%{init: {'themeVariables': {'erTableHeaderColor': '#0ea5e9', 'erTableHeaderTextColor': '#ffffff', 'erTableBackgroundColor': '#ecfeff'}}}%%
erDiagram
    USERS ||--o{ ORDERS : 拥有
    USERS {
      string id PK
      string email
      string region
    }
    ORDERS {
      string id PK
      date placed_at
      decimal total
      string user_id FK
    }
    ORDERS ||--|{ ORDER_ITEMS : 包含
    PRODUCTS ||--o{ ORDER_ITEMS : 被购买
    PAYMENTS ||--|| ORDERS : 结算
    PRODUCTS {
      string id PK
      string title
      decimal price
      string sku
    }
    ORDER_ITEMS {
      string id PK
      string order_id FK
      string product_id FK
      int quantity
    }
    PAYMENTS {
      string id PK
      string channel
      string status
    }`
  },
  {
    id: 'git-graph-release',
    name: '🔗 Git Graph：版本发布',
    description: '以 Git Graph 展示彩色分支、合并与版本标签。',
    code: `%%{init: {'gitGraph': {'showCommitLabel': true, 'mainBranchName': 'main', 'rotateCommitLabel': false}, 'themeVariables': {'primaryColor': '#38bdf8'}}}%%
gitGraph
    commit id: "初始化"
    branch feature/api
    commit id: "API 草稿"
    branch feature/ui
    commit id: "UI 原型"
    checkout feature/api
    commit id: "接入鉴权"
    checkout main
    merge feature/api tag: "v0.5.0"
    checkout feature/ui
    commit id: "引入主题切换"
    checkout main
    merge feature/ui tag: "v1.0.0"
    commit id: "部署上线"`
  },
  {
    id: 'pie-channel',
    name: '🌍 Pie Chart：渠道构成',
    description: '展示多渠道转化贡献的多彩饼图。',
    code: `%%{init: {'themeVariables': {'pie1': '#38bdf8', 'pie2': '#f472b6', 'pie3': '#facc15', 'pie4': '#34d399'}}}%%
pie showData
    title 2024 年渠道贡献
    "付费推广" : 32
    "内容营销" : 24
    "合作伙伴" : 18
    "口碑推荐" : 26`
  },
  {
    id: 'line-activation',
    name: '📈 Line Chart：活跃趋势',
    description: '双折线对比产品活跃与留存的趋势图。',
    code: `%%{init: {'xyChart': {'plotColorPalette': '#38bdf8,#facc15'}}}%%
xychart
    title "月度活跃与留存"
    x-axis ["2024-Q1", "2024-Q2", "2024-Q3", "2024-Q4"]
    y-axis "指标 (%)" 40 --> 90
    line "活跃率" [62, 68, 74, 81]
    line "留存率" [54, 59, 63, 70]`
  },
  {
    id: 'bar-conversion',
    name: '📊 Bar Chart：渠道转化率',
    description: '横向条形图对比不同渠道转化率，突出重点颜色。',
    code: `%%{init: {'xyChart': {'plotColorPalette': '#38bdf8,#f97316'}}}%%
xychart horizontal
    title "Q2 渠道转化率"
    x-axis ["广告投放", "社区运营", "邮件营销", "合作伙伴"]
    y-axis "转化率 (%)" 0 --> 50
    bar "渠道转化" [42, 35, 28, 24]`
  },
  {
    id: 'plot-xy',
    name: '📈 XY Chart：转化 vs 留存',
    description: '折线与柱状组合呈现渠道表现与目标对比。',
    code: `%%{init: {'xyChart': {'plotColorPalette': '#38bdf8,#f97316,#22c55e'}}}%%
xychart
    title "渠道表现对比"
    x-axis ["广告投放", "社区运营", "邮件营销", "合作伙伴", "增长实验"]
    y-axis "指标 (%)" 0 --> 100
    bar "转化率" [42, 35, 28, 24, 30]
    line "留存率" [58, 64, 70, 75, 68]
    line "满意度" [72, 78, 82, 84, 80]`
  },
  {
    id: 'mindmap-planning',
    name: '🧠 Mindmap：项目规划',
    description: '绿色思维导图拆解目标、关键结果与策略。',
    code: `mindmap
      root((项目启动))
        目标
          提升用户活跃
          降低流失率
        关键结果
          日活提升20%
          续费率提升15%
        策略
          产品体验优化
            调整信息架构
            引入新手引导
          精准运营
            增加触达渠道
            自动化运营流程`
  },
  {
    id: 'timeline-rollout',
    name: '🗂️ Timeline：发布计划',
    description: '时间线梳理彩色的版本发布与关键活动节点。',
    code: `%%{init: {'themeVariables': {'timelineSectionBkgColor': '#f1f5f9', 'timelineSectionHeaderColor': '#38bdf8'}}}%%
timeline
    title LocalMermaid 发布节奏
    2025-01-08 : 梳理需求与原型
    2025-01-22 : 样式与交互定稿
    2025-02-05 : 加入版本切换
    2025-02-19 : 扩展图表示例库
    2025-03-05 : 支持导出 PNG
    2025-03-19 : 发布离线安装包`
  },
  {
    id: 'requirement-suite',
    name: '🔄 Requirement Diagram：需求追踪',
    description: '需求、测试与实现之间的满足关系示意图。',
    code: `requirementDiagram
    requirement UI_Highlight {
      id: "R-UI-001"
      text: "语法高亮清晰可读"
      risk: medium
      verifymethod: inspection
    }
    performanceRequirement Render_Perf {
      id: "R-PERF-002"
      text: "离线渲染耗时低于一秒"
      risk: high
      verifymethod: test
    }
    element EditorSurface {
      type: "UI 组件"
      docRef: "docs/editor.md"
    }
    element RenderBench {
      type: "自动化测试"
      docRef: "qa/render-benchmark"
    }
    EditorSurface - satisfies -> UI_Highlight
    RenderBench - verifies -> Render_Perf
    UI_Highlight - traces -> Render_Perf`
  },
  {
    id: 'quadrant-priority',
    name: '🧭 Quadrant Chart：优先级矩阵',
    description: '高亮不同特性的价值与复杂度分布。',
    code: `quadrantChart
    title "Priority Quadrant"
    x-axis Low Value --> High Value
    y-axis Low Complexity --> High Complexity
    quadrant-1 "快速获益"
    quadrant-2 "长线投资"
    quadrant-3 "观察跟进"
    quadrant-4 "谨慎投入"
    "可视化导出" : [0.82, 0.35]
    "多版本切换" : [0.74, 0.58]
    "团队协作" : [0.62, 0.82]
    "实时协同" : [0.9, 0.9]
    "模板市场" : [0.48, 0.52]`
  },
  {
    id: 'c4-architecture',
    name: '⚙️ C4 Diagram：系统容器视图',
    description: 'C4 容器图突出前端、API 与存储之间的数据流。',
    code: `%%{init: {'theme': 'forest'}}%%
C4Container
    title LocalMermaid 架构
    Person(user, "终端用户", "在浏览器中编辑 Mermaid")
    Person(admin, "管理员", "维护示例与版本")
    System_Boundary(saas, "LocalMermaid") {
      Container(web, "Web 前端", "HTML + JS", "渲染编辑器与预览")
      Container(api, "API 服务", "Node.js", "提供示例与版本管理 API")
      ContainerDb(db, "存储", "SQLite", "持久化示例模板")
    }
    Rel(user, web, "编辑与渲染图表", "HTTPS")
    Rel(admin, web, "上传示例", "HTTPS")
    Rel(web, api, "拉取示例数据", "HTTPS")
    Rel(api, db, "读写配置", "SQL")`
  },
  {
    id: 'sankey-funnel',
    name: '📊 Sankey Diagram：漏斗流向',
    description: 'Sankey 图展示用户在不同阶段的能量流转。',
    code: `sankey

Traffic_In,Landing_Page,1200
Landing_Page,Signup,760
Signup,Activation,540
Activation,Subscribed,310
Signup,Drop_Trial,120
Activation,Extended_Trial,90`
  }
];
