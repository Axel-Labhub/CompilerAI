/**
 * 自定义 Hooks
 * 提供笔记管理、AI 功能等业务逻辑的 React 封装
 */

import { useState, useEffect, useCallback } from 'react'
import type { Note, TagSuggestion, WeeklyReport, NoteVersion, SearchFilters, Theme, ViewMode, ExportOptions } from '../types'
import * as db from '../lib/db'
import { aiCleanText, aiSuggestTags, aiGenerateWeeklyReport } from '../lib/ai'
import { downloadMarkdown, downloadHTML, downloadPDF, defaultExportOptions } from '../lib/export'

// ==================== 主题 Hook ====================

/**
 * 主题管理 Hook
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme
    return saved || 'dark'
  })

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // 应用主题到 html 元素
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // system
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  // 初始化主题
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}

// ==================== 笔记管理 Hook ====================

/**
 * 笔记管理 Hook
 * 提供笔记的增删改查、搜索、筛选等功能
 */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载所有笔记
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      const allNotes = await db.getAllNotes()
      setNotes(allNotes)
      setError(null)
    } catch (err) {
      setError('加载笔记失败')
      console.error('加载笔记失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 初始化加载
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // 创建笔记
  const createNote = useCallback(async (title: string, content: string = '', tags: string[] = []) => {
    try {
      const newNote = await db.createNote({
        title,
        content,
        tags,
        isPinned: false,
        isFavorite: false,
      })
      setNotes(prev => [newNote, ...prev])
      return newNote
    } catch (err) {
      setError('创建笔记失败')
      console.error('创建笔记失败:', err)
      return null
    }
  }, [])

  // 更新笔记
  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    try {
      const updated = await db.updateNote(id, updates)
      if (updated) {
        setNotes(prev => prev.map(n => n.id === id ? updated : n))
      }
      return updated
    } catch (err) {
      setError('更新笔记失败')
      console.error('更新笔记失败:', err)
      return null
    }
  }, [])

  // 删除笔记
  const deleteNote = useCallback(async (id: string) => {
    try {
      await db.deleteNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
      return true
    } catch (err) {
      setError('删除笔记失败')
      console.error('删除笔记失败:', err)
      return false
    }
  }, [])

  // 切换置顶状态
  const togglePin = useCallback(async (id: string) => {
    try {
      const updated = await db.togglePinNote(id)
      if (updated) {
        setNotes(prev => prev.map(n => n.id === id ? updated : n))
      }
      return updated
    } catch (err) {
      setError('切换置顶失败')
      console.error('切换置顶失败:', err)
      return null
    }
  }, [])

  // 切换收藏状态
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const updated = await db.toggleFavoriteNote(id)
      if (updated) {
        setNotes(prev => prev.map(n => n.id === id ? updated : n))
      }
      return updated
    } catch (err) {
      setError('切换收藏失败')
      console.error('切换收藏失败:', err)
      return null
    }
  }, [])

  // 搜索笔记
  const searchNotes = useCallback(async (query: string) => {
    if (!query.trim()) {
      await loadNotes()
      return
    }
    try {
      const results = await db.searchNotes(query)
      setNotes(results)
    } catch (err) {
      setError('搜索失败')
      console.error('搜索失败:', err)
    }
  }, [loadNotes])

  // 按标签筛选
  const filterByTag = useCallback(async (tag: string | null) => {
    if (!tag) {
      await loadNotes()
      return
    }
    try {
      const results = await db.getNotesByTag(tag)
      setNotes(results)
    } catch (err) {
      setError('筛选失败')
      console.error('筛选失败:', err)
    }
  }, [loadNotes])

  // 高级搜索
  const advancedSearchNotes = useCallback(async (filters: SearchFilters & { query?: string; favoritesOnly?: boolean }) => {
    try {
      const results = await db.advancedSearch(filters)
      setNotes(results)
    } catch (err) {
      setError('高级搜索失败')
      console.error('高级搜索失败:', err)
    }
  }, [])

  // 获取单个笔记
  const getNote = useCallback(async (id: string) => {
    return db.getNote(id)
  }, [])

  // 加载收藏笔记
  const loadFavorites = useCallback(async () => {
    try {
      const favorites = await db.getFavoriteNotes()
      return favorites
    } catch (err) {
      console.error('加载收藏失败:', err)
      return []
    }
  }, [])

  return {
    notes,
    loading,
    error,
    loadNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleFavorite,
    searchNotes,
    filterByTag,
    advancedSearchNotes,
    getNote,
    loadFavorites,
  }
}

