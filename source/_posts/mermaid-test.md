---
title: Mermaid 图表测试
tags:
  - 测试
categories:
  - 测试
abbrlink: f4eccc84
date: 2026-06-20 12:00:00
---

## 使用 fenced code block（推荐）

```mermaid
graph TD
    A[开始] --> B{是否完成}
    B -->|是| C[结束]
    B -->|否| D[继续努力]
    D --> B
```

## 使用标签插件

{% mermaid %}
graph TD
    A[起床] --> B{今天天气?}
    B -->|晴天| C[去公园]
    B -->|雨天| D[待在家]
    C --> E[散步]
    D --> F[看书]
{% endmermaid %}

## 更复杂的图表

```mermaid
graph LR
    subgraph "前端"
        A[HTML] --> B[CSS]
        A --> C[JavaScript]
    end
    subgraph "后端"
        D[Node.js] --> E[数据库]
    end
    B --> D
    C --> D
```

## 错误语法测试（应显示错误提示）

```mermaid
graph TD
    A --> B
    this is invalid syntax
```

## 复杂 graph TD 图表（含 subgraph 和样式）

```mermaid
graph TD
 %% ---------- 加工链（人为流程） ----------
 subgraph "加工链：从原料到消费的核心路径"
 A[农田种植园<br/>（饲料作物种植）]
 B[养殖场<br/>（奶牛养殖，产原奶）]
 C[食品加工厂<br/>（乳制品加工：杀菌、标准化、灌装等）]
 D[分类、包装]
 E[运输<br/>（公路/铁路/冷链运输）]
 F[冷藏/储藏<br/>（仓库或终端冷柜）]
 G[食品销售]
 H[人类消费]

     A -->|化肥农药残留、工业废水灌溉| B
     B -->|粪便污染、抗生素滥用| C
     C -->|化学残留、包装材料污染| D
     D -->|冷链断裂、尾气排放| E
     E -->|储存不当、过期产品| F
     F -->|临期未下架、消费者储存不当| G
     G -->|食用变质牛奶| H
 end

 %% ---------- 自然链（自然生态交互） ----------
 subgraph "自然链：环境介质与加工链的污染传导"
     I[土壤污染<br/>（工业废水、化肥残留、固废堆积）]
     J[水体污染<br/>（工业废水、生活污水、农田径流）]
     K[空气污染<br/>（工业废气、交通尾气、垃圾填埋气）]
     L[微生物<br/>（致病菌、寄生虫、霉菌）]
     M[外源污染<br/>（垃圾填埋、工业固废、农业固废）]

     I --> A
     J --> B
     K -->|大气沉降| A
     K -->|大气沉降| B
     L --> B
     L --> C
     M --> I
     M --> J
     M --> K
 end

 %% ---------- 样式区分 ----------
 classDef process fill:#f9f,stroke:#333;
 classDef nature fill:#bbf,stroke:#333;
 class A,B,C,D,E,F,G,H process;
 class I,J,K,L,M nature;
```