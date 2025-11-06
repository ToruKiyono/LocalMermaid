export const examples = [
  {
    id: 'flowchart-basic',
    name: '流程图：功能模块',
    description: '最常见的流程图结构，展示应用的主要流程。',
    code: `graph TD
    A[访客进入网站] --> B{是否登录}
    B -- 是 --> C[跳转到控制台]
    B -- 否 --> D[显示登录引导]
    C --> E[加载项目]
    D --> F[展示注册入口]
    E --> G[生成报表]
    F -.-> C`
  },
  {
    id: 'sequence-api',
    name: '时序图：API 调用',
    description: '展示客户端、服务端之间的请求和响应链路。',
    code: `sequenceDiagram
    participant Client as Web 客户端
    participant API as 应用服务
    participant DB as 数据库

    Client->>API: POST /login
    API->>DB: 查询用户凭证
    DB-->>API: 返回校验结果
    alt 验证成功
      API-->>Client: 返回 Token
    else 验证失败
      API-->>Client: 返回错误
    end`
  },
  {
    id: 'class-domain',
    name: '类图：领域建模',
    description: '用于展示系统中实体、聚合与关系。',
    code: `classDiagram
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

    用户 "1" -- "*" 订单 : 创建
    订单 "1" -- "*" 商品 : 包含
    商品 --> 订单 : 更新库存`
  },
  {
    id: 'state-machine',
    name: '状态图：审批流程',
    description: '展示审批流程的状态变化以及触发条件。',
    code: `stateDiagram-v2
    [*] --> 待提交
    待提交 --> 待审批: 提交申请
    待审批 --> 审批中: 分派审批人
    审批中 --> 通过: 审批通过
    审批中 --> 驳回: 审批驳回
    驳回 --> 待提交: 修改后重新提交
    通过 --> [*]`
  },
  {
    id: 'er-model',
    name: 'ER 图：用户与订单',
    description: '实体关系图适合快速梳理数据库表之间的关联。',
    code: `erDiagram
    USERS ||--o{ ORDERS : 拥有
    USERS {
      string id PK
      string email
      string name
    }
    ORDERS {
      string id PK
      date placed_at
      decimal total
      string user_id FK
    }
    ORDERS ||--|{ ORDER_ITEMS : 包含
    PRODUCTS ||--o{ ORDER_ITEMS : 被购买
    PRODUCTS {
      string id PK
      string title
      decimal price
    }
    ORDER_ITEMS {
      string id PK
      string order_id FK
      string product_id FK
      int quantity
    }`
  },
  {
    id: 'journey-map',
    name: '旅程图：用户生命周期',
    description: '旅程图用于分析用户在各阶段的体验与情绪。',
    code: `journey
    title 用户生命周期体验
    section 认知阶段
      看到广告: 5: 营销团队
      阅读博客: 4: 内容团队
    section 转化阶段
      注册账号: 3: 用户
      体验试用: 4: 产品
    section 留存阶段
      成为付费用户: 5: 运营
      邀请同事: 4: 用户`
  },
  {
    id: 'gantt-sprint',
    name: '甘特图：迭代计划',
    description: '规划迭代阶段和任务进度的可视化方案。',
    code: `gantt
    title Q2 迭代计划
    dateFormat  YYYY-MM-DD
    section 规划
    需求调研        :done,    des1, 2025-04-01,2025-04-05
    原型设计        :active,  des2, 2025-04-04, 5d
    section 开发
    后端接口        :         des3, after des2, 8d
    前端页面        :         des4, after des2, 9d
    section 测试与发布
    联调测试        :         des5, after des3, 6d
    上线准备        :milestone, des6, 2025-05-01, 1d`
  },
  {
    id: 'mindmap-planning',
    name: '思维导图：项目规划',
    description: '思维导图示例，快速梳理项目关键节点。',
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
  }
];
