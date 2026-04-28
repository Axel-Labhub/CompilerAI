#!/bin/bash

echo "================================"
echo "编译器 - 一键部署脚本"
echo "================================"
echo

echo "[1/3] 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "[错误] 未安装 Node.js，请先安装：https://nodejs.org/"
    exit 1
fi
echo "Node.js 已安装: $(node -v)"

echo
echo "[2/3] 安装依赖并构建..."
npm install
npm run build

echo
echo "[3/3] 构建完成！"
echo
echo "================================"
echo "接下来："
echo "1. 打开 https://app.netlify.com/drop"
echo "2. 将 dist 文件夹拖到网页上"
echo "3. 等待上传完成，获得线上地址"
echo "================================"
