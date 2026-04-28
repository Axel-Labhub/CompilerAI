# AI 功能使用指南

## 功能概览

「编译器」内置三大 AI 功能：

| 功能 | 描述 | 入口 |
|------|------|------|
| AI 一键清洗 | 将情绪化内容转为专业表述 | 编辑器工具栏 |
| AI 智能标签 | 自动分析内容推荐标签 | 编辑器工具栏 |
| AI 周报生成 | 从笔记汇总生成周报 | 侧边栏底部 |

## 启用步骤

### 1. 获取 API Key

**推荐使用 豆包**（火山引擎，稳定可靠）

1. 访问 https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey
2. 注册/登录账号
3. 创建新的 API Key
4. 复制 Key

也支持 DeepSeek：https://platform.deepseek.com/api_keys

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```bash
# AI 服务商 (douban 或 deepseek)
VITE_AI_PROVIDER=douban

# API Key（必填）
VITE_AI_API_KEY=your-api-key-here

# 模型名称（可选，不填使用默认）
# 豆包: doubao-seed-2.0-lite（推荐）
VITE_AI_MODEL=doubao-seed-2.0-lite
```

### 3. 重启项目

```bash
npm run dev
```

## API 成本参考

| 服务商 | 模型 | 价格（约） |
|--------|------|------------|
| 豆包 | doubao-seed-2.0-lite | ¥0.8/百万 tokens |
| DeepSeek | deepseek-chat | ¥1/百万 tokens |

## 故障排除

### API 未配置
- 检查 `.env` 文件是否存在
- 确认 `VITE_AI_API_KEY` 已正确填写
- 重启开发服务器

### 调用超时
- 检查网络连接
- 稍后重试（可能服务器繁忙）

### 返回内容为空
- 检查 API Key 是否有效
- 确认账户余额充足