// ==================== AI 功能 Hook ====================

/**
 * AI 功能 Hook
 * 提供 AI 清洗、标签生成、周报生成等功能
 */
export function useAIFeatures() {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [tags, setTags] = useState<TagSuggestion[]>([])
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  // AI 清洗文本
  const cleanText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('请输入要清洗的文本')
      return null
    }

    try {
      setProcessing(true)
      setError(null)
      const cleaned = await aiCleanText(text)
      setResult(cleaned)
      return cleaned
    } catch (err) {
      setError('清洗失败，请重试')
      console.error('清洗失败:', err)
      return null
    } finally {
      setProcessing(false)
    }
  }, [])

  // AI 生成标签
  const suggestTags = useCallback(async (title: string, content: string) => {
    if (!title.trim() && !content.trim()) {
      setError('请输入标题或内容')
      return []
    }

    try {
      setProcessing(true)
      setError(null)
      const suggestions = await aiSuggestTags(title, content)
      setTags(suggestions)
      return suggestions
    } catch (err) {
      setError('标签生成失败，请重试')
      console.error('标签生成失败:', err)
      return []
    } finally {
      setProcessing(false)
    }
  }, [])

  // AI 生成周报
  const generateReport = useCallback(async (notes: Note[], weekRange?: string) => {
    if (notes.length === 0) {
      setError('请选择至少一条笔记')
      return null
    }

    try {
      setProcessing(true)
      setError(null)
      const report = await aiGenerateWeeklyReport(notes, weekRange)
      setWeeklyReport(report)
      return report
    } catch (err) {
      setError('周报生成失败，请重试')
      console.error('周报生成失败:', err)
      return null
    } finally {
      setProcessing(false)
    }
  }, [])

  // 清空结果
  const clearResults = useCallback(() => {
    setResult(null)
    setTags([])
    setWeeklyReport(null)
    setError(null)
  }, [])

  return {
    processing,
    result,
    tags,
    weeklyReport,
    error,
    cleanText,
    suggestTags,
    generateReport,
    clearResults,
  }
}

// ==================== 编辑器 Hook ====================

/**
 * 编辑器状态 Hook
 * 管理当前编辑的笔记、视图模式等
 */
export function useEditor() {
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // 打开笔记进行编辑
  const openNote = useCallback((note: Note) => {
    setCurrentNote(note)
    setViewMode('editor')
    setIsDirty(false)
    setSaveStatus('saved')
  }, [])

  // 创建新笔记（可选模板）
  const createNew = useCallback((templateContent?: string) => {
    setCurrentNote({
      id: '',
      title: '',
      content: templateContent || '',
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPinned: false,
      isFavorite: false,
    } as Note)
    setViewMode('editor')
    setIsDirty(false)
    setSaveStatus('unsaved')
  }, [])

  // 关闭编辑器
  const closeEditor = useCallback(() => {
    setCurrentNote(null)
    setViewMode('list')
    setIsFullscreen(false)
    setIsDirty(false)
    setSaveStatus('saved')
  }, [])

  // 预览模式
  const preview = useCallback(() => {
    setViewMode('preview')
  }, [])

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  // 标记为已修改
  const markDirty = useCallback(() => {
    setIsDirty(true)
    setSaveStatus('unsaved')
  }, [])

  // 标记为保存中
  const markSaving = useCallback(() => {
    setSaveStatus('saving')
  }, [])

  // 标记为已保存
  const markSaved = useCallback(() => {
    setIsDirty(false)
    setSaveStatus('saved')
    setLastSavedAt(new Date())
  }, [])

  return {
    currentNote,
    viewMode,
    isFullscreen,
    isDirty,
    saveStatus,
    lastSavedAt,
    openNote,
    createNew,
    closeEditor,
    preview,
    toggleFullscreen,
    markDirty,
    markSaving,
    markSaved,
    setCurrentNote,
    setViewMode,
  }
}

