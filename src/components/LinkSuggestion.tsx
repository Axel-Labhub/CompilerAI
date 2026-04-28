/**
 * LinkSuggestion 组件
 * 笔记双向链接建议和插入
 * 支持 [[笔记标题]] 语法自动完成
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Note } from '../types'
import { getAllNotes } from '../lib/db'

interface LinkSuggestionProps {
  isOpen: boolean
  position: { top: number; left: number }
  query: string
  notes: Note[]
  onSelect: (noteTitle: string) => void
  onClose: () => void
  onCreateNew?: (title: string) => void
}

export const LinkSuggestion: React.FC<LinkSuggestionProps> = ({
  isOpen,
  position,
  query,
  notes,
  onSelect,
  onClose,
  onCreateNew,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // 过滤匹配的笔记
  const filteredNotes = notes.filter(note => {
    if (!query) return true
    return note.title.toLowerCase().includes(query.toLowerCase())
  })

  // 包含"创建新笔记"选项
  const showCreateOption = query.length > 0 && !notes.some(
    note => note.title.toLowerCase() === query.toLowerCase()
  )

  const totalItems = filteredNotes.length + (showCreateOption ? 1 : 0)

  // 重置选择索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, isOpen])

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex < filteredNotes.length) {
        onSelect(filteredNotes[selectedIndex].title)
      } else if (showCreateOption) {
        onCreateNew?.(query)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      if (filteredNotes.length > 0) {
        onSelect(filteredNotes[selectedIndex % filteredNotes.length].title)
      }
    }
  }, [filteredNotes, selectedIndex, totalItems, showCreateOption, query, onSelect, onCreateNew, onClose])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen || totalItems === 0) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-app-card border border-app-border rounded-lg shadow-xl overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        minWidth: '200px',
        maxWidth: '300px',
      }}
    >
      {/* 标题 */}
      <div className="px-3 py-2 border-b border-app-border bg-app-bg/50 text-xs text-app-muted">
        链接到笔记
      </div>

      {/* 笔记列表 */}
      <div className="max-h-60 overflow-y-auto py-1">
        {filteredNotes.slice(0, 8).map((note, index) => (
          <button
            key={note.id}
            onClick={() => onSelect(note.title)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-app-bg transition-colors ${
              index === selectedIndex ? 'bg-app-bg' : ''
            }`}
          >
            <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm text-app-text truncate flex-1">
              {highlightMatch(note.title || '无标题笔记', query)}
            </span>
            {note.isFavorite && (
              <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
        ))}

        {/* 创建新笔记选项 */}
        {showCreateOption && (
          <button
            onClick={() => onCreateNew?.(query)}
            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-app-bg transition-colors ${
              selectedIndex === filteredNotes.length ? 'bg-app-bg' : ''
            }`}
          >
            <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-green-400">
              创建「{query}」
            </span>
          </button>
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-app-border bg-app-bg/50 text-xs text-app-muted flex items-center gap-2">
        <kbd className="px-1 py-0.5 bg-app-card rounded">Tab</kbd>
        <span>插入</span>
        <span className="mx-2">·</span>
        <kbd className="px-1 py-0.5 bg-app-card rounded">Enter</kbd>
        <span>选择</span>
      </div>
    </div>
  )
}

// 高亮匹配文本
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-primary-500/30 text-primary-300 rounded px-0.5">{part}</mark>
      : part
  )
}

export default LinkSuggestion
