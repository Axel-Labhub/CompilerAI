/**
 * NoteList 组件
 * 笔记列表展示，支持收藏夹模式
 */

import React from 'react'
import type { Note } from '../types'
import { NoteListSkeleton } from './SkeletonLoader'

interface NoteListProps {
  notes: Note[]
  loading: boolean
  onNoteClick: (note: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleFavorite?: (id: string) => void
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  selectable?: boolean
  searchQuery?: string
  mode?: 'normal' | 'favorites'  // 模式：普通列表或收藏夹
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1分钟
  if (diff < 60000) return '刚刚'
  
  // 小于1小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  
  // 小于24小时
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  
  // 小于7天
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  
  // 超过7天显示日期
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 截取内容预览
function getPreview(content: string, maxLength: number = 80): string {
  if (!content) return '暂无内容'
  
  // 移除 markdown 语法
  const plain = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n/g, ' ')
    .trim()
  
  if (plain.length <= maxLength) return plain
  return plain.substring(0, maxLength) + '...'
}

// 高亮搜索关键词
function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5">{part}</mark>
      : part
  )
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  loading,
  onNoteClick,
  onDelete,
  onTogglePin,
  onToggleFavorite,
  selectedIds = new Set(),
  onToggleSelect,
  selectable = false,
  searchQuery = '',
  mode = 'normal',
}) => {
  // 空状态
  if (!loading && notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-app-muted p-8">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg mb-2">
          {mode === 'favorites' ? '暂无收藏' : '暂无笔记'}
        </p>
        <p className="text-sm">
          {mode === 'favorites' ? '点击笔记卡片上的星标收藏' : '点击左侧「新建笔记」开始记录'}
        </p>
      </div>
    )
  }

  // 加载状态
  if (loading) {
    return <NoteListSkeleton count={5} />
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2">
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onClick={() => onNoteClick(note)}
            onDelete={() => onDelete(note.id)}
            onTogglePin={() => onTogglePin(note.id)}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(note.id) : undefined}
            isSelected={selectedIds.has(note.id)}
            onToggleSelect={selectable ? () => onToggleSelect?.(note.id) : undefined}
            searchQuery={searchQuery}
            showFavoriteButton={mode === 'normal'}
          />
        ))}
      </div>
    </div>
  )
}

// 单个笔记卡片
interface NoteCardProps {
  note: Note
  onClick: () => void
  onDelete: () => void
  onTogglePin: () => void
  onToggleFavorite?: () => void
  isSelected?: boolean
  onToggleSelect?: () => void
  searchQuery?: string
  showFavoriteButton?: boolean
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  onDelete,
  onTogglePin,
  onToggleFavorite,
  isSelected = false,
  onToggleSelect,
  searchQuery = '',
  showFavoriteButton = true,
}) => {
  const [showMenu, setShowMenu] = React.useState(false)

  // 点击复选框阻止冒泡
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleSelect?.()
  }

  return (
    <div
      className={`group relative bg-app-card border rounded-lg p-4 cursor-pointer transition-all hover:border-primary-500/50 ${
        isSelected ? 'border-primary-500 bg-primary-500/10' : 'border-app-border'
      } ${note.isPinned ? 'border-l-2 border-l-yellow-500' : ''}`}
      onClick={onClick}
    >
      {/* 收藏标识 */}
      {note.isFavorite && (
        <div className="absolute top-2 right-2">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
      )}

      {/* 选择框（可选模式） */}
      {onToggleSelect && (
        <button
          onClick={handleCheckboxClick}
          className={`absolute -left-1 top-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary-500 border-primary-500'
              : 'border-app-border group-hover:border-app-muted'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      )}

      {/* 置顶标识 */}
      {note.isPinned && (
        <div className="absolute -top-px right-3 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-b">
          📌 置顶
        </div>
      )}

      {/* 标题 */}
      <h3 className="font-medium text-app-text mb-1 pr-12 group-hover:text-primary-400 transition-colors">
        {searchQuery ? highlightText(note.title || '无标题笔记', searchQuery) : note.title || '无标题笔记'}
      </h3>

      {/* 内容预览 */}
      <p className="text-sm text-app-muted mb-2 line-clamp-2">
        {searchQuery ? highlightText(getPreview(note.content), searchQuery) : getPreview(note.content)}
      </p>

      {/* 底部信息 */}
      <div className="flex items-center justify-between">
        {/* 标签 */}
        <div className="flex items-center gap-1 flex-wrap">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">
              {searchQuery ? highlightText(tag, searchQuery) : tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs text-app-muted">+{note.tags.length - 3}</span>
          )}
        </div>

        {/* 时间 */}
        <span className="text-xs text-app-muted">
          {formatTime(note.updatedAt)}
        </span>
      </div>

      {/* 操作菜单 */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-1 rounded hover:bg-app-border text-app-muted hover:text-app-text"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 bg-app-bg border border-app-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTogglePin()
                setShowMenu(false)
              }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-app-border flex items-center gap-2"
            >
              {note.isPinned ? '取消置顶' : '置顶'}
            </button>
            {showFavoriteButton && onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                  setShowMenu(false)
                }}
                className="w-full px-3 py-1.5 text-sm text-left hover:bg-app-border flex items-center gap-2"
              >
                {note.isFavorite ? '取消收藏' : '收藏'}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
                setShowMenu(false)
              }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-app-border text-red-400 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NoteList
