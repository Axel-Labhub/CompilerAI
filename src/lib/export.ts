/**
 * 导出工具函数
 * 支持 Markdown、HTML、PDF 格式导出笔记
 */

import type { Note, ExportOptions } from '../types'

/**
 * 生成安全的文件名
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100) || '笔记'
}

/**
 * 格式化日期
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 生成 Markdown 导出内容
 */
export function generateMarkdown(note: Note, options: ExportOptions): string {
  const lines: string[] = []

  // 标题
  lines.push(`# ${note.title || '无标题笔记'}`)
  lines.push('')

  // 元数据
  if (options.includeMetadata) {
    lines.push('---')
    lines.push('')
    lines.push(`- **创建时间**: ${formatDate(note.createdAt)}`)
    lines.push(`- **更新时间**: ${formatDate(note.updatedAt)}`)
    if (note.tags.length > 0) {
      lines.push(`- **标签**: ${note.tags.map(t => `\`${t}\``).join(', ')}`)
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // 主内容
  lines.push(note.content)
  lines.push('')

  // 编译真相区域
  if (options.includeCompiledSection && note.compiledSection) {
    const { summary, insights, lastCompiled } = note.compiledSection
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## 💡 编译真相')
    lines.push('')
    lines.push(`> ${summary}`)
    lines.push('')
    if (insights && insights.length > 0) {
      lines.push('### 关键洞察')
      insights.forEach((insight, i) => {
        lines.push(`${i + 1}. ${insight}`)
      })
      lines.push('')
    }
    lines.push(`*最后编译: ${formatDate(lastCompiled)}*`)
  }

  // 页脚
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(`*由编译器导出 | ${formatDate(Date.now())}*`)

  return lines.join('\n')
}

/**
 * 生成可打印的 HTML 内容（用于 PDF 导出）
 */
export function generatePrintableHTML(note: Note, options: ExportOptions): string {
  const lines: string[] = []

  lines.push(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title || '无标题笔记'}</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 30px;
      line-height: 1.8;
      color: #333;
      background: #fff;
    }
    h1 {
      font-size: 28px;
      color: #1a1a1a;
      border-bottom: 3px solid #0ea5e9;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }
    h2 {
      font-size: 20px;
      color: #1a1a1a;
      margin-top: 35px;
      margin-bottom: 15px;
      padding-left: 10px;
      border-left: 4px solid #0ea5e9;
    }
    h3 {
      font-size: 16px;
      color: #333;
      margin-top: 25px;
      margin-bottom: 10px;
    }
    p {
      margin: 12px 0;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
      font-size: 14px;
      color: #e11d48;
    }
    pre {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
    }
    pre code {
      background: none;
      padding: 0;
      color: #333;
    }
    blockquote {
      border-left: 4px solid #0ea5e9;
      margin: 15px 0;
      padding: 10px 20px;
      background: #f0f9ff;
      color: #475569;
    }
    ul, ol {
      margin: 12px 0;
      padding-left: 25px;
    }
    li {
      margin: 6px 0;
    }
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 30px 0;
    }
    .metadata {
      background: #f9fafb;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      font-size: 14px;
      color: #6b7280;
    }
    .metadata p {
      margin: 4px 0;
    }
    .tag {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      margin: 2px;
    }
    .compiled-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 20px;
      border-radius: 12px;
      margin-top: 30px;
    }
    .compiled-section h2 {
      margin-top: 0;
      color: #92400e;
      border-left-color: #f59e0b;
    }
    .compiled-section blockquote {
      background: rgba(255,255,255,0.8);
      border-left-color: #f59e0b;
      color: #78350f;
      font-style: italic;
    }
    .compiled-section ul {
      color: #78350f;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    @media print {
      body {
        padding: 20px;
      }
      .compiled-section {
        background: #fffbeb !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>`)

  // 标题
  lines.push(`  <h1>${note.title || '无标题笔记'}</h1>`)

  // 元数据
  if (options.includeMetadata) {
    lines.push('  <div class="metadata">')
    lines.push(`    <p><strong>创建时间:</strong> ${formatDate(note.createdAt)}</p>`)
    lines.push(`    <p><strong>更新时间:</strong> ${formatDate(note.updatedAt)}</p>`)
    if (note.tags.length > 0) {
      lines.push(`    <p><strong>标签:</strong> ${note.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</p>`)
    }
    lines.push('  </div>')
  }

  // 内容
  lines.push(`  <div class="content">${escapeHtml(note.content)}</div>`)

  // 编译真相区域
  if (options.includeCompiledSection && note.compiledSection) {
    const { summary, insights, lastCompiled } = note.compiledSection
    lines.push('')
    lines.push('  <div class="compiled-section">')
    lines.push('    <h2>💡 编译真相</h2>')
    lines.push(`    <blockquote>${summary}</blockquote>`)
    if (insights && insights.length > 0) {
      lines.push('    <h3>关键洞察</h3>')
      lines.push('    <ul>')
      insights.forEach(insight => {
        lines.push(`      <li>${escapeHtml(insight)}</li>`)
      })
      lines.push('    </ul>')
    }
    lines.push(`    <p><em>最后编译: ${formatDate(lastCompiled)}</em></p>`)
    lines.push('  </div>')
  }

  // 页脚
  lines.push('')
  lines.push(`  <div class="footer">`)
  lines.push(`    <p>由编译器导出 | ${formatDate(Date.now())}</p>`)
  lines.push(`  </div>`)
  lines.push('</body>')
  lines.push('</html>')

  return lines.join('\n')
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * 导出为 Markdown 文件
 */
export function downloadMarkdown(note: Note, options: ExportOptions = defaultExportOptions): void {
  const content = generateMarkdown(note, options)
  const filename = sanitizeFilename(note.title || '笔记') + '.md'
  downloadFile(content, filename, 'text/markdown;charset=utf-8')
}

/**
 * 导出为 HTML 文件
 */
export function downloadHTML(note: Note, options: ExportOptions = defaultExportOptions): void {
  const content = generatePrintableHTML(note, options)
  const filename = sanitizeFilename(note.title || '笔记') + '.html'
  downloadFile(content, filename, 'text/html;charset=utf-8')
}

/**
 * 导出为 PDF（使用浏览器打印功能）
 */
export function downloadPDF(note: Note, options: ExportOptions = defaultExportOptions): void {
  const html = generatePrintableHTML(note, options)
  
  // 创建打印窗口
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('请允许弹出窗口以导出 PDF')
    return
  }

  printWindow.document.write(html)
  printWindow.document.close()

  // 等待内容加载后触发打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 默认导出选项
 */
export const defaultExportOptions: ExportOptions = {
  includeMetadata: true,
  includeCompiledSection: true,
}
