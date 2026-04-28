/**
 * Header 组件
 * 应用顶部导航栏
 */

import React, { useState, useRef, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import SearchFilters from './SearchFilters'
import type { Theme, SearchFilters as SearchFiltersType } from '../types'

interface HeaderProps {
  theme: Theme
  onThemeToggle: () => void
  onThemeChange: (theme: Theme) => void
  onLogoClick: () => void
  onSearch: (query: string) => void
  onAdvancedSearch: (filters: SearchFiltersType) => void
  onResetSearch: () => void
  searchQuery: string
  showFavorites?: () => void
  favoriteCount?: number
}

export const Header: React.FC<HeaderProps> = ({ 
  theme, 
  onThemeToggle, 
  onThemeChange,
  onLogoClick, 
  onSearch, 
  onAdvancedSearch,
  onResetSearch,
  searchQuery,
  showFavorites,
  favoriteCount = 0,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 防抖处理搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [localQuery, onSearch])

  // 同步外部搜索值
  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  // 快捷键聚焦搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="h-14 bg-dark-card border-b border-dark-border flex items-center px-4 gap-4">
        {/* Logo 区域 */}
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">{'{}'}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">编译器</span>
            <span className="text-xs text-dark-muted">Compiler</span>
          </div>
        </button>

        {/* 搜索框 */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索笔记... (Ctrl+F)"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary-500 transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={() => setShowFilters(true)}
                className="p-1 rounded hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors"
                title="高级筛选"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
              {localQuery && (
                <button
                  onClick={() => setLocalQuery('')}
                  className="p-1 rounded hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 收藏夹入口 */}
          {favoriteCount > 0 && (
            <button
              onClick={showFavorites}
              className="relative p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors"
              title="收藏夹"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {favoriteCount > 9 ? '9+' : favoriteCount}
              </span>
            </button>
          )}

          {/* 快捷键帮助 */}
          <button
            onClick={() => {}}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors"
            title="快捷键 (?)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* 主题切换 */}
          <ThemeToggle theme={theme} onToggle={onThemeToggle} onSetTheme={onThemeChange} />

          {/* 右侧标语 */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-dark-muted">
            <span>你是你唯一的算法</span>
          </div>
        </div>
      </header>

      {/* 高级筛选面板 */}
      <SearchFilters 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={onAdvancedSearch}
        onReset={onResetSearch}
        onSearch={onSearch}
      />
    </>
  )
}

export default Header
