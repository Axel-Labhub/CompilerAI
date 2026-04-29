/**
 * WeeklyReportModal 组件（优化版）
 * 周报生成器 - 选择笔记并生成周报
 * 使用 BaseModal 进行优化
 */

import React, { useState } from 'react'
import type { Note, WeeklyReport } from '../types'
import { BaseModal } from './BaseModal'
import { aiGenerateWeeklyReport } from '../lib/ai'
import { showToastGlobal } from '../lib/toast'

interface WeeklyReportModalProps {
  notes: Note[]
  onClose: () => void
  onSelectNotes?: (ids: Set<string>) => void
  onToggleNote?: (id: string) => void
  selectedIds: Set<string>
  onSelectAll?: () => void
  onDeselectAll?: () => void
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  notes,
  onClose,
  onSelectNotes,
  onToggleNote,
  selectedIds,
  onSelectAll,
  onDeselectAll,
}) => {
  const [weekRange, setWeekRange] = useState('')
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 获取选中的笔记
  const selectedNotes = notes.filter(n => selectedIds.has(n.id))
  const selectedCount = selectedIds.size

  // 生成周报
  const handleGenerate = async () => {
    if (selectedNotes.length === 0) {
      setError('请至少选择一条笔记')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const result = await aiGenerateWeeklyReport(selectedNotes, weekRange || undefined)
      setReport(result)
      showToastGlobal('周报生成成功！', 'success')
    } catch (err) {
      setError('生成失败，请重试')
      console.error('生成周报失败:', err)
      showToastGlobal('周报生成失败，请重试', 'error')
    } finally {
      setGenerating(false)
    }
  }

  // 复制周报
  const handleCopy = async () => {
    if (!report) return
    
    try {
      await navigator.clipboard.writeText(report.content)
      showToastGlobal('已复制到剪贴板！', 'success')
    } catch (err) {
      console.error('复制失败:', err)
      showToastGlobal('复制失败，请重试', 'error')
    }
  }

  // 下载周报
  const handleDownload = () => {
    if (!report) return
    
    const blob = new Blob([report.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `周报_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToastGlobal('周报下载成功！', 'success')
  }

  // 自定义 Header 图标
  const HeaderIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="生成工作周报"
      description="选择笔记，AI 将帮你整合成专业周报"
      icon={HeaderIcon}
      iconBgClass="bg-green-500/20"
      iconColorClass="text-green-400"
      maxWidth="max-w-4xl"
      className="h-[90vh]"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：笔记选择 */}
        <div className="w-1/2 border-r border-app-border flex flex-col">
          <div className="p-4 border-b border-app-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-app-muted">
                已选择 <span className="text-primary-400 font-medium">{selectedCount}</span> 条笔记
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onSelectAll) onSelectAll()
                    else if (onSelectNotes) onSelectNotes(new Set(notes.map(n => n.id)))
                  }}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  全选
                </button>
                <button
                  onClick={() => {
                    if (onDeselectAll) onDeselectAll()
                    else if (onSelectNotes) onSelectNotes(new Set())
                  }}
                  className="text-xs text-app-muted hover:text-app-text"
                >
                  取消全选
                </button>
              </div>
            </div>
            <input
              type="text"
              value={weekRange}
              onChange={(e) => setWeekRange(e.target.value)}
              placeholder="周报时间范围（如：2024年1月第二周）"
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => {
                  if (onToggleNote) {
                    onToggleNote(note.id)
                  } else if (onSelectNotes) {
                    const newSet = new Set(selectedIds)
                    if (newSet.has(note.id)) {
                      newSet.delete(note.id)
                    } else {
                      newSet.add(note.id)
                    }
                    onSelectNotes(newSet)
                  }
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedIds.has(note.id)
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-app-border hover:border-app-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedIds.has(note.id)
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-app-border'
                  }`}>
                    {selectedIds.has(note.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-app-text truncate">{note.title || '无标题'}</h4>
                    <p className="text-xs text-app-muted mt-1 line-clamp-2">
                      {note.content.substring(0, 100) || '暂无内容'}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {note.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-app-bg rounded text-app-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 生成按钮 */}
          <div className="p-4 border-t border-app-border">
            <button
              onClick={handleGenerate}
              disabled={selectedCount === 0 || generating}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-app-border disabled:text-app-muted text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none"
            >
              {generating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI 整合中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  一键生成周报
                </>
              )}
            </button>
            {error && (
              <p className="text-red-400 text-sm text-center mt-2">{error}</p>
            )}
          </div>
        </div>

        {/* 右侧：周报预览 */}
        <div className="w-1/2 flex flex-col bg-app-bg/50">
          {report ? (
            <>
              <div className="p-4 border-b border-app-border flex items-center justify-between">
                <span className="text-sm text-app-muted">周报预览</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 text-xs bg-app-border hover:bg-app-muted/30 rounded-lg text-app-text transition-colors"
                  >
                    复制
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1 text-xs bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors"
                  >
                    下载
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <pre className="whitespace-pre-wrap text-sm text-app-text font-mono leading-relaxed">
                  {report.content}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-app-muted">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>选择笔记后点击生成</p>
              <p className="text-sm mt-1">AI 将自动整合成专业周报</p>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  )
}

export default WeeklyReportModal
