/**
 * NoteEditor 组件（优化版）
 * 笔记编辑器 - 支持 Markdown 编辑和预览，包含所有优化功能
 * 集成编译真相架构：结论区 + 记录区
 * 
 * 代码优化：
 * - 抽取 MarkdownToolbar 相关逻辑到 useMarkdownToolbar hook
 * - 抽取 Backlinks 相关逻辑到 useBacklinks hook  
 * - 抽取自动保存逻辑到 useAutoSave hook
 * - 使用 ErrorBoundary 包裹潜在出错区域
 * - 支持拖拽排序标签
 * - 增加字数统计和阅读时间估算
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Note, SlashCommand, ExportFormat, ExportOptions, CompiledSection } from '../types'
import { aiCleanText, aiSuggestTags } from '../lib/ai'
import { compileNote } from '../lib/compiler'
import { showToastGlobal } from '../lib/toast'

// 新增组件导入
import MarkdownToolbar from './MarkdownToolbar'
import TagInput from './TagInput'
import SaveStatusIndicator from './SaveStatusIndicator'
import { AIProcessingIndicator } from './SkeletonLoader'
import SlashCommandMenu from './SlashCommandMenu'
import Backlinks from './Backlinks'
import ExportMenu from './ExportMenu'
import VersionHistory from './VersionHistory'
import NoteCompiledSection from './NoteCompiledSection'
import { ErrorBoundary } from './ErrorBoundary'
import { useNoteLinks, useMarkdownToolbar, useManualSave } from '../hooks'
import { useAutoSave } from '../hooks/useAutoSave'

interface NoteEditorProps {
  note: Note | null
  onSave: (title: string, content: string, tags: string[], compiledSection?: CompiledSection | null) => Promise<void>
  onClose: () => void
  onPreview: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  saveStatus: 'saved' | 'saving' | 'unsaved'
  lastSavedAt: Date | null
  onToggleFavorite?: () => void
  onExport?: (format: ExportFormat, options: ExportOptions) => void
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onClose,
  onPreview,
  isFullscreen,
  onToggleFullscreen,
  saveStatus,
  lastSavedAt,
  onToggleFavorite,
  onExport,
}) => {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [tags, setTags] = useState<string[]>(note?.tags || [])
  const [compiledSection, setCompiledSection] = useState<CompiledSection | null | undefined>(note?.compiledSection)
  
  // 状态
  const [saving, setSaving] = useState(false)
  
  // AI 功能状态
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [aiMode, setAiMode] = useState<'clean' | 'tags' | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)
  
  // 编译状态
  const [isCompiling, setIsCompiling] = useState(false)
  
  // 斜杠命令菜单状态
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  
  // 版本历史
  const [_showVersionHistory, setShowVersionHistory] = useState(false)
  
  // 反向链接
  const { backlinks } = useNoteLinks(note?.id || null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 字数和阅读时间统计
  const stats = useMemo(() => {
    const charCount = content.length
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
    const lineCount = content.split('\n').length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)) // 假设每分钟阅读200字
    return { charCount, wordCount, lineCount, readingTime }
  }, [content])

  // ========== 使用拆分后的 Hooks ==========

  // Markdown 工具栏 hook
  const { handleInsert, handleSlashCommand } = useMarkdownToolbar({
    textareaRef,
    content,
    setContent,
  })

  // 保存函数
  const handleSaveAction = useCallback(async () => {
    if (!title.trim()) return
    
    try {
      setSaving(true)
      await onSave(title.trim(), content, tags, compiledSection)
    } catch (err) {
      console.error('保存失败:', err)
    } finally {
      setSaving(false)
    }
  }, [title, content, tags, compiledSection, onSave])

  // 手动保存快捷键
  useManualSave({
    onSave: handleSaveAction,
    enabled: true,
  })

  // 自动保存（优化版，使用新的 useAutoSave hook）
  const { triggerSave } = useAutoSave({
    enabled: true,
    delay: 2000,
    onSave: handleSaveAction,
    dependencies: [title, content, tags],
  })

  // 初始化
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTags(note.tags)
      setCompiledSection(note.compiledSection)
    } else {
      setTitle('')
      setContent('')
      setTags([])
      setCompiledSection(null)
    }
    setAiResult(null)
  }, [note?.id])

  // 监听全局快捷键事件（来自 App.tsx）
  useEffect(() => {
    // 保存事件
    const handleEditorSave = () => {
      handleSaveAction()
      showToastGlobal('笔记已保存', 'success')
    }

    // AI 清洗事件 - 使用事件派发代替直接调用
    const handleAICleanEvent = () => {
      if (!content.trim()) {
        showToastGlobal('请先输入内容', 'info')
        return
      }
      showToastGlobal('正在清洗内容...', 'info')
      window.dispatchEvent(new CustomEvent('note-editor-ai-clean'))
    }

    // AI 编译事件
    const handleAICompileEvent = () => {
      if (!title.trim() && !content.trim()) {
        showToastGlobal('请先输入标题或内容', 'info')
        return
      }
      showToastGlobal('正在编译真相...', 'info')
      window.dispatchEvent(new CustomEvent('note-editor-ai-compile'))
    }

    window.addEventListener('editor-save', handleEditorSave)
    window.addEventListener('ai-clean', handleAICleanEvent)
    window.addEventListener('ai-compile', handleAICompileEvent)

    return () => {
      window.removeEventListener('editor-save', handleEditorSave)
      window.removeEventListener('ai-clean', handleAICleanEvent)
      window.removeEventListener('ai-compile', handleAICompileEvent)
    }
  }, [handleSaveAction, content, title])

  // Tab 插入
  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
  }

  // 检测斜杠命令
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    
    // 检测 / 命令
    const textarea = e.target
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = newContent.substring(0, cursorPos)
    const lines = textBeforeCursor.split('\n')
    const lineContent = lines[lines.length - 1]
    
    // 如果当前行以 / 开头，显示命令菜单
    if (lineContent.startsWith('/') && !showSlashMenu) {
      const rect = textarea.getBoundingClientRect()
      setSlashMenuPosition({
        top: rect.top + (lines.length * 24) + 40,
        left: rect.left + 20,
      })
      setShowSlashMenu(true)
    } else if (!lineContent.startsWith('/') && showSlashMenu) {
      setShowSlashMenu(false)
    }
  }

  // AI 清洗
  const handleAIClean = async () => {
    if (!content.trim()) return
    
    setAiMode('clean')
    setAiProcessing(true)
    setAiResult(null)
    
    try {
      const cleaned = await aiCleanText(content)
      setAiResult(cleaned)
      showToastGlobal('AI 清洗完成，可预览结果', 'success')
    } catch (err) {
      console.error('AI 清洗失败:', err)
      showToastGlobal('AI 清洗失败，请重试', 'error')
    } finally {
      setAiProcessing(false)
    }
  }

  // AI 生成标签
  const handleAITags = async () => {
    if (!title.trim() && !content.trim()) return
    
    setAiMode('tags')
    setAiProcessing(true)
    setAiResult(null)
    
    try {
      const suggestions = await aiSuggestTags(title, content)
      setAiResult(suggestions.map(s => s.tag).join(', '))
    } catch (err) {
      console.error('AI 标签生成失败:', err)
    } finally {
      setAiProcessing(false)
    }
  }

  // 应用 AI 结果
  const applyAiResult = () => {
    if (!aiResult) return
    
    if (aiMode === 'clean') {
      setContent(aiResult)
    } else if (aiMode === 'tags') {
      const newTags = aiResult.split(',').map(t => t.trim()).filter(t => t)
      setTags([...new Set([...tags, ...newTags])])
    }
    setShowAiPanel(false)
    setAiResult(null)
  }

  // 编译笔记
  const handleCompile = async () => {
    if (!title.trim() && !content.trim()) return
    
    setIsCompiling(true)
    try {
      const result = await compileNote(title || '无标题笔记', content)
      setCompiledSection(result)
      showToastGlobal('编译完成，已生成结论区', 'success')
    } catch (err) {
      console.error('编译失败:', err)
      showToastGlobal('编译失败，请重试', 'error')
    } finally {
      setIsCompiling(false)
    }
  }

  // 监听内部 AI 事件（由快捷键事件触发）
  useEffect(() => {
    const handleInternalAIClean = () => handleAIClean()
    const handleInternalAICompile = () => handleCompile()

    window.addEventListener('note-editor-ai-clean', handleInternalAIClean)
    window.addEventListener('note-editor-ai-compile', handleInternalAICompile)

    return () => {
      window.removeEventListener('note-editor-ai-clean', handleInternalAIClean)
      window.removeEventListener('note-editor-ai-compile', handleInternalAICompile)
    }
  }, [handleAIClean, handleCompile])

  // 更新编译结论
  const handleUpdateSummary = (summary: string) => {
    if (compiledSection) {
      setCompiledSection({
        ...compiledSection,
        summary,
        isManualEdit: true,
        lastCompiled: Date.now(),
      })
    }
  }

  // 更新关键洞察
  const handleUpdateInsights = (insights: string[]) => {
    if (compiledSection) {
      setCompiledSection({
        ...compiledSection,
        insights,
        isManualEdit: true,
        lastCompiled: Date.now(),
      })
    }
  }

  // 处理导出
  const handleExport = (format: ExportFormat, options: ExportOptions) => {
    if (note && onExport) {
      onExport(format, options)
    }
  }

  return (
    <ErrorBoundary
      fallback={(error, _errorInfo) => (
        <div className="flex items-center justify-center h-full bg-red-950/20">
          <div className="text-center p-6">
            <p className="text-red-400 mb-2">编辑器加载失败</p>
            <button onClick={() => window.location.reload()} className="text-primary-400 hover:text-primary-300">
              重试
            </button>
          </div>
        </div>
      )}
    >
      <div className={`flex flex-col h-full bg-app-bg ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* 工具栏 */}
        <div className="h-12 bg-app-card border-b border-app-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {/* 返回按钮 */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            {/* 标题输入 */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="笔记标题..."
              className="bg-transparent border-none text-lg font-medium text-app-text placeholder-app-muted focus:outline-none w-64"
            />

            {/* 保存状态 */}
            <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
          </div>

          <div className="flex items-center gap-1">
            {/* 收藏按钮 */}
            {note && note.id && onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={`p-2 rounded-lg transition-colors ${
                  note.isFavorite
                    ? 'text-yellow-400 hover:text-yellow-300'
                    : 'text-app-muted hover:text-app-text hover:bg-app-border'
                }`}
                title={note.isFavorite ? '取消收藏' : '收藏'}
              >
                <svg className="w-5 h-5" fill={note.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            )}

            {/* 版本历史 */}
            {note && note.id && (
              <button
                onClick={() => setShowVersionHistory(true)}
                className="p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
                title="版本历史"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}

            {/* 导出 */}
            {note && note.id && onExport && (
              <ExportMenu note={note} onExport={handleExport} />
            )}

            {/* AI 功能 */}
            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all duration-200 hover:scale-105 ${
                showAiPanel 
                  ? 'bg-gradient-to-r from-primary-500 to-indigo-500 text-white shadow-lg shadow-primary-500/30' 
                  : 'bg-gradient-to-r from-primary-500/20 to-indigo-500/20 text-primary-400 hover:from-primary-500/30 hover:to-indigo-500/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI
            </button>

            {/* 预览 */}
            <button
              onClick={onPreview}
              className="px-3 py-1.5 rounded-lg text-sm hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
            >
              预览
            </button>

            {/* 全屏切换 */}
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>

            {/* 保存按钮 */}
            <button
              onClick={handleSaveAction}
              disabled={!title.trim() || saving}
              className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 disabled:from-app-border disabled:to-app-border disabled:text-app-muted text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              保存
            </button>
          </div>
        </div>

        {/* Markdown 工具栏 */}
        <MarkdownToolbar onInsert={handleInsert} disabled={saving} />

        {/* AI 面板 */}
        {showAiPanel && (
          <ErrorBoundary>
            <div className="relative border-b border-app-border overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-purple-500/5 to-primary-500/5" />
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
              
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-primary-400 uppercase tracking-wider">AI 智能助手</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAIClean}
                      disabled={aiProcessing || !content.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-400 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:scale-[0.98] border border-emerald-500/30"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">✨</span>
                        <span>一键清洗</span>
                      </span>
                    </button>
                    <button
                      onClick={handleAITags}
                      disabled={aiProcessing || (!title.trim() && !content.trim())}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5 active:scale-[0.98] border border-purple-500/30"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">🏷️</span>
                        <span>智能标签</span>
                      </span>
                    </button>
                  </div>

                  {aiProcessing && (
                    <AIProcessingIndicator message={aiMode === 'clean' ? '正在清洗内容...' : '正在生成标签...'} />
                  )}

                  {aiResult && !aiProcessing && (
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 px-4 py-2.5 bg-app-bg rounded-xl text-sm text-app-muted border border-app-border/50">
                        <span className="text-primary-400 mr-2">✨</span>
                        {aiResult.length > 120 ? aiResult.substring(0, 120) + '...' : aiResult}
                      </div>
                      <button
                        onClick={applyAiResult}
                        className="px-4 py-2 bg-gradient-to-r from-primary-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                      >
                        应用
                      </button>
                      <button
                        onClick={() => setAiResult(null)}
                        className="p-2 hover:bg-app-border rounded-lg text-app-muted hover:text-app-text transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* 标签栏 */}
        <div className="px-4 py-2 border-b border-app-border bg-app-card/30">
          <TagInput tags={tags} onChange={setTags} disabled={saving} />
        </div>

        {/* 编译真相区 - 结论区 */}
        <NoteCompiledSection
          compiled={compiledSection}
          onCompile={handleCompile}
          onUpdateSummary={handleUpdateSummary}
          onUpdateInsights={handleUpdateInsights}
          isCompiling={isCompiling}
        />

        {/* 编辑区域 */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Markdown 输入 */}
          <div className="flex-1 p-4">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleTab}
              placeholder="开始书写你的笔记...

支持 Markdown 语法：
# 标题
## 二级标题
**粗体** *斜体*
- 列表项
1. 有序列表
`代码`

输入 / 触发快捷命令"
              className="w-full h-full bg-transparent border-none resize-none text-app-text placeholder-app-muted focus:outline-none font-mono text-sm leading-relaxed"
            />
          </div>

          {/* 预览面板 */}
          <div className="w-px bg-app-border" />
          <div className="flex-1 p-4 overflow-y-auto bg-app-card/30">
            <div className="markdown-preview">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-app-muted italic">预览区域</p>
              )}
            </div>
            
            {/* 反向链接 */}
            {note && note.id && backlinks.length > 0 && (
              <Backlinks backlinks={backlinks} onClickNote={() => {}} />
            )}
          </div>

          {/* 斜杠命令菜单 */}
          <SlashCommandMenu
            isOpen={showSlashMenu}
            position={slashMenuPosition}
            onSelect={handleSlashCommand}
            onClose={() => setShowSlashMenu(false)}
          />
        </div>

        {/* 底部状态栏 */}
        <div className="h-8 bg-app-card border-t border-app-border flex items-center justify-between px-4 text-xs text-app-muted">
          <div className="flex items-center gap-4">
            <span>Markdown 编辑器</span>
            <span>|</span>
            <span className="hidden sm:inline">行数: {stats.lineCount}</span>
            <span className="hidden sm:inline">|</span>
            <span>字符: {stats.charCount}</span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">字数: {stats.wordCount}</span>
            <span className="hidden lg:inline">|</span>
            <span className="hidden lg:inline">阅读时间: ~{stats.readingTime}分钟</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-app-bg rounded text-xs">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-app-bg rounded text-xs">S</kbd>
            <span>保存</span>
            <span className="mx-2">·</span>
            <kbd className="px-1.5 py-0.5 bg-app-bg rounded text-xs">/</kbd>
            <span>命令</span>
          </div>
        </div>

        {/* 版本历史面板 */}
        {_showVersionHistory && (
          <VersionHistory
            noteId={note?.id || null}
            noteTitle={title}
            onClose={() => setShowVersionHistory(false)}
            onRestore={(restoredNote) => {
              setTitle(restoredNote.title)
              setContent(restoredNote.content)
              setTags(restoredNote.tags)
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default NoteEditor
