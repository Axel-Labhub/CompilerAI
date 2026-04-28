#!/bin/bash
# Vercel 一键部署脚本 - 编译器官网落地页

echo "🚀 开始部署编译器官网落地页到 Vercel..."

cd "$(dirname "$0")"

# 检查 dist/landing.html 是否存在
if [ ! -f "dist/landing.html" ]; then
    echo "⚠️ dist/landing.html 不存在，正在复制..."
    cp landing.html dist/landing.html
fi

# 检查 Vercel CLI 是否安装
if ! command -s vercel &> /dev/null; then
    echo "📦 Vercel CLI 未安装，正在安装..."
    npm install -g vercel
fi

# 执行部署
echo "🔄 正在部署到 Vercel..."
vercel --prod --yes

echo ""
echo "✅ 部署完成！"
echo "📝 提示：首次部署需要登录 Vercel 账号"