// ==================== 版本历史 Hook ====================

/**
 * 版本历史 Hook
 */
export function useNoteVersions(noteId: string | null) {
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [loading, setLoading] = useState(false)

  // 加载版本历史
  const loadVersions = useCallback(async () => {
    if (!noteId) return
    
    try {
      setLoading(true)
      const history = await db.getNoteVersions(noteId)
      setVersions(history)
    } catch (err) {
      console.error('加载版本历史失败:', err)
    } finally {
      setLoading(false)
    }
  }, [noteId])

  // 初始化加载
  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  // 恢复到指定版本
  const restoreVersion = useCallback(async (versionId: string): Promise<Note | undefined> => {
    try {
      const note = await db.restoreVersion(versionId)
      await loadVersions()  // 刷新版本列表
      return note
    } catch (err) {
      console.error('恢复版本失败:', err)
      return undefined
    }
  }, [loadVersions])

  return { versions, loading, loadVersions, restoreVersion }
}

// ==================== 双向链接 Hook ====================

/**
 * 双向链接 Hook
 */
export function useNoteLinks(noteId: string | null) {
  const [backlinks, setBacklinks] = useState<Note[]>([])
  const [outgoingLinks, setOutgoingLinks] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)

  // 加载链接关系
  const loadLinks = useCallback(async () => {
    if (!noteId) return

    try {
      setLoading(true)
      
      // 获取反向链接（引用了此笔记的笔记）
      const backlinksList = await db.getBacklinks(noteId)
      setBacklinks(backlinksList)
    } catch (err) {
      console.error('加载链接失败:', err)
    } finally {
      setLoading(false)
    }
  }, [noteId])

  // 初始化加载
  useEffect(() => {
    loadLinks()
  }, [loadLinks])

  // 解析内容中的链接
  const resolveContentLinks = useCallback(async (content: string): Promise<Note[]> => {
    try {
      const notes = await db.resolveLinks(content)
      setOutgoingLinks(notes)
      return notes
    } catch (err) {
      console.error('解析链接失败:', err)
      return []
    }
  }, [])

  return { backlinks, outgoingLinks, loading, loadLinks, resolveContentLinks }
}

// ==================== 导出 Hook ====================

/**
 * 导出功能 Hook
 */
export function useExport() {
  // 导出为 Markdown
  const exportAsMarkdown = useCallback((note: Note, options: ExportOptions = defaultExportOptions) => {
    downloadMarkdown(note, options)
  }, [])

  // 导出为 HTML
  const exportAsHTML = useCallback((note: Note, options: ExportOptions = defaultExportOptions) => {
    downloadHTML(note, options)
  }, [])

  // 导出为 PDF（使用打印功能）
  const exportAsPDF = useCallback((note: Note, options: ExportOptions = defaultExportOptions) => {
    downloadPDF(note, options)
  }, [])

  return { exportAsMarkdown, exportAsHTML, exportAsPDF }
}

// ==================== 快捷键 Hook ====================
// 已迁移到独立的 useKeyboardShortcuts.ts 文件
// 从独立文件导入以支持更丰富的功能

// ==================== 周报选择 Hook ====================

/**
 * 周报选择 Hook
 */
export function useWeeklyReportSelection(initialNotes: Note[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showGenerator, setShowGenerator] = useState(false)

  const selectedCount = selectedIds.size

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(initialNotes.map(n => n.id)))
  }, [initialNotes])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const getSelectedNotes = useCallback(() => {
    return initialNotes.filter(n => selectedIds.has(n.id))
  }, [initialNotes, selectedIds])

  const openGenerator = useCallback(() => {
    setShowGenerator(true)
  }, [])

  const closeGenerator = useCallback(() => {
    setShowGenerator(false)
  }, [])

  return {
    selectedIds,
    selectedCount,
    showGenerator,
    toggleSelection,
    selectAll,
    deselectAll,
    getSelectedNotes,
    openGenerator,
    closeGenerator,
  }
}

