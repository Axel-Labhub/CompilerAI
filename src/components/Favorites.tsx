/**
 * Favorites 组件
 * 收藏夹面板
 */

import React from 'react'
import type { Note } from '../types'

interface FavoritesProps {
  notes: Note[]
  onNoteClick: (note: Note) => void
  onToggleFavorite: (id: string) => void
  onClose: () => void
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 截取内容预览
function getPreview(content: string, maxLength: number = 60): string {
  if (!content) return '暂无内容'
  const plain = content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, ' ').trim()
  return plain.length <= maxLength ? plain : plain.substring(0, maxLength) + '...'
}

export const Favorites: React.FC<FavoritesProps> = ({ notes, onNoteClick, onToggleFavorite, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 面板内容 */}
      <div className="relative bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <h2 className="text-lg font-semibold text-app-text">收藏夹</h2>
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              {notes.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 笔记列表 */}
        <div className="max-h-96 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-app-muted">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <p className="text-sm">暂无收藏</p>
              <p className="text-xs mt-1">点击笔记卡片上的星标收藏</p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {notes.map(note => (
                <div 
                  key={note.id}
                  className="p-4 hover:bg-app-bg/50 transition-colors cursor-pointer group"
                  onClick={() => {
                    onNoteClick(note)
                    onClose()
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span className="text-sm font-medium text-app-text truncate">
                          {note.title || '无标题笔记'}
                        </span>
                      </div>
                      <p className="text-xs text-app-muted line-clamp-1">
                        {getPreview(note.content)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {note.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="tag text-[10px]">{tag}</span>
                        ))}
                        <span className="text-[10px] text-app-muted">{formatTime(note.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite(note.id)
                      }}
                      className="p-1.5 rounded hover:bg-app-border text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="取消收藏"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-5 py-3 bg-app-bg/50 border-t border-app-border">
          <p className="text-xs text-app-muted text-center">
            收藏的笔记会在这里显示
          </p>
        </div>
      </div>
    </div>
  )
}

export default Favorites
