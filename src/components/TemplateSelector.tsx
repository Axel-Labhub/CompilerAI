/**
 * TemplateSelector 组件
 * 笔记模板选择器
 */

import React from 'react'
import { NOTE_TEMPLATES, NoteTemplate } from '../types'

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: NoteTemplate | null) => void
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null

  // 处理日期模板变量
  const processTemplate = (content: string): string => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const weekNum = getWeekNumber(now)
    
    return content
      .replace(/\{\{date\}\}/g, dateStr)
      .replace(/\{\{week\}\}/g, `第${weekNum}周`)
  }

  // 获取周数
  const getWeekNumber = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1)
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
    return Math.ceil((days + startOfYear.getDay() + 1) / 7)
  }

  const handleSelect = (template: NoteTemplate) => {
    const processedContent = processTemplate(template.content)
    onSelect({ ...template, content: processedContent })
    onClose()
  }

  const handleBlank = () => {
    onSelect(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 面板内容 */}
      <div className="relative bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">📄</span>
            <h2 className="text-lg font-semibold text-dark-text">选择模板</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 模板列表 */}
        <div className="p-4 grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
          {/* 空白笔记 */}
          <button
            onClick={handleBlank}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-dark-border rounded-xl hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-full bg-dark-bg flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-dark-text">空白笔记</span>
            <span className="text-xs text-dark-muted mt-1">从零开始</span>
          </button>

          {/* 模板卡片 */}
          {NOTE_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleSelect(template)}
              className="flex flex-col items-start p-4 border border-dark-border rounded-xl hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center mb-2">
                <span className="text-lg">{template.icon}</span>
              </div>
              <span className="text-sm font-medium text-dark-text">{template.name}</span>
              <span className="text-xs text-dark-muted mt-1 line-clamp-2">{template.description}</span>
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-5 py-3 bg-dark-bg/50 border-t border-dark-border">
          <p className="text-xs text-dark-muted text-center">
            选择模板快速创建结构化笔记
          </p>
        </div>
      </div>
    </div>
  )
}

export default TemplateSelector