// ==================== 高级搜索 Hook ====================

/**
 * 高级搜索 Hook
 */
export function useAdvancedSearch() {
  const [results, setResults] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<{
    dateRange?: { start: number; end: number }
    tags?: string[]
    favoritesOnly?: boolean
  }>({})

  const search = useCallback(async (searchQuery: string, searchFilters?: typeof filters) => {
    setLoading(true)
    try {
      const allNotes = await db.getAllNotes()
      let filtered = allNotes

      // 关键词过滤
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase()
        filtered = filtered.filter(note =>
          note.title.toLowerCase().includes(lowerQuery) ||
          note.content.toLowerCase().includes(lowerQuery) ||
          note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
      }

      // 日期范围过滤
      if (searchFilters?.dateRange) {
        const { start, end } = searchFilters.dateRange
        filtered = filtered.filter(note =>
          note.updatedAt >= start && note.updatedAt <= end
        )
      }

      // 标签过滤
      if (searchFilters?.tags && searchFilters.tags.length > 0) {
        filtered = filtered.filter(note =>
          searchFilters.tags!.some(tag => note.tags.includes(tag))
        )
      }

      // 收藏过滤
      if (searchFilters?.favoritesOnly) {
        filtered = filtered.filter(note => note.isFavorite)
      }

      setResults(filtered)
      setFilters(searchFilters || {})
      setQuery(searchQuery)
    } catch (err) {
      console.error('搜索失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setQuery('')
    setFilters({})
  }, [])

  return { results, loading, query, filters, search, clearResults }
}

// ==================== 链接建议 Hook ====================

/**
 * 链接建议 Hook
 */
export function useLinkSuggestions() {
  const [suggestions, setSuggestions] = useState<Note[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updateSuggestions = useCallback(async (searchQuery: string, cursorPos: { top: number; left: number }) => {
    setQuery(searchQuery)
    setPosition(cursorPos)
    setIsOpen(true)

    try {
      const allNotes = await db.getAllNotes()
      if (!searchQuery.trim()) {
        // 无查询时返回最近的笔记
        const recent = allNotes
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 8)
        setSuggestions(recent)
        return
      }

      const lowerQuery = searchQuery.toLowerCase()
      const matched = allNotes
        .filter(note =>
          note.title.toLowerCase().includes(lowerQuery) ||
          note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 8)

      setSuggestions(matched)
    } catch (err) {
      console.error('获取链接建议失败:', err)
    }
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setSuggestions([])
  }, [])

  return {
    suggestions,
    isOpen,
    query,
    position,
    updateSuggestions,
    close,
  }
}

// ==================== 版本对比 Hook ====================

/**
 * 版本对比 Hook
 */
export function useVersionCompare(noteId: string | null) {
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const loadVersions = useCallback(async () => {
    if (!noteId) return

    setLoading(true)
    try {
      const history = await db.getNoteVersions(noteId)
      setVersions(history)
    } catch (err) {
      console.error('加载版本失败:', err)
    } finally {
      setLoading(false)
    }
  }, [noteId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  const toggleSelection = useCallback((versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId)
      }
      if (prev.length >= 2) {
        return [prev[1], versionId]
      }
      return [...prev, versionId]
    })
  }, [])

  const compareSelected = useCallback((): { older: NoteVersion; newer: NoteVersion } | null => {
    if (selectedVersions.length !== 2) return null

    const v1 = versions.find(v => v.id === selectedVersions[0])
    const v2 = versions.find(v => v.id === selectedVersions[1])

    if (!v1 || !v2) return null

    return v1.createdAt < v2.createdAt
      ? { older: v1, newer: v2 }
      : { older: v2, newer: v1 }
  }, [selectedVersions, versions])

  return {
    versions,
    selectedVersions,
    loading,
    toggleSelection,
    compareSelected,
    loadVersions,
  }
}
