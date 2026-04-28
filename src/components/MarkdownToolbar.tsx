/**
 * MarkdownToolbar 组件
 * Markdown 编辑器快捷工具栏
 */

import React, { useState } from 'react'

interface ToolbarButton {
  id: string
  icon: string
  label: string
  insert: string
  insertBefore?: string
  insertAfter?: string
  placeholder?: string
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { id: 'bold', icon: 'B', label: '加粗', insert: '**', insertBefore: '**', insertAfter: '**', placeholder: '粗体文字' },
  { id: 'italic', icon: 'I', label: '斜体', insert: '*', insertBefore: '*', insertAfter: '*', placeholder: '斜体文字' },
  { id: 'h1', icon: 'H1', label: '标题1', insert: '# ', insertBefore: '# ' },
  { id: 'h2', icon: 'H2', label: '标题2', insert: '## ', insertBefore: '## ' },
  { id: 'h3', icon: 'H3', label: '标题3', insert: '### ', insertBefore: '### ' },
  { id: 'ul', icon: '•', label: '无序列表', insert: '- ', insertBefore: '- ' },
  { id: 'ol', icon: '1.', label: '有序列表', insert: '1. ', insertBefore: '1. ' },
  { id: 'code', icon: '`', label: '行内代码', insert: '`', insertBefore: '`', insertAfter: '`', placeholder: 'code' },
  { id: 'codeblock', icon: '```', label: '代码块', insert: '\n```\n', insertBefore: '\n```\n', insertAfter: '\n```', placeholder: 'code' },
  { id: 'link', icon: '🔗', label: '链接', insert: '[', insertBefore: '[', insertAfter: '](url)', placeholder: '链接文字' },
  { id: 'quote', icon: '"', label: '引用', insert: '> ', insertBefore: '> ' },
  { id: 'hr', icon: '—', label: '分割线', insert: '\n---\n', insertBefore: '\n---\n' },
]

interface MarkdownToolbarProps {
  onInsert: (before: string, after: string, placeholder?: string) => void
  disabled?: boolean
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ onInsert, disabled }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const handleClick = (button: ToolbarButton) => {
    onInsert(
      button.insertBefore || button.insert,
      button.insertAfter || '',
      button.placeholder
    )
    setActiveTooltip(null)
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-dark-card/50 border-b border-dark-border">
      {TOOLBAR_BUTTONS.map((button) => (
        <div key={button.id} className="relative">
          <button
            onClick={() => handleClick(button)}
            disabled={disabled}
            onMouseEnter={() => setActiveTooltip(button.id)}
            onMouseLeave={() => setActiveTooltip(null)}
            className="w-8 h-8 flex items-center justify-center rounded text-sm font-medium text-dark-muted hover:text-dark-text hover:bg-dark-border/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={button.label}
          >
            <span className={button.id === 'bold' ? 'font-bold' : button.id === 'italic' ? 'italic' : ''}>
              {button.icon}
            </span>
          </button>
          
          {/* Tooltip */}
          {activeTooltip === button.id && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-dark-text whitespace-nowrap z-50 shadow-lg">
              {button.label}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default MarkdownToolbar
