/**
 * 状态管理 Store
 * 使用 React Context + useReducer 实现集中式状态管理
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { Note, SearchFilters, CompiledSection, ViewMode } from '../types'
import { initDB, getAllNotes, createNote as dbCreateNote, updateNote as dbUpdateNote, deleteNote as dbDeleteNote, toggleFavoriteNote, togglePinNote, getFavoriteNotes } from '../lib/db'

// ==================== 状态类型 ====================

export interface AppState {
  // 笔记数据
  notes: Note[]
  currentNote: Note | null
  favorites: Note[]
  
  // 视图状态
  viewMode: ViewMode
  isFullscreen: boolean
  isDirty: boolean
  
  // 搜索和筛选
  searchQuery: string
  activeTag: string | null
  searchFilters: SearchFilters
  
  // 保存状态
  saveStatus: 'saved' | 'saving' | 'unsaved'
  lastSavedAt: Date | null
  
  // 加载状态
  loading: boolean
  dbReady: boolean
  error: string | null
  
  // 弹窗状态
  showHelp: boolean
  showTemplateSelector: boolean
  showFavorites: boolean
  showDreamCycle: boolean
  showGraph: boolean
  showHandover: boolean
  showMeetingNotes: boolean
  showWelcomeGuide: boolean
  showWeeklyReport: boolean
}

// ==================== Action 类型 ====================

type AppAction =
  // 笔记操作
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'SET_CURRENT_NOTE'; payload: Note | null }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'TOGGLE_PIN'; payload: string }
  
  // 视图操作
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'TOGGLE_FULLSCREEN' }
  | { type: 'SET_DIRTY'; payload: boolean }
  
  // 搜索和筛选
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_ACTIVE_TAG'; payload: string | null }
  | { type: 'SET_SEARCH_FILTERS'; payload: SearchFilters }
  | { type: 'RESET_SEARCH' }
  
  // 保存状态
  | { type: 'SET_SAVE_STATUS'; payload: 'saved' | 'saving' | 'unsaved' }
  | { type: 'SET_LAST_SAVED_AT'; payload: Date }
  
  // 加载状态
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DB_READY'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  
  // 弹窗状态
  | { type: 'TOGGLE_HELP' }
  | { type: 'TOGGLE_TEMPLATE_SELECTOR' }
  | { type: 'TOGGLE_FAVORITES' }
  | { type: 'TOGGLE_DREAM_CYCLE' }
  | { type: 'TOGGLE_GRAPH' }
  | { type: 'TOGGLE_HANDOVER' }
  | { type: 'TOGGLE_MEETING_NOTES' }
  | { type: 'TOGGLE_WELCOME_GUIDE' }
  | { type: 'TOGGLE_WEEKLY_REPORT' }
  
  // 初始化
  | { type: 'INITIALIZE'; payload: { notes: Note[]; favorites: Note[] } }

// ==================== 初始状态 ====================

const initialState: AppState = {
  notes: [],
  currentNote: null,
  favorites: [],
  viewMode: 'list',
  isFullscreen: false,
  isDirty: false,
  searchQuery: '',
  activeTag: null,
  searchFilters: {
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    tags: [],
  },
  saveStatus: 'saved',
  lastSavedAt: null,
  loading: false,
  dbReady: false,
  error: null,
  showHelp: false,
  showTemplateSelector: false,
  showFavorites: false,
  showDreamCycle: false,
  showGraph: false,
  showHandover: false,
  showMeetingNotes: false,
  showWelcomeGuide: typeof window !== 'undefined' ? !localStorage.getItem('welcomeGuideCompleted') : false,
  showWeeklyReport: false,
}

// ==================== Reducer ====================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_NOTES':
      return { ...state, notes: action.payload }
    
    case 'SET_CURRENT_NOTE':
      return { ...state, currentNote: action.payload }
    
    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes] }
    
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(n => n.id === action.payload.id ? action.payload : n),
        currentNote: state.currentNote?.id === action.payload.id ? action.payload : state.currentNote,
      }
    
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter(n => n.id !== action.payload),
        currentNote: state.currentNote?.id === action.payload ? null : state.currentNote,
        favorites: state.favorites.filter(n => n.id !== action.payload),
      }
    
    case 'TOGGLE_FAVORITE': {
      const note = state.notes.find(n => n.id === action.payload)
      if (!note) return state
      
      const updatedNote = { ...note, isFavorite: !note.isFavorite }
      return {
        ...state,
        notes: state.notes.map(n => n.id === action.payload ? updatedNote : n),
        currentNote: state.currentNote?.id === action.payload ? updatedNote : state.currentNote,
        favorites: updatedNote.isFavorite
          ? [...state.favorites, updatedNote]
          : state.favorites.filter(n => n.id !== action.payload),
      }
    }
    
    case 'TOGGLE_PIN': {
      const note = state.notes.find(n => n.id === action.payload)
      if (!note) return state
      
      const updatedNote = { ...note, isPinned: !note.isPinned }
      return {
        ...state,
        notes: state.notes.map(n => n.id === action.payload ? updatedNote : n),
        currentNote: state.currentNote?.id === action.payload ? updatedNote : state.currentNote,
      }
    }
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    
    case 'TOGGLE_FULLSCREEN':
      return { ...state, isFullscreen: !state.isFullscreen }
    
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload }
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    
    case 'SET_ACTIVE_TAG':
      return { ...state, activeTag: action.payload }
    
    case 'SET_SEARCH_FILTERS':
      return { ...state, searchFilters: action.payload }
    
    case 'RESET_SEARCH':
      return { ...state, searchQuery: '', activeTag: null, searchFilters: { sortBy: 'updatedAt', sortOrder: 'desc', tags: [] } }
    
    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload }
    
    case 'SET_LAST_SAVED_AT':
      return { ...state, lastSavedAt: action.payload }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    
    case 'SET_DB_READY':
      return { ...state, dbReady: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    
    case 'TOGGLE_HELP':
      return { ...state, showHelp: !state.showHelp }
    
    case 'TOGGLE_TEMPLATE_SELECTOR':
      return { ...state, showTemplateSelector: !state.showTemplateSelector }
    
    case 'TOGGLE_FAVORITES':
      return { ...state, showFavorites: !state.showFavorites }
    
    case 'TOGGLE_DREAM_CYCLE':
      return { ...state, showDreamCycle: !state.showDreamCycle }
    
    case 'TOGGLE_GRAPH':
      return { ...state, showGraph: !state.showGraph }
    
    case 'TOGGLE_HANDOVER':
      return { ...state, showHandover: !state.showHandover }
    
    case 'TOGGLE_MEETING_NOTES':
      return { ...state, showMeetingNotes: !state.showMeetingNotes }
    
    case 'TOGGLE_WELCOME_GUIDE':
      return { ...state, showWelcomeGuide: !state.showWelcomeGuide }
    
    case 'TOGGLE_WEEKLY_REPORT':
      return { ...state, showWeeklyReport: !state.showWeeklyReport }
    
    case 'INITIALIZE':
      return {
        ...state,
        notes: action.payload.notes,
        favorites: action.payload.favorites,
        dbReady: true,
        loading: false,
      }
    
    default:
      return state
  }
}

// ==================== Context ====================

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  
  // 笔记操作
  loadNotes: () => Promise<void>
  createNote: (title: string, content: string, tags: string[]) => Promise<Note | null>
  updateNote: (id: string, data: { title?: string; content?: string; tags?: string[]; compiledSection?: CompiledSection | null }) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  
  // 编辑器操作
  openNote: (note: Note) => void
  closeEditor: () => void
  saveNote: (title: string, content: string, tags: string[], compiledSection?: CompiledSection | null) => Promise<void>
  
  // 搜索操作
  searchNotes: (query: string) => void
  filterByTag: (tag: string | null) => void
  applySearchFilters: (filters: SearchFilters) => void
  
  // 视图操作
  setViewMode: (mode: ViewMode) => void
  toggleFullscreen: () => void
}

const AppContext = createContext<AppContextType | null>(null)

// ==================== Provider ====================

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // 初始化数据库
  useEffect(() => {
    const initialize = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        await initDB()
        
        const [notes, favorites] = await Promise.all([
          getAllNotes(),
          getFavoriteNotes(),
        ])
        
        dispatch({ type: 'INITIALIZE', payload: { notes, favorites } })
      } catch (err) {
        console.error('初始化失败:', err)
        dispatch({ type: 'SET_ERROR', payload: '初始化失败，请刷新页面重试' })
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    
    initialize()
  }, [])

  // 加载笔记
  const loadNotes = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const notes = await getAllNotes()
      dispatch({ type: 'SET_NOTES', payload: notes })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // 创建笔记
  const createNote = useCallback(async (title: string, content: string, tags: string[]): Promise<Note | null> => {
    try {
      const newNote = await dbCreateNote({ title, content, tags })
      dispatch({ type: 'ADD_NOTE', payload: newNote })
      return newNote
    } catch (err) {
      console.error('创建笔记失败:', err)
      dispatch({ type: 'SET_ERROR', payload: '创建笔记失败' })
      return null
    }
  }, [])

  // 更新笔记
  const updateNote = useCallback(async (id: string, data: { title?: string; content?: string; tags?: string[]; compiledSection?: CompiledSection | null }) => {
    try {
      const existingNote = state.notes.find(n => n.id === id)
      if (!existingNote) return
      
      const updatedNote = await dbUpdateNote(id, data)
      if (updatedNote) {
        dispatch({ type: 'UPDATE_NOTE', payload: updatedNote })
      }
    } catch (err) {
      console.error('更新笔记失败:', err)
      dispatch({ type: 'SET_ERROR', payload: '更新笔记失败' })
    }
  }, [state.notes])

  // 删除笔记
  const deleteNote = useCallback(async (id: string) => {
    try {
      await dbDeleteNote(id)
      dispatch({ type: 'DELETE_NOTE', payload: id })
    } catch (err) {
      console.error('删除笔记失败:', err)
      dispatch({ type: 'SET_ERROR', payload: '删除笔记失败' })
    }
  }, [])

  // 切换收藏
  const toggleFavorite = useCallback(async (id: string) => {
    try {
      await toggleFavoriteNote(id)
      dispatch({ type: 'TOGGLE_FAVORITE', payload: id })
    } catch (err) {
      console.error('切换收藏失败:', err)
    }
  }, [])

  // 切换置顶
  const togglePin = useCallback(async (id: string) => {
    try {
      await togglePinNote(id)
      dispatch({ type: 'TOGGLE_PIN', payload: id })
    } catch (err) {
      console.error('切换置顶失败:', err)
    }
  }, [])

  // 打开笔记
  const openNote = useCallback((note: Note) => {
    dispatch({ type: 'SET_CURRENT_NOTE', payload: note })
    dispatch({ type: 'SET_VIEW_MODE', payload: 'editor' })
    dispatch({ type: 'SET_DIRTY', payload: false })
  }, [])

  // 关闭编辑器
  const closeEditor = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_NOTE', payload: null })
    dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })
    dispatch({ type: 'SET_DIRTY', payload: false })
  }, [])

  // 保存笔记
  const saveNote = useCallback(async (title: string, content: string, tags: string[], compiledSection?: CompiledSection | null) => {
    dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' })
    
    try {
      if (state.currentNote) {
        await updateNote(state.currentNote.id, { title, content, tags, compiledSection })
      } else {
        const newNote = await createNote(title, content, tags)
        if (newNote) {
          dispatch({ type: 'SET_CURRENT_NOTE', payload: newNote })
        }
      }
      
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' })
      dispatch({ type: 'SET_LAST_SAVED_AT', payload: new Date() })
      dispatch({ type: 'SET_DIRTY', payload: false })
    } catch (err) {
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'unsaved' })
      throw err
    }
  }, [state.currentNote, updateNote, createNote])

  // 搜索笔记
  const searchNotes = useCallback(async (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
    dispatch({ type: 'SET_ACTIVE_TAG', payload: null })
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const notes = await getAllNotes()
      
      const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
      )
      
      dispatch({ type: 'SET_NOTES', payload: filtered })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // 按标签筛选
  const filterByTag = useCallback(async (tag: string | null) => {
    dispatch({ type: 'SET_ACTIVE_TAG', payload: tag })
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const notes = await getAllNotes()
      
      const filtered = tag 
        ? notes.filter(note => note.tags.includes(tag))
        : notes
      
      dispatch({ type: 'SET_NOTES', payload: filtered })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // 应用搜索筛选
  const applySearchFilters = useCallback(async (filters: SearchFilters) => {
    dispatch({ type: 'SET_SEARCH_FILTERS', payload: filters })
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      let notes = await getAllNotes()
      
      // 按标签筛选
      if (filters.tags && filters.tags.length > 0) {
        notes = notes.filter(note => filters.tags!.some(tag => note.tags.includes(tag)))
      }
      
      // 按日期范围筛选
      const dateRange = filters.dateRange
      if (dateRange) {
        notes = notes.filter(note => 
          note.updatedAt >= dateRange.start &&
          note.updatedAt <= dateRange.end
        )
      }
      
      // 按收藏筛选
      if (filters.favoritesOnly) {
        notes = notes.filter(note => note.isFavorite)
      }
      
      // 排序
      notes.sort((a, b) => {
        const aValue = a[filters.sortBy] as number | string
        const bValue = b[filters.sortBy] as number | string
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return filters.sortOrder === 'desc' ? bValue - aValue : aValue - bValue
        }
        
        return filters.sortOrder === 'desc'
          ? String(bValue).localeCompare(String(aValue))
          : String(aValue).localeCompare(String(bValue))
      })
      
      dispatch({ type: 'SET_NOTES', payload: notes })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // 设置视图模式
  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }, [])

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    dispatch({ type: 'TOGGLE_FULLSCREEN' })
  }, [])

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        loadNotes,
        createNote,
        updateNote,
        deleteNote,
        toggleFavorite,
        togglePin,
        openNote,
        closeEditor,
        saveNote,
        searchNotes,
        filterByTag,
        applySearchFilters,
        setViewMode,
        toggleFullscreen,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// ==================== Hook ====================

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
