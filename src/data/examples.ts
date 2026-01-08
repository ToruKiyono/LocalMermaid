export interface MermaidExample {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const examples: MermaidExample[] = [
  {
    id: 'flowchart-basic',
    name: '✨ 基础流程：开始-结束',
    description: '最小化的 Mermaid 流程图示例，确保开箱即用。',
    code: `graph TD
    A[开始] --> B[结束]`
  },
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
    checkout feature/ui
    commit id: "补充组件"
    checkout main
    merge feature/api tag: "v1.0.0"
    merge feature/ui
    commit id: "热修复"`
  },
  {
    id: 'pie-channel',
    name: '🌍 Pie Chart：渠道构成',
    description: '饼图展示增长渠道的占比结构。',
    code: `%%{init: {'themeVariables': {'pieSectionTextSize': '14px'}}}%%
pie title 渠道贡献
    "自然流量" : 45
    "内容营销" : 25
    "社交转化" : 15
    "渠道投放" : 15`
  },
  {
    id: 'line-active',
    name: '📈 折线图：活跃趋势',
    description: '多指标折线趋势图。',
    code: `xychart-beta
    title "活跃趋势"
    x-axis [周一, 周二, 周三, 周四, 周五, 周六, 周日]
    y-axis "活跃数" 0 --> 300
    line "活跃用户" [120, 180, 210, 260, 240, 200, 150]
    line "付费用户" [40, 60, 80, 120, 110, 90, 50]`
  },
  {
    id: 'bar-conversion',
    name: '📊 柱状图：渠道转化率',
    description: '柱状图对比不同渠道转化率。',
    code: `xychart-beta
    title "渠道转化率"
    x-axis [官网, 内容, 广告, 推荐]
    y-axis "转化率" 0 --> 100
    bar "转化率" [68, 52, 74, 88]`
  },
  {
    id: 'xy-retention',
    name: '📈 XY Chart：转化 vs 留存',
    description: '双变量对比转化与留存。',
    code: `xychart-beta
    title "转化 vs 留存"
    x-axis "转化率" 0 --> 100
    y-axis "留存率" 0 --> 100
    scatter "渠道" [25, 40] [45, 65] [70, 80] [90, 60]`
  },
  {
    id: 'mindmap-plan',
    name: '🧠 Mindmap：项目规划',
    description: '思维导图梳理项目规划。',
    code: `mindmap
  root((产品规划))
    需求收集
      用户访谈
      行业调研
    方案设计
      交互原型
      体验验证
    项目推进
      开发排期
      测试发布`
  },
  {
    id: 'timeline-release',
    name: '🗂️ Timeline：发布计划',
    description: '时间线描述多个里程碑。',
    code: `timeline
    title 产品发布计划
    2025-01 : 版本规划
    2025-02 : 功能开发
    2025-03 : 灰度上线
    2025-04 : 全量发布`
  },
  {
    id: 'requirement-trace',
    name: '🔄 Requirement Diagram：需求追踪',
    description: '需求图展示用户故事与系统能力。',
    code: `requirementDiagram
    requirement 用户身份校验 {
      id: 1
      text: 支持单点登录
      risk: high
      verifymethod: test
    }
    functionalRequirement 登录流程 {
      id: 2
      text: 第三方登录
      risk: medium
      verifymethod: inspection
    }
    interfaceRequirement 认证服务 {
      id: 3
      text: 对接 OAuth
      risk: high
      verifymethod: analysis
    }
    用户身份校验 - verifies -> 登录流程
    登录流程 - satisfies -> 认证服务`
  },
  {
    id: 'quadrant-priority',
    name: '🧭 Quadrant Chart：优先级矩阵',
    description: '象限图呈现任务价值与成本。',
    code: `quadrantChart
    title 优先级矩阵
    x-axis 低成本 --> 高成本
    y-axis 低价值 --> 高价值
    quadrant-1 高价值低成本
    quadrant-2 高价值高成本
    quadrant-3 低价值低成本
    quadrant-4 低价值高成本
    A[体验优化] : [0.2, 0.8]
    B[支付升级] : [0.7, 0.9]
    C[报表重构] : [0.6, 0.4]
    D[旧功能维护] : [0.2, 0.3]`
  },
  {
    id: 'c4-container',
    name: '⚙️ C4：系统容器视图',
    description: '容器级别展示核心服务与依赖。',
    code: `C4Container
    title 系统容器视图
    Person(user, "用户")
    System_Boundary(system, "SaaS 平台") {
      Container(web, "Web 前端", "React", "界面交互")
      Container(api, "API 服务", "Node.js", "核心业务逻辑")
      ContainerDb(db, "数据库", "PostgreSQL", "业务数据")
    }
    System_Ext(auth, "统一认证")

    Rel(user, web, "使用")
    Rel(web, api, "调用")
    Rel(api, db, "读写")
    Rel(api, auth, "鉴权")`
  },
  {
    id: 'sankey-funnel',
    name: '📊 Sankey：漏斗流向',
    description: '桑基图描述转化流失。',
    code: `sankey
    title 产品转化漏斗
    "访问" [300] "注册"
    "注册" [180] "试用"
    "试用" [120] "付费"
    "注册" [40] "流失"
    "试用" [20] "流失"`
  }
];
