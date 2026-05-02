/**
 * 新的主应用组件
 * 使用集中式状态管理重构
 */

import { useState, useEffect, useCallback } from 'react'
import { AppProvider, useApp } from './store/app-store'
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
  MeetingMinutes,
  ToastProvider,
  WelcomeGuide,
} from './components'
import { runDreamCycle } from './lib/dreamCycle'
import { showToastGlobal } from './lib/toast'
import { aiMergeNotes } from './lib/ai'
import { initDB, createNote as dbCreateNote } from './lib/db'
import { SAMPLE_NOTES } from './lib/sample-notes'
import type { Note, NoteTemplate, DreamCycleReport as DreamCycleReportType } from './types'

// 新的 App 组件
function NewApp() {
  const { state, dispatch, openNote, closeEditor, saveNote, toggleFavorite, deleteNote, loadNotes, createNote, setViewMode } = useApp()
  
  // 额外状态
  const [dreamReport, setDreamReport] = useState<DreamCycleReportType | null>(null)
  const [isDreamRunning, setIsDreamRunning] = useState(false)
  const [isAICleaning, setIsAICleaning] = useState(false)
  const [isAICompiling, setIsAICompiling] = useState(false)

  // 创建示例笔记
  const handleCreateSampleNotes = useCallback(async () => {
    const samplesCreated = localStorage.getItem('samplesCreated')
    if (samplesCreated === 'true') {
      showToastGlobal('示例笔记已存在', 'info')
      return
    }
    
    try {
      for (const sampleNote of SAMPLE_NOTES) {
        await dbCreateNote(sampleNote)
      }
      localStorage.setItem('samplesCreated', 'true')
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

  // AI 清洗处理
  const handleAIClean = useCallback(async () => {
    if (!state.currentNote || state.viewMode !== 'editor' || isAICleaning) return
    
    setIsAICleaning(true)
    try {
      window.dispatchEvent(new CustomEvent('ai-clean', { detail: { noteId: state.currentNote.id } }))
      showToastGlobal('正在清洗内容...', 'info')
    } catch (err) {
      console.error('AI 清洗失败:', err)
      showToastGlobal('AI 清洗失败', 'error')
    } finally {
      setIsAICleaning(false)
    }
  }, [state.currentNote, state.viewMode, isAICleaning])

  // AI 编译处理
  const handleAICompile = useCallback(async () => {
    if (!state.currentNote || state.viewMode !== 'editor' || isAICompiling) return
    
    setIsAICompiling(true)
    try {
      window.dispatchEvent(new CustomEvent('ai-compile', { detail: { noteId: state.currentNote.id } }))
      showToastGlobal('正在编译真相...', 'info')
    } catch (err) {
      console.error('AI 编译失败:', err)
      showToastGlobal('AI 编译失败', 'error')
    } finally {
      setIsAICompiling(false)
    }
  }, [state.currentNote, state.viewMode, isAICompiling])

  // 打开周报生成器
  const handleOpenWeeklyReport = useCallback(() => {
    dispatch({ type: 'TOGGLE_WEEKLY_REPORT' })
    showToastGlobal('正在打开周报生成器...', 'info')
  }, [dispatch])

  // 返回列表视图
  const handleBackToList = useCallback(() => {
    if (state.isDirty) {
      if (confirm('有未保存的更改，确定要离开吗？')) {
        closeEditor()
        loadNotes()
      }
    } else {
      closeEditor()
      loadNotes()
    }
  }, [state.isDirty, closeEditor, loadNotes])

  // 选择模板
  const handleSelectTemplate = useCallback((template: NoteTemplate | null) => {
    dispatch({ type: 'TOGGLE_TEMPLATE_SELECTOR' })
    if (template) {
      createNote(template.name || '新建笔记', template.content, [])
        .then(note => {
          if (note) {
            openNote(note)
          }
        })
    } else {
      createNote('新建笔记', '', [])
        .then(note => {
          if (note) {
            openNote(note)
          }
        })
    }
  }, [dispatch, createNote, openNote])

  // 处理删除确认
  const handleDeleteWithConfirm = useCallback(async (id: string) => {
    if (confirm('确定要删除这条笔记吗？')) {
      await deleteNote(id)
      if (state.currentNote?.id === id) {
        closeEditor()
      }
      showToastGlobal('笔记已删除', 'success')
    }
  }, [state.currentNote, deleteNote, closeEditor])

  // 运行梦境循环
  const handleRunDreamCycle = useCallback(async () => {
    setIsDreamRunning(true)
    try {
      const report = await runDreamCycle()
      setDreamReport(report)
      const now = Date.now()
      localStorage.setItem('lastDreamRun', now.toString())
      showToastGlobal('梦境整理完成', 'success')
    } catch (err) {
      console.error('梦境循环运行失败:', err)
      showToastGlobal('梦境循环失败', 'error')
    } finally {
      setIsDreamRunning(false)
    }
  }, [])

  // 执行梦境循环建议
  const handleExecuteDreamSuggestion = useCallback(async (suggestion: any) => {
    try {
      switch (suggestion.type) {
        case 'merge': {
          const noteIds = suggestion.relatedNoteIds
          const notesToMerge = noteIds.map((id: string) => state.notes.find(n => n.id === id)).filter(Boolean) as Note[]
          
          if (notesToMerge.length >= 2) {
            showToastGlobal('AI正在融合笔记...', 'info')
            const merged = await aiMergeNotes(notesToMerge)
            await createNote(merged.title, merged.content, merged.tags)
            for (const note of notesToMerge) {
              await deleteNote(note.id)
            }
            showToastGlobal('✨ AI已融合笔记，内容更精炼', 'success')
          }
          break
        }
        case 'delete': {
          const noteId = suggestion.targetNoteId || suggestion.relatedNoteIds[0]
          if (noteId) {
            await deleteNote(noteId)
            showToastGlobal('已删除笔记', 'success')
          }
          break
        }
        case 'tag': {
          const noteId = suggestion.relatedNoteIds[0]
          if (noteId) {
            const note = state.notes.find(n => n.id === noteId)
            if (note) {
              openNote(note)
            }
            showToastGlobal('跳转到笔记整理标签', 'info')
          }
          break
        }
        default:
          showToastGlobal('该操作暂不支持自动执行', 'info')
      }
      await handleRunDreamCycle()
    } catch (err) {
      console.error('执行建议失败:', err)
      showToastGlobal('执行失败', 'error')
    }
  }, [state.notes, deleteNote, createNote, openNote, handleRunDreamCycle])

  // 导航到笔记
  const handleNavigateToNote = useCallback((noteId: string) => {
    const note = state.notes.find(n => n.id === noteId)
    if (note) {
      openNote(note)
      dispatch({ type: 'TOGGLE_DREAM_CYCLE' })
    }
  }, [state.notes, openNote, dispatch])

  // 获取所有标签
  const allTags = [...new Set(state.notes.flatMap(note => note.tags))]

  // 错误处理
  if (state.error) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-text mb-2">出错了</h2>
          <p className="text-dark-muted mb-4">{state.error}</p>
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

  // 加载状态
  if (!state.dbReady || state.loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-muted">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 头部 */}
      <Header
        searchQuery={state.searchQuery}
        onSearch={(query) => {
          dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
        }}
        onLogoClick={() => {
          dispatch({ type: 'RESET_SEARCH' })
          loadNotes()
        }}
        favoriteCount={state.favorites.length}
        showFavorites={() => dispatch({ type: 'TOGGLE_FAVORITES' })}
        onAdvancedSearch={() => {}}
        onResetSearch={() => {
          dispatch({ type: 'RESET_SEARCH' })
          loadNotes()
        }}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        {state.viewMode === 'list' && (
          <Sidebar
            allTags={allTags}
            activeTag={state.activeTag}
            onTagClick={(tag) => {
              dispatch({ type: 'SET_ACTIVE_TAG', payload: tag })
              dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
              // 实际筛选逻辑在 filterByTag 中
            }}
            onNewNote={() => dispatch({ type: 'TOGGLE_TEMPLATE_SELECTOR' })}
            onOpenWeeklyReport={handleOpenWeeklyReport}
            onOpenDreamCycle={() => dispatch({ type: 'TOGGLE_DREAM_CYCLE' })}
            onOpenHandover={() => dispatch({ type: 'TOGGLE_HANDOVER' })}
            onOpenMeetingNotes={() => dispatch({ type: 'TOGGLE_MEETING_NOTES' })}
            onOpenGraph={() => dispatch({ type: 'TOGGLE_GRAPH' })}
            noteCount={state.notes.length}
            favoriteCount={state.favorites.length}
            onShowFavorites={() => dispatch({ type: 'TOGGLE_FAVORITES' })}
            lastDreamRun={localStorage.getItem('lastDreamRun') ? parseInt(localStorage.getItem('lastDreamRun')!, 10) : null}
          />
        )}

        {/* 笔记列表 */}
        {state.viewMode === 'list' && (
          <main className="flex-1 overflow-hidden flex flex-col">
            <NoteList
              notes={state.notes}
              loading={state.loading}
              onNoteClick={openNote}
              onDelete={handleDeleteWithConfirm}
              onTogglePin={(id) => dispatch({ type: 'TOGGLE_PIN', payload: id })}
              onToggleFavorite={toggleFavorite}
              searchQuery={state.searchQuery}
            />
          </main>
        )}

        {/* 编辑器 */}
        {state.viewMode === 'editor' && (
          <main className="flex-1 overflow-hidden">
            <NoteEditor
              note={state.currentNote}
              onSave={saveNote}
              onClose={handleBackToList}
              onPreview={() => setViewMode('preview')}
              isFullscreen={state.isFullscreen}
              onToggleFullscreen={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
              saveStatus={state.saveStatus}
              lastSavedAt={state.lastSavedAt}
              onToggleFavorite={state.currentNote?.id ? () => toggleFavorite(state.currentNote!.id) : undefined}
              onExport={() => {}}
            />
          </main>
        )}

        {/* 预览 */}
        {state.viewMode === 'preview' && state.currentNote && (
          <main className="flex-1 overflow-hidden">
            <Preview
              title={state.currentNote.title}
              content={state.currentNote.content}
              tags={state.currentNote.tags}
              onBack={handleBackToList}
              onEdit={() => setViewMode('editor')}
              isFullscreen={state.isFullscreen}
              onToggleFullscreen={() => dispatch({ type: 'TOGGLE_FULLSCREEN' })}
            />
          </main>
        )}
      </div>

      {/* 周报生成器 */}
      {state.showWeeklyReport && (
        <WeeklyReportModal
          notes={state.notes}
          selectedIds={new Set<string>()}
          onToggleNote={() => {}}
          onSelectAll={() => {}}
          onDeselectAll={() => {}}
          onClose={() => dispatch({ type: 'TOGGLE_WEEKLY_REPORT' })}
        />
      )}

      {/* 快捷键帮助 */}
      <KeyboardShortcutsHelp
        isOpen={state.showHelp}
        onClose={() => dispatch({ type: 'TOGGLE_HELP' })}
      />

      {/* 模板选择器 */}
      <TemplateSelector
        isOpen={state.showTemplateSelector}
        onClose={() => dispatch({ type: 'TOGGLE_TEMPLATE_SELECTOR' })}
        onSelect={handleSelectTemplate}
      />

      {/* 收藏夹 */}
      {state.showFavorites && (
        <Favorites
          notes={state.favorites}
          onNoteClick={openNote}
          onToggleFavorite={toggleFavorite}
          onClose={() => dispatch({ type: 'TOGGLE_FAVORITES' })}
        />
      )}

      {/* 梦境循环报告 */}
      {state.showDreamCycle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg">
            <DreamCycleReport
              report={dreamReport}
              isRunning={isDreamRunning}
              onRun={handleRunDreamCycle}
              onClose={() => dispatch({ type: 'TOGGLE_DREAM_CYCLE' })}
              onNavigateToNote={handleNavigateToNote}
              onExecuteSuggestion={handleExecuteDreamSuggestion}
            />
          </div>
        </div>
      )}

      {/* 关系图谱 */}
      <GraphView
        notes={state.notes}
        currentNoteId={state.currentNote?.id}
        isOpen={state.showGraph}
        onClose={() => dispatch({ type: 'TOGGLE_GRAPH' })}
        onNavigate={(noteId) => {
          const note = state.notes.find(n => n.id === noteId)
          if (note) {
            openNote(note)
            dispatch({ type: 'TOGGLE_GRAPH' })
          }
        }}
      />

      {/* 离职交接报告 */}
      {state.showHandover && (
        <HandoverModal
          onClose={() => dispatch({ type: 'TOGGLE_HANDOVER' })}
        />
      )}

      {/* 会议纪要 */}
      {state.showMeetingNotes && (
        <MeetingMinutes
          onClose={() => dispatch({ type: 'TOGGLE_MEETING_NOTES' })}
          onCreateNote={(title, content, tags) => {
            createNote(title, content, tags)
          }}
        />
      )}

      {/* 新手指引 */}
      {state.showWelcomeGuide && (
        <WelcomeGuide
          onComplete={() => {
            dispatch({ type: 'TOGGLE_WELCOME_GUIDE' })
            localStorage.setItem('welcomeGuideCompleted', 'true')
          }}
          onViewSamples={() => {
            dispatch({ type: 'TOGGLE_WELCOME_GUIDE' })
            localStorage.setItem('welcomeGuideCompleted', 'true')
            handleCreateSampleNotes()
          }}
        />
      )}
    </div>
  )
}

// 包装组件
function AppWithProviders() {
  return (
    <ToastProvider>
      <AppProvider>
        <NewApp />
      </AppProvider>
    </ToastProvider>
  )
}

export default AppWithProviders
