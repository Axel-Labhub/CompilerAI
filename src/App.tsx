/**
 * 编译器 - 职场知识库 MVP
 * 
 * "你是你唯一的算法"
 * 公司买的是8小时结果，认知源码只属于你
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  Header, 
  Sidebar, 
  NoteList, 
  NoteEditor, 
  Preview, 
  WeeklyReportModal,
  KeyboardShortcutsHelp,
  TemplateSelector,
  Favorites,
  DreamCycleReport,
  GraphView,
  HandoverModal,
  ToastProvider,
  WelcomeGuide,
  shouldShowWelcomeGuide,
} from './components'
import { 
  useNotes, 
  useEditor, 
  useWeeklyReportSelection, 
  useTheme, 
  useExport,
} from './hooks'
// 独立导入 useKeyboardShortcuts 以支持更多功能
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { initDB, createNote as dbCreateNote } from './lib/db'
import { runDreamCycle } from './lib/dreamCycle'
import { showToastGlobal } from './lib/toast'
import { SAMPLE_NOTES } from './lib/sample-notes'
import type { Note, NoteTemplate, SearchFilters, ExportFormat, ExportOptions, CompiledSection, DreamCycleReport as DreamCycleReportType } from './types'

// App 主组件
function App() {
  // 数据库初始化状态
  const [_dbReady, setDbReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  // 主题
  const { theme, setTheme, toggleTheme } = useTheme()

  // 笔记管理
  const {
    notes,
    loading: notesLoading,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    toggleFavorite,
    searchNotes,
    filterByTag,
    loadNotes,
    advancedSearchNotes,
    loadFavorites,
  } = useNotes()

  // 编辑器状态
  const {
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
    setCurrentNote,
    setViewMode,
    markSaving,
    markSaved,
  } = useEditor()

  // 周报选择
  const {
    selectedIds,
    showGenerator,
    toggleSelection,
    selectAll,
    deselectAll,
    getSelectedNotes,
    openGenerator,
    closeGenerator,
  } = useWeeklyReportSelection(notes)

  // 导出功能
  const { exportAsMarkdown, exportAsHTML, exportAsPDF } = useExport()

  // 弹窗状态
  const [showHelp, setShowHelp] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [_showFavorites, setShowFavorites] = useState(false)
  const [favoriteNotes, setFavoriteNotes] = useState<Note[]>([])

  // 梦境循环状态
  const [showDreamCycle, setShowDreamCycle] = useState(false)
  const [dreamReport, setDreamReport] = useState<DreamCycleReportType | null>(null)
  const [isDreamRunning, setIsDreamRunning] = useState(false)
  const [lastDreamRun, setLastDreamRun] = useState<number | null>(() => {
    const saved = localStorage.getItem('lastDreamRun')
    return saved ? parseInt(saved, 10) : null
  })

  // 关系图谱状态
  const [showGraph, setShowGraph] = useState(false)

  // 离职交接状态
  const [showHandover, setShowHandover] = useState(false)

  // 会议纪要处理状态
  const [showMeetingNotes, setShowMeetingNotes] = useState(false)

  // 新手指引状态
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(() => shouldShowWelcomeGuide())

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // 初始化数据库
  useEffect(() => {
    initDB()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('数据库初始化失败:', err)
        setDbError('数据库初始化失败，请刷新页面重试')
      })
  }, [])

  // 处理示例笔记创建
  const handleCreateSampleNotes = useCallback(async () => {
    try {
      // 创建示例笔记
      for (const sampleNote of SAMPLE_NOTES) {
        await dbCreateNote(sampleNote)
      }
      // 刷新笔记列表
      await loadNotes()
      showToastGlobal('示例笔记已创建', 'success')
    } catch (err) {
      console.error('创建示例笔记失败:', err)
      showToastGlobal('创建示例笔记失败', 'error')
    }
  }, [loadNotes])

  // 监听示例笔记事件
  useEffect(() => {
    const handleShowSamples = () => {
      handleCreateSampleNotes()
    }
    window.addEventListener('showSampleNotes', handleShowSamples)
    return () => {
      window.removeEventListener('showSampleNotes', handleShowSamples)
    }
  }, [handleCreateSampleNotes])

  // 加载收藏笔记
  const loadFavoriteNotes = useCallback(async () => {
    const favorites = await loadFavorites()
    setFavoriteNotes(favorites)
  }, [loadFavorites])

  useEffect(() => {
    loadFavoriteNotes()
  }, [notes, loadFavoriteNotes])

  // AI 清洗处理函数
  const [isAICleaning, setIsAICleaning] = useState(false)
  const handleAIClean = useCallback(async () => {
    if (!currentNote || viewMode !== 'editor' || isAICleaning) return
    
    setIsAICleaning(true)
    try {
      window.dispatchEvent(new CustomEvent('ai-clean', { 
        detail: { noteId: currentNote.id } 
      }))
      showToastGlobal('正在清洗内容...', 'info')
    } catch (err) {
      console.error('AI 清洗失败:', err)
      showToastGlobal('AI 清洗失败', 'error')
    } finally {
      setIsAICleaning(false)
    }
  }, [currentNote, viewMode, isAICleaning])

  // AI 编译真相处理函数
  const [isAICompiling, setIsAICompiling] = useState(false)
  const handleAICompile = useCallback(async () => {
    if (!currentNote || viewMode !== 'editor' || isAICompiling) return
    
    setIsAICompiling(true)
    try {
      window.dispatchEvent(new CustomEvent('ai-compile', { 
        detail: { noteId: currentNote.id } 
      }))
      showToastGlobal('正在编译真相...', 'info')
    } catch (err) {
      console.error('AI 编译失败:', err)
      showToastGlobal('AI 编译失败', 'error')
    } finally {
      setIsAICompiling(false)
    }
  }, [currentNote, viewMode, isAICompiling])

  // 生成周报处理函数
  const handleWeeklyReport = useCallback(() => {
    if (viewMode !== 'list') return
    handleOpenWeeklyReport()
    showToastGlobal('正在打开周报生成器...', 'info')
  }, [viewMode])

  // 全局快捷键
  useKeyboardShortcuts({
    onSave: () => {
      if (viewMode === 'editor') {
        window.dispatchEvent(new CustomEvent('editor-save'))
        showToastGlobal('保存中...', 'info')
      }
    },
    onNew: () => {
      if (viewMode === 'list') {
        handleCreateNew()
      }
    },
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement
      searchInput?.focus()
    },
    onPreview: () => {
      if (viewMode === 'editor') {
        preview()
      }
    },
    onFullscreen: () => {
      if (viewMode === 'editor' || viewMode === 'preview') {
        toggleFullscreen()
      }
    },
    onHelp: () => {
      setShowHelp(prev => !prev)
    },
    onAIClean: handleAIClean,
    onAICompile: handleAICompile,
    onWeeklyReport: handleWeeklyReport,
  })

  // 处理搜索
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setActiveTag(null)
    searchNotes(query)
  }, [searchNotes])

  // 高级搜索
  const handleAdvancedSearch = useCallback((filters: SearchFilters) => {
    setSearchQuery('')
    setActiveTag(null)
    advancedSearchNotes({
      ...filters,
      query: searchQuery,
    })
  }, [advancedSearchNotes, searchQuery])

  // 重置搜索
  const handleResetSearch = useCallback(() => {
    setSearchQuery('')
    loadNotes()
  }, [loadNotes])

  // 处理标签筛选
  const handleTagClick = useCallback((tag: string | null) => {
    setActiveTag(tag)
    setSearchQuery('')
    filterByTag(tag)
  }, [filterByTag])

  // 打开笔记
  const handleOpenNote = useCallback((note: Note) => {
    openNote(note)
  }, [openNote])

  // 创建新笔记
  const handleCreateNew = useCallback(() => {
    setShowTemplateSelector(true)
  }, [])

  // 选择模板
  const handleSelectTemplate = useCallback((template: NoteTemplate | null) => {
    if (template) {
      createNew(template.content)
    } else {
      createNew()
    }
  }, [createNew])

  // 保存笔记
  const handleSave = useCallback(async (title: string, content: string, tags: string[], compiledSection?: CompiledSection | null) => {
    markSaving()
    if (currentNote && currentNote.id) {
      await updateNote(currentNote.id, { title, content, tags, compiledSection })
    } else {
      const newNote = await createNote(title, content, tags)
      if (newNote) {
        setCurrentNote(newNote)
      }
    }
    markSaved()
    loadFavoriteNotes()
  }, [currentNote, createNote, updateNote, setCurrentNote, markSaving, markSaved, loadFavoriteNotes])

  // 删除笔记
  const handleDelete = useCallback(async (id: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      await deleteNote(id)
      if (currentNote?.id === id) {
        closeEditor()
      }
      loadFavoriteNotes()
      showToastGlobal('笔记已删除', 'success')
    }
  }, [currentNote, deleteNote, closeEditor, loadFavoriteNotes])

  // 返回列表视图
  const handleBackToList = useCallback(() => {
    if (isDirty) {
      if (confirm('有未保存的更改，确定要离开吗？')) {
        closeEditor()
        loadNotes()
      }
    } else {
      closeEditor()
      loadNotes()
    }
  }, [isDirty, closeEditor, loadNotes])

  // 切换到编辑模式
  const handleEdit = useCallback(() => {
    setViewMode('editor')
  }, [setViewMode])

  // 打开周报生成器
  const handleOpenWeeklyReport = useCallback(() => {
    selectAll()
    openGenerator()
  }, [selectAll, openGenerator])

  // 切换收藏
  const handleToggleFavorite = useCallback(async (id: string) => {
    await toggleFavorite(id)
    loadFavoriteNotes()
  }, [toggleFavorite, loadFavoriteNotes])

  // 处理导出
  const handleExport = useCallback((format: ExportFormat, options: ExportOptions) => {
    if (!currentNote) return
    
    const noteToExport = {
      ...currentNote,
      title: currentNote.title || '无标题笔记',
    }

    switch (format) {
      case 'md':
        exportAsMarkdown(noteToExport, options)
        showToastGlobal('导出 Markdown 成功', 'success')
        break
      case 'html':
        exportAsHTML(noteToExport, options)
        showToastGlobal('导出 HTML 成功', 'success')
        break
      case 'pdf':
        exportAsPDF(noteToExport, options)
        showToastGlobal('导出 PDF 成功，请在弹窗中打印或保存为 PDF', 'info')
        break
    }
  }, [currentNote, exportAsMarkdown, exportAsHTML, exportAsPDF])

  // 打开梦境循环
  const handleOpenDreamCycle = useCallback(() => {
    setShowDreamCycle(true)
  }, [])

  // 运行梦境循环
  const handleRunDreamCycle = useCallback(async () => {
    setIsDreamRunning(true)
    try {
      const report = await runDreamCycle()
      setDreamReport(report)
      const now = Date.now()
      setLastDreamRun(now)
      localStorage.setItem('lastDreamRun', now.toString())
      showToastGlobal('梦境整理完成', 'success')
    } catch (err) {
      console.error('梦境循环运行失败:', err)
      showToastGlobal('梦境循环失败', 'error')
    } finally {
      setIsDreamRunning(false)
    }
  }, [])

  // 关闭梦境循环
  const handleCloseDreamCycle = useCallback(() => {
    setShowDreamCycle(false)
  }, [])

  // 导航到笔记
  const handleNavigateToNote = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note) {
      openNote(note)
      setShowDreamCycle(false)
    }
  }, [notes, openNote])

  // 获取所有不重复的标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach(note => note.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet)
  }, [notes])

  // 收藏数量
  const favoriteCount = favoriteNotes.length

  // 错误处理
  if (dbError) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-text mb-2">出错了</h2>
          <p className="text-dark-muted mb-4">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            刷新页面
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 头部 */}
      <Header
        theme={theme}
        onThemeToggle={toggleTheme}
        onThemeChange={setTheme}
        onLogoClick={() => {
          setActiveTag(null)
          setSearchQuery('')
          loadNotes()
        }}
        onSearch={handleSearch}
        onAdvancedSearch={handleAdvancedSearch}
        onResetSearch={handleResetSearch}
        searchQuery={searchQuery}
        showFavorites={() => setShowFavorites(true)}
        favoriteCount={favoriteCount}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        {viewMode === 'list' && (
          <Sidebar
            allTags={allTags}
            activeTag={activeTag}
            onTagClick={handleTagClick}
            onNewNote={handleCreateNew}
            onOpenWeeklyReport={handleOpenWeeklyReport}
            onOpenDreamCycle={handleOpenDreamCycle}
            onOpenHandover={() => setShowHandover(true)}
            onOpenMeetingNotes={() => setShowMeetingNotes(true)}
            onOpenGraph={() => setShowGraph(true)}
            noteCount={notes.length}
            favoriteCount={favoriteCount}
            onShowFavorites={() => setShowFavorites(true)}
            lastDreamRun={lastDreamRun}

          />
        )}

        {/* 笔记列表 */}
        {viewMode === 'list' && (
          <main className="flex-1 overflow-hidden flex flex-col">
            <NoteList
              notes={notes}
              loading={notesLoading}
              onNoteClick={handleOpenNote}
              onDelete={handleDelete}
              onTogglePin={togglePin}
              onToggleFavorite={handleToggleFavorite}
              searchQuery={searchQuery}
            />
          </main>
        )}

        {/* 编辑器 */}
        {viewMode === 'editor' && (
          <main className="flex-1 overflow-hidden">
            <NoteEditor
              note={currentNote}
              onSave={handleSave}
              onClose={handleBackToList}
              onPreview={preview}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              onToggleFavorite={currentNote?.id ? () => handleToggleFavorite(currentNote.id) : undefined}
              onExport={handleExport}
            />
          </main>
        )}

        {/* 预览 */}
        {viewMode === 'preview' && currentNote && (
          <main className="flex-1 overflow-hidden">
            <Preview
              title={currentNote.title}
              content={currentNote.content}
              tags={currentNote.tags}
              onBack={handleBackToList}
              onEdit={handleEdit}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </main>
        )}
      </div>

      {/* 周报生成器 */}
      {showGenerator && (
        <WeeklyReportModal
          notes={getSelectedNotes()}
          selectedIds={selectedIds}
          onToggleNote={(id) => toggleSelection(id)}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onClose={closeGenerator}
        />
      )}

      {/* 快捷键帮助 */}
      <KeyboardShortcutsHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* 模板选择器 */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleSelectTemplate}
      />

      {/* 收藏夹 */}
      {_showFavorites && (
        <Favorites
          notes={favoriteNotes}
          onNoteClick={handleOpenNote}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setShowFavorites(false)}
        />
      )}

      {/* 梦境循环报告 */}
      {showDreamCycle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <DreamCycleReport
              report={dreamReport}
              isRunning={isDreamRunning}
              onRun={handleRunDreamCycle}
              onClose={handleCloseDreamCycle}
              onNavigateToNote={handleNavigateToNote}
            />
          </div>
        </div>
      )}

      {/* 关系图谱 */}
      <GraphView
        notes={notes}
        currentNoteId={currentNote?.id}
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
        onNavigate={(noteId) => {
          const note = notes.find(n => n.id === noteId)
          if (note) {
            openNote(note)
            setShowGraph(false)
          }
        }}
      />

      {/* 离职交接报告 */}
      {showHandover && (
        <HandoverModal
          onClose={() => setShowHandover(false)}
        />
      )}

      {/* 新手指引 */}
      {showWelcomeGuide && (
        <WelcomeGuide
          onComplete={() => setShowWelcomeGuide(false)}
          onViewSamples={() => {
            setShowWelcomeGuide(false)
            handleCreateSampleNotes()
          }}
        />
      )}
    </div>
  )
}

// 包装组件 - 提供 Toast 功能
function AppWithToast() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  )
}

export default AppWithToast
