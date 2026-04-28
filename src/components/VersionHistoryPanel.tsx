/**
 * VersionHistoryPanel 组件
 * 增强版版本历史面板
 * 支持版本比较、版本预览、版本恢复
 */

import React, { useState, useEffect, useCallback } from 'react'
import type { NoteVersion } from '../types'
import { getNoteVersions, restoreVersion } from '../lib/db'

interface VersionHistoryPanelProps {
  noteId: string | null
  noteTitle: string
  onClose: () => void
  onRestore: (note: { title: string; content: string; tags: string[] }) => void
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  noteId,
  noteTitle,
  onClose,
  onRestore,
}) => {
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [previewVersion, setPreviewVersion] = useState<NoteVersion | null>(null)

  // 加载版本历史
  const loadVersions = useCallback(async () => {
    if (!noteId) return

    try {
      setLoading(true)
      const history = await getNoteVersions(noteId)
      setVersions(history)
    } catch (err) {
      console.error('加载版本历史失败:', err)
    } finally {
      setLoading(false)
    }
  }, [noteId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  // 恢复到指定版本
  const handleRestore = async (version: NoteVersion) => {
    if (confirm('确定要恢复到该版本吗？当前内容将被替换。')) {
      const updated = await restoreVersion(version.id)
      if (updated) {
        onRestore(updated)
        onClose()
      }
    }
  }

  // 切换版本选择（比较模式）
  const toggleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      }
      // 最多选择2个版本进行比较
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }

  // 格式化时间
  const formatTime = (timestamp: number): string => {
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

  // 格式化完整时间
  const formatFullTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // 内容预览（纯文本）
  const getPreview = (content: string, maxLength: number = 100): string => {
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

  // 获取版本间的内容差异
  const getDiff = (oldContent: string, newContent: string): { added: number; removed: number } => {
    const oldWords = oldContent.split(/\s+/)
    const newWords = newContent.split(/\s+/)
    
    let added = 0
    let removed = 0
    
    // 简单差异计算
    const oldSet = new Set(oldWords)
    const newSet = new Set(newWords)
    
    newWords.forEach(word => {
      if (!oldSet.has(word)) added++
    })
    
    oldWords.forEach(word => {
      if (!newSet.has(word)) removed++
    })
    
    return { added, removed }
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
      <div className="relative bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h2 className="text-lg font-semibold text-app-text">版本历史</h2>
            <span className="px-2 py-0.5 bg-app-bg rounded text-xs text-app-muted">
              {versions.length} 个版本
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 比较模式切换 */}
            <button
              onClick={() => {
                setCompareMode(!compareMode)
                setSelectedVersions([])
              }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                compareMode
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'hover:bg-app-border text-app-muted hover:text-app-text'
              }`}
            >
              {compareMode ? '退出比较' : '版本比较'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 笔记标题 */}
        <div className="px-5 py-3 bg-app-bg/50 border-b border-app-border flex-shrink-0">
          <p className="text-sm text-app-muted truncate">{noteTitle || '无标题笔记'}</p>
        </div>

        {/* 比较模式提示 */}
        {compareMode && (
          <div className="px-5 py-2 bg-blue-500/10 border-b border-blue-500/20 flex-shrink-0">
            <p className="text-xs text-blue-400">
              选择两个版本进行比较（已选择 {selectedVersions.length}/2）
            </p>
          </div>
        )}

        {/* 版本列表 */}
        <div className="flex-1 overflow-y-auto">
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
            <div className="flex flex-col items-center justify-center py-12 text-app-muted">
              <svg className="w-12 h-12 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">暂无版本记录</p>
              <p className="text-xs mt-1">保存笔记后会自动记录版本</p>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {versions.map((version, index) => {
                const prevVersion = versions[index + 1]
                const diff = prevVersion ? getDiff(prevVersion.content, version.content) : null
                const isSelected = selectedVersions.includes(version.id)

                return (
                  <div
                    key={version.id}
                    className={`p-4 hover:bg-app-bg/50 transition-colors group ${
                      isSelected ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* 选择框（比较模式） */}
                        {compareMode && (
                          <button
                            onClick={() => toggleVersionSelect(version.id)}
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
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
                            {diff && (
                              <span className="text-xs text-app-muted flex items-center gap-1">
                                {diff.added > 0 && (
                                  <span className="text-green-400">+{diff.added}</span>
                                )}
                                {diff.removed > 0 && (
                                  <span className="text-red-400">-{diff.removed}</span>
                                )}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-app-muted line-clamp-2 mb-2">
                            {version.title ? `${version.title} - ` : ''}{getPreview(version.content)}
                          </p>
                          <p className="text-xs text-app-muted/60">
                            {formatFullTime(version.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* 预览按钮 */}
                        <button
                          onClick={() => setPreviewVersion(version)}
                          className="px-3 py-1.5 text-xs bg-app-bg rounded hover:bg-app-border text-app-muted hover:text-app-text transition-colors opacity-0 group-hover:opacity-100"
                        >
                          预览
                        </button>
                        {/* 恢复按钮 */}
                        <button
                          onClick={() => handleRestore(version)}
                          className="px-3 py-1.5 text-xs bg-primary-500/20 text-primary-400 rounded hover:bg-primary-500/30 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          恢复
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-5 py-3 bg-app-bg/50 border-t border-app-border flex-shrink-0">
          <p className="text-xs text-app-muted text-center">
            最多保留 20 个版本 · 自动清理旧版本
          </p>
        </div>
      </div>

      {/* 版本预览弹窗 */}
      {previewVersion && (
        <VersionPreview
          version={previewVersion}
          onClose={() => setPreviewVersion(null)}
          onRestore={() => {
            handleRestore(previewVersion)
            setPreviewVersion(null)
          }}
        />
      )}
    </div>
  )
}

// 版本预览组件
interface VersionPreviewProps {
  version: NoteVersion
  onClose: () => void
  onRestore: () => void
}

const VersionPreview: React.FC<VersionPreviewProps> = ({ version, onClose, onRestore }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">👁️</span>
            <h3 className="font-semibold text-app-text">版本预览</h3>
            <span className="text-xs text-app-muted">
              {new Date(version.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRestore}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
            >
              恢复此版本
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-app-border text-app-muted"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <h1 className="text-xl font-bold text-app-text mb-4">
            {version.title || '无标题笔记'}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            {version.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <pre className="whitespace-pre-wrap text-app-text text-sm font-mono leading-relaxed bg-app-bg p-4 rounded-lg overflow-x-auto">
            {version.content}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default VersionHistoryPanel
