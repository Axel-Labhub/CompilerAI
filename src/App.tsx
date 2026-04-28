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
  ActivationModal,
  LicenseStatus,
  GraphView,
} from './components'
import { 
  useNotes, 
  useEditor, 
  useWeeklyReportSelection, 
  useTheme, 
  useKeyboardShortcuts,
  useExport,
} from './hooks'
import { initDB } from './lib/db'
import { runDreamCycle } from './lib/dreamCycle'
import { getLicenseStatus } from './lib/license'
import type { Note, NoteTemplate, SearchFilters, ExportFormat, CompiledSection, DreamCycleReport as DreamCycleReportType } from './types'

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

  // 激活码状态
  const [showActivation, setShowActivation] = useState(false)
  const [isLicenseActive, setIsLicenseActive] = useState(true) // TODO: 开发调试模式，正式上线改为 false

  // 检查激活状态
  const checkLicense = useCallback(async () => {
    const status = await getLicenseStatus()
    setIsLicenseActive(status.isActivated)
    // 通知 LicenseStatus 组件刷新
    if (typeof window !== 'undefined' && (window as any).__refreshLicenseStatus) {
      (window as any).__refreshLicenseStatus()
    }
  }, [])

  useEffect(() => {
    checkLicense()
  }, [checkLicense])

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

  // 加载收藏笔记
  const loadFavoriteNotes = useCallback(async () => {
    const favorites = await loadFavorites()
    setFavoriteNotes(favorites)
  }, [loadFavorites])

  useEffect(() => {
    loadFavoriteNotes()
  }, [notes, loadFavoriteNotes])

  // 全局快捷键
  useKeyboardShortcuts({
    onSave: () => {
      if (viewMode === 'editor') {
        // 触发保存
      }
    },
    onNew: () => {
      if (viewMode === 'list') {
        handleCreateNew()
      }
    },
    onSearch: () => {
      // 聚焦搜索框
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
      setShowHelp(true)
    },
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
      // 更新现有笔记
      await updateNote(currentNote.id, { title, content, tags, compiledSection })
    } else {
      // 创建新笔记
      const newNote = await createNote(title, content, tags)
      if (newNote) {
        setCurrentNote(newNote)
      }
    }
    markSaved()
    loadFavoriteNotes() // 刷新收藏
  }, [currentNote, createNote, updateNote, setCurrentNote, markSaving, markSaved, loadFavoriteNotes])

  // 删除笔记
  const handleDelete = useCallback(async (id: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      await deleteNote(id)
      if (currentNote?.id === id) {
        closeEditor()
      }
      loadFavoriteNotes()
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
    // 检查激活状态
    if (!isLicenseActive) {
      setShowActivation(true)
      return
    }
    selectAll()
    openGenerator()
  }, [selectAll, openGenerator, isLicenseActive])

  // 切换收藏
  const handleToggleFavorite = useCallback(async (id: string) => {
    await toggleFavorite(id)
    loadFavoriteNotes()
  }, [toggleFavorite, loadFavoriteNotes])

  // 处理导出
  const handleExport = useCallback((format: ExportFormat) => {
    if (!currentNote) return
    
    const noteToExport = {
      ...currentNote,
      title: currentNote.title || '无标题笔记',
    }

    switch (format) {
      case 'md':
        exportAsMarkdown(noteToExport)
        break
      case 'html':
        exportAsHTML(noteToExport)
        break
      case 'pdf':
        exportAsPDF(noteToExport)
        break
    }
  }, [currentNote, exportAsMarkdown, exportAsHTML, exportAsPDF])

  // 打开梦境循环
  const handleOpenDreamCycle = useCallback(() => {
    // 检查激活状态
    if (!isLicenseActive) {
      setShowActivation(true)
      return
    }
    setShowDreamCycle(true)
  }, [isLicenseActive])

  // 运行梦境循环
  const handleRunDreamCycle = useCallback(async () => {
    setIsDreamRunning(true)
    try {
      const report = await runDreamCycle()
      setDreamReport(report)
      const now = Date.now()
      setLastDreamRun(now)
      localStorage.setItem('lastDreamRun', now.toString())
    } catch (err) {
      console.error('梦境循环运行失败:', err)
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
            onOpenGraph={() => setShowGraph(true)}
            noteCount={notes.length}
            favoriteCount={favoriteCount}
            onShowFavorites={() => setShowFavorites(true)}
            lastDreamRun={lastDreamRun}
            onActivate={() => setShowActivation(true)}
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
              onActivate={() => setShowActivation(true)}
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

      {/* 激活码弹窗 */}
      <ActivationModal
        isOpen={showActivation}
        onClose={() => setShowActivation(false)}
        onSuccess={() => {
          setShowActivation(false)
          checkLicense()
        }}
      />

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
    </div>
  )
}

export default App
