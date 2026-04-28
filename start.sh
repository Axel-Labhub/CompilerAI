#!/bin/bash

# 编译器 - 启动脚本

echo "🚀 正在启动编译器..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 启动开发服务器
echo "✅ 依赖安装完成，启动开发服务器..."
echo ""
echo "🌐 访问 http://localhost:3000"
echo ""
npm run dev
