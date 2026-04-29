/**
 * VersionHistory 组件
 * 版本历史面板
 */

import React from 'react'
import type { NoteVersion } from '../types'
import { useNoteVersions } from '../hooks'

interface VersionHistoryProps {
  noteId: string | null
  noteTitle: string
  onClose: () => void
  onRestore: (note: { title: string; content: string; tags: string[] }) => void
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ noteId, noteTitle, onClose, onRestore }) => {
  const { versions, loading, restoreVersion } = useNoteVersions(noteId)

  const handleRestore = async (version: NoteVersion) => {
    if (confirm('确定要恢复到该版本吗？当前内容将被替换。')) {
      const updated = await restoreVersion(version.id)
      if (updated) {
        onRestore(updated)
        onClose()
      }
    }
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 内容预览
  const getPreview = (content: string) => {
    const plain = content.replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, ' ').trim()
    return plain.length > 80 ? plain.substring(0, 80) + '...' : plain
  }

  if (!noteId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 面板内容 */}
      <div className="relative bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-modal-scale-in">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h2 className="text-lg font-semibold text-app-text">版本历史</h2>
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

        {/* 笔记标题 */}
        <div className="px-5 py-3 bg-app-bg/50 border-b border-app-border">
          <p className="text-sm text-app-muted truncate">{noteTitle || '无标题笔记'}</p>
        </div>

        {/* 版本列表 */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-app-muted">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                加载中...
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-app-muted">
              <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">暂无版本记录</p>
              <p className="text-xs mt-1">保存笔记后会自动记录版本</p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {versions.map((version, index) => (
                <div key={version.id} className="p-4 hover:bg-app-bg/50 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-app-text">
                          {formatTime(version.createdAt)}
                        </span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                            最新
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-app-muted line-clamp-2">
                        {version.title ? `${version.title} - ` : ''}{getPreview(version.content)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestore(version)}
                      className="px-3 py-1.5 text-xs bg-primary-500/20 text-primary-400 rounded hover:bg-primary-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      恢复
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
            最多保留 20 个版本
          </p>
        </div>
      </div>
    </div>
  )
}

export default VersionHistory
