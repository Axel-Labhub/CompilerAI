/**
 * ExportMenu 组件
 * 导出菜单 - 支持 Markdown、HTML、PDF 导出，包含导出选项配置
 */

import React, { useState, useRef, useEffect } from 'react'
import type { Note, ExportFormat, ExportOptions } from '../types'

interface ExportMenuProps {
  note: Note
  onExport: (format: ExportFormat, options: ExportOptions) => void
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ note, onExport }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [pendingFormat, setPendingFormat] = useState<ExportFormat | null>(null)
  const [options, setOptions] = useState<ExportOptions>({
    includeMetadata: true,
    includeCompiledSection: true,
  })
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowOptions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const exportOptions: { format: ExportFormat; label: string; icon: string; description: string }[] = [
    { format: 'md', label: 'Markdown', icon: '📝', description: '.md 格式，纯文本' },
    { format: 'html', label: 'HTML', icon: '🌐', description: '.html 格式，带样式' },
    { format: 'pdf', label: 'PDF', icon: '📄', description: '通过浏览器打印导出' },
  ]

  const handleExportClick = (format: ExportFormat) => {
    // 直接导出，不显示选项（保持简单）
    onExport(format, options)
    setIsOpen(false)
    setShowOptions(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
        title="导出"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-app-card border border-app-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-app-border">
            <p className="text-xs text-app-muted">导出笔记</p>
            <p className="text-sm text-app-text truncate">{note.title || '无标题笔记'}</p>
          </div>

          {/* 导出选项 */}
          {!showOptions && (
            <>
              <div className="px-3 py-2 border-b border-app-border bg-app-bg/50">
                <p className="text-xs text-app-muted mb-2">导出选项</p>
                <label className="flex items-center gap-2 text-sm text-app-text cursor-pointer hover:bg-app-border/30 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={options.includeMetadata}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="w-4 h-4 rounded border-app-border text-primary-500 focus:ring-primary-500"
                  />
                  <span>包含元数据（创建/更新时间、标签）</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-app-text cursor-pointer hover:bg-app-border/30 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={options.includeCompiledSection}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeCompiledSection: e.target.checked }))}
                    className="w-4 h-4 rounded border-app-border text-primary-500 focus:ring-primary-500"
                  />
                  <span>包含编译真相区域</span>
                </label>
              </div>
              <div className="py-1">
                {exportOptions.map((option) => (
                  <button
                    key={option.format}
                    onClick={() => handleExportClick(option.format)}
                    className="w-full px-3 py-2 flex items-start gap-3 hover:bg-app-border/50 transition-colors text-left"
                  >
                    <span className="text-lg">{option.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-app-text">{option.label}</div>
                      <div className="text-xs text-app-muted">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ExportMenu
