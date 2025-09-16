# 涨跌幅计算器（Tailwind + Node.js + Hono）

该示例使用 [Hono](https://hono.dev/) 作为 Node.js 服务框架，并通过 Tailwind CSS CDN 构建了一个简洁的涨跌幅计算页面。

## 功能特性

- 🌐 使用 Hono 启动极简 Node.js Web 服务。
- 🎨 通过 Tailwind CSS 构建响应式、暗色主题的页面样式。
- 📈 支持输入初始价格与最新价格，计算涨跌幅和绝对变化数值。
- 🧮 针对无效数据（例如初始价格为 0）提供友好提示。
- 🔢 计算结果自动限制为最多 6 位有效数字，保持展示精简清晰。
- ⚙️ 通过设置页面自定义涨跌颜色（红涨绿跌 / 红跌绿涨）及默认货币前缀（¥ / $）。

## 本地运行

```bash
npm install
npm start
```

默认会在 `http://localhost:3000` 启动服务，打开浏览器即可使用涨跌幅计算器。

如需自定义颜色方案或货币前缀，可访问 `http://localhost:3000/settings` 进行配置。

## 目录结构

```
.
├── src
│   └── server.js    # Hono 服务入口，返回带 Tailwind 样式的页面
├── package.json
└── README.md
```
