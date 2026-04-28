/**
 * AdvancedSearch 高级搜索增强组件
 * 支持全文搜索、实时建议、关键词高亮
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Note, SearchFilters } from '../types'
import { getAllNotes } from '../lib/db'

interface AdvancedSearchProps {
  isOpen: boolean
  onClose: () => void
  onSelectNote: (note: Note) => void
  onAdvancedSearch?: (filters: SearchFilters & { query?: string }) => void
}

interface SearchResult extends Note {
  matchType?: 'title' | 'content' | 'tag'
  matchedText?: string
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  isOpen,
  onClose,
  onSelectNote,
  onAdvancedSearch,
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // 加载最近搜索
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load recent searches')
      }
    }
  }, [isOpen])

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // 搜索函数
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSuggestions([])
      return
    }

    const allNotes = await getAllNotes()
    const lowerQuery = searchQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    for (const note of allNotes) {
      // 标题匹配
      if (note.title.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          ...note,
          matchType: 'title',
          matchedText: getMatchedText(note.title, searchQuery),
        })
        continue
      }

      // 标签匹配
      const matchedTags = note.tags.filter(tag => tag.toLowerCase().includes(lowerQuery))
      if (matchedTags.length > 0) {
        searchResults.push({
          ...note,
          matchType: 'tag',
          matchedText: matchedTags.join(', '),
        })
        continue
      }

      // 内容匹配
      const contentLower = note.content.toLowerCase()
      if (contentLower.includes(lowerQuery)) {
        const index = contentLower.indexOf(lowerQuery)
        const start = Math.max(0, index - 30)
        const end = Math.min(note.content.length, index + searchQuery.length + 50)
        const excerpt = note.content.substring(start, end)
        searchResults.push({
          ...note,
          matchType: 'content',
          matchedText: (start > 0 ? '...' : '') + excerpt + (end < note.content.length ? '...' : ''),
        })
      }
    }

    setResults(searchResults.slice(0, 20)) // 最多显示20条
    setSelectedIndex(0)

    // 生成建议
    generateSuggestions(allNotes, searchQuery)
  }, [])

  // 生成搜索建议
  const generateSuggestions = (notes: Note[], searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase()
    const suggestionSet = new Set<string>()

    // 从标题中提取建议
    notes.forEach(note => {
      const words = note.title.split(/[\s,，、]+/)
      words.forEach(word => {
        if (word.toLowerCase().includes(lowerQuery) && word.length > 2) {
          suggestionSet.add(word)
        }
      })
    })

    // 从标签中提取建议
    notes.forEach(note => {
      note.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          suggestionSet.add(tag)
        }
      })
    })

    setSuggestions(Array.from(suggestionSet).slice(0, 5))
  }

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 150)
    return () => clearTimeout(timer)
  }, [query, performSearch])

  // 保存搜索历史
  const saveSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      } else if (suggestions[0]) {
        setQuery(suggestions[0])
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  // 选择笔记
  const handleSelect = (note: Note) => {
    saveSearch(query)
    onSelectNote(note)
    onClose()
  }

  // 高亮匹配文本
  const highlightMatch = (text: string, matchType?: string) => {
    if (!query.trim() || !matchType) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-yellow-500/30 text-yellow-300 rounded px-0.5">{part}</mark>
        : part
    )
  }

  // 匹配类型图标
  const getMatchIcon = (matchType?: string) => {
    switch (matchType) {
      case 'title':
        return <span className="text-blue-400" title="标题匹配">📄</span>
      case 'tag':
        return <span className="text-purple-400" title="标签匹配">🏷️</span>
      case 'content':
        return <span className="text-green-400" title="内容匹配">📝</span>
      default:
        return <span className="text-gray-400">📄</span>
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 搜索面板 */}
      <div className="relative w-full max-w-2xl mx-4 bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden">
        {/* 搜索输入框 */}
        <div className="flex items-center px-4 py-3 border-b border-dark-border">
          <svg className="w-5 h-5 text-dark-muted mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索笔记标题、内容或标签..."
            className="flex-1 bg-transparent border-none text-dark-text placeholder-dark-muted focus:outline-none text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-dark-border text-dark-muted"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 搜索建议 */}
        {suggestions.length > 0 && !query && (
          <div className="px-4 py-2 border-b border-dark-border bg-dark-bg/50">
            <div className="flex items-center gap-2 text-xs text-dark-muted mb-2">
              <span>最近搜索</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(search)}
                  className="px-2 py-1 bg-dark-bg rounded text-sm text-dark-text hover:bg-dark-border transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索建议词 */}
        {suggestions.length > 0 && query && (
          <div className="px-4 py-2 border-b border-dark-border bg-dark-bg/50">
            <div className="flex items-center gap-2 text-xs text-dark-muted mb-2">
              <span>建议</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(suggestion)}
                  className="px-2 py-1 bg-dark-bg rounded text-sm text-primary-400 hover:bg-dark-border transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        <div className="max-h-96 overflow-y-auto">
          {query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-dark-muted">
              <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>未找到相关笔记</p>
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-dark-bg/50 transition-colors ${
                index === selectedIndex ? 'bg-dark-bg/50' : ''
              }`}
            >
              {getMatchIcon(result.matchType)}
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium text-dark-text truncate">
                  {highlightMatch(result.title || '无标题笔记', result.matchType)}
                </div>
                {result.matchedText && (
                  <div className="text-sm text-dark-muted mt-1 line-clamp-2">
                    {highlightMatch(result.matchedText, result.matchType)}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {result.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag text-xs">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-dark-muted whitespace-nowrap">
                {formatRelativeTime(result.updatedAt)}
              </div>
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-4 py-2 border-t border-dark-border bg-dark-bg/50 text-xs text-dark-muted flex items-center gap-4">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-dark-card rounded">↑</kbd>
            <kbd className="px-1 py-0.5 bg-dark-card rounded">↓</kbd>
            导航
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-dark-card rounded">Enter</kbd>
            选择
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-dark-card rounded">Esc</kbd>
            关闭
          </span>
        </div>
      </div>
    </div>
  )
}

// 格式化相对时间
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 获取匹配文本（带上下文）
function getMatchedText(text: string, query: string): string {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text.substring(0, 50)

  const start = Math.max(0, index - 15)
  const end = Math.min(text.length, index + query.length + 35)
  const excerpt = text.substring(start, end)

  return (start > 0 ? '...' : '') + excerpt + (end < text.length ? '...' : '')
}

export default AdvancedSearch
