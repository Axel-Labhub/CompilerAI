/**
 * BacklinksPanel 组件
 * 增强版反向链接面板
 * 显示引用当前笔记的所有笔记，支持快速跳转
 */

import React, { useState, useEffect, useCallback } from 'react'
import type { Note, NoteLink } from '../types'
import { getBacklinks, getNote, getAllNotes, extractLinks } from '../lib/db'

interface BacklinksPanelProps {
  noteId: string | null
  noteTitle: string
  onClose: () => void
  onNavigate: (note: Note) => void
}

interface BacklinkItem {
  sourceNote: Note
  linkContext: string  // 链接出现的上下文
  linkPosition: number  // 链接在内容中的位置
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  noteId,
  noteTitle,
  onClose,
  onNavigate,
}) => {
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 加载反向链接
  const loadBacklinks = useCallback(async () => {
    if (!noteId) return

    try {
      setLoading(true)
      const sourceNotes = await getBacklinks(noteId)
      
      // 提取每个源笔记中的链接上下文
      const backlinkItems: BacklinkItem[] = []
      
      for (const sourceNote of sourceNotes) {
        const linkTitles = extractLinks(sourceNote.content)
        const linkIndex = linkTitles.findIndex(
          title => title.toLowerCase() === noteTitle.toLowerCase()
        )
        
        if (linkIndex !== -1) {
          // 提取链接周围的上下文
          const linkRegex = /\[\[([^\]]+)\]\]/g
          let match
          let position = 0
          while ((match = linkRegex.exec(sourceNote.content)) !== null) {
            if (match[1].toLowerCase() === noteTitle.toLowerCase()) {
              position = match.index
              break
            }
          }
          
          // 获取链接前后的文本
          const start = Math.max(0, position - 30)
          const end = Math.min(sourceNote.content.length, position + noteTitle.length + 50)
          let context = sourceNote.content.substring(start, end)
          if (start > 0) context = '...' + context
          if (end < sourceNote.content.length) context = context + '...'
          
          backlinkItems.push({
            sourceNote,
            linkContext: context,
            linkPosition: position,
          })
        }
      }
      
      setBacklinks(backlinkItems)
    } catch (err) {
      console.error('加载反向链接失败:', err)
    } finally {
      setLoading(false)
    }
  }, [noteId, noteTitle])

  useEffect(() => {
    loadBacklinks()
  }, [loadBacklinks])

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // 高亮链接
  const highlightLink = (context: string): React.ReactNode => {
    const parts = context.split(/(\[\[[^\]]+\]\])/g)
    return parts.map((part, i) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const linkTitle = part.slice(2, -2)
        const isMatch = linkTitle.toLowerCase() === noteTitle.toLowerCase()
        return (
          <span
            key={i}
            className={`${isMatch ? 'bg-primary-500/30 text-primary-300' : 'text-blue-400'} px-1 rounded`}
          >
            {part}
          </span>
        )
      }
      return part
    })
  }

  if (!noteId) return null

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
            <span className="text-lg">🔗</span>
            <h2 className="text-lg font-semibold text-dark-text">反向链接</h2>
            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
              {backlinks.length}
            </span>
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

        {/* 当前笔记标题 */}
        <div className="px-5 py-3 bg-dark-bg/50 border-b border-dark-border">
          <p className="text-sm text-dark-muted truncate">
            引用「{noteTitle || '无标题笔记'}」的笔记
          </p>
        </div>

        {/* 反向链接列表 */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-dark-muted">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                加载中...
              </div>
            </div>
          ) : backlinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-dark-muted">
              <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-sm">暂无反向链接</p>
              <p className="text-xs mt-1">在其他笔记中使用 [[{noteTitle || '笔记标题'}]] 引用</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {backlinks.map(({ sourceNote, linkContext }) => (
                <div key={sourceNote.id} className="hover:bg-dark-bg/50 transition-colors">
                  <button
                    onClick={() => onNavigate(sourceNote)}
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-medium text-dark-text truncate">
                            {sourceNote.title || '无标题笔记'}
                          </span>
                          {sourceNote.isFavorite && (
                            <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-dark-muted line-clamp-2 font-mono">
                          {highlightLink(linkContext)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-dark-muted whitespace-nowrap">
                          {formatTime(sourceNote.updatedAt)}
                        </span>
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {/* 标签 */}
                  {sourceNote.tags.length > 0 && (
                    <div className="px-4 pb-3 flex items-center gap-1 flex-wrap">
                      {sourceNote.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="tag text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-5 py-3 bg-dark-bg/50 border-t border-dark-border">
          <p className="text-xs text-dark-muted text-center">
            使用 <code className="px-1 py-0.5 bg-dark-card rounded text-primary-400">[[笔记标题]]</code> 在其他笔记中创建链接
          </p>
        </div>
      </div>
    </div>
  )
}

export default BacklinksPanel
