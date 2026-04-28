/**
 * ExportMenu 组件
 * 导出菜单
 */

import React, { useState, useRef, useEffect } from 'react'
import type { Note, ExportFormat } from '../types'

interface ExportMenuProps {
  note: Note
  onExport: (format: ExportFormat) => void
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ note, onExport }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const exportOptions: { format: ExportFormat; label: string; icon: string; description: string }[] = [
    { format: 'md', label: 'Markdown', icon: '📝', description: '.md 格式，纯文本' },
    { format: 'html', label: 'HTML', icon: '🌐', description: '.html 格式，带样式' },
    { format: 'pdf', label: 'PDF', icon: '📄', description: '通过打印导出' },
  ]

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
        <div className="absolute right-0 top-full mt-2 w-56 bg-app-card border border-app-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-app-border">
            <p className="text-xs text-app-muted">导出笔记</p>
            <p className="text-sm text-app-text truncate">{note.title || '无标题笔记'}</p>
          </div>
          <div className="py-1">
            {exportOptions.map((option) => (
              <button
                key={option.format}
                onClick={() => {
                  onExport(option.format)
                  setIsOpen(false)
                }}
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
        </div>
      )}
    </div>
  )
}

export default ExportMenu
