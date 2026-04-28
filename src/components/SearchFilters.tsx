/**
 * SearchFilters 组件
 * 高级搜索筛选面板
 */

import React, { useState } from 'react'
import type { SearchFilters as SearchFiltersType } from '../types'
import { ALL_TAGS } from '../types'

interface SearchFiltersProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: SearchFiltersType) => void
  onReset: () => void
  onSearch?: (query: string) => void
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ isOpen, onClose, onApply, onReset }) => {
  const [filters, setFilters] = useState<SearchFiltersType>({
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    tags: [],
  })
  const [dateRangeEnabled, setDateRangeEnabled] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleApply = () => {
    const appliedFilters: SearchFiltersType = {
      ...filters,
      dateRange: dateRangeEnabled && startDate && endDate ? {
        start: new Date(startDate).getTime(),
        end: new Date(endDate).getTime() + 86400000, // 包含当天
      } : undefined,
    }
    onApply(appliedFilters)
    onClose()
  }

  const handleReset = () => {
    setFilters({ sortBy: 'updatedAt', sortOrder: 'desc', tags: [] })
    setDateRangeEnabled(false)
    setStartDate('')
    setEndDate('')
    onReset()
    onClose()
  }

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag],
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 面板内容 */}
      <div className="relative bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h2 className="text-lg font-semibold text-app-text">高级筛选</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 筛选内容 */}
        <div className="p-5 space-y-5 max-h-96 overflow-y-auto">
          {/* 日期范围 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-app-text mb-2">
              <input
                type="checkbox"
                checked={dateRangeEnabled}
                onChange={(e) => setDateRangeEnabled(e.target.checked)}
                className="rounded border-app-border text-primary-500 focus:ring-primary-500"
              />
              日期范围
            </label>
            {dateRangeEnabled && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-app-bg border border-app-border rounded text-sm text-app-text focus:outline-none focus:border-primary-500"
                />
                <span className="text-app-muted">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-app-bg border border-app-border rounded text-sm text-app-text focus:outline-none focus:border-primary-500"
                />
              </div>
            )}
          </div>

          {/* 标签筛选 */}
          <div>
            <label className="text-sm font-medium text-app-text mb-2 block">标签</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.slice(0, 15).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    filters.tags?.includes(tag)
                      ? 'bg-primary-500 text-white'
                      : 'bg-app-bg text-app-muted hover:bg-app-border'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 排序 */}
          <div>
            <label className="text-sm font-medium text-app-text mb-2 block">排序方式</label>
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="flex-1 px-3 py-2 bg-app-bg border border-app-border rounded text-sm text-app-text focus:outline-none focus:border-primary-500"
              >
                <option value="updatedAt">更新时间</option>
                <option value="createdAt">创建时间</option>
                <option value="title">标题</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                className="w-28 px-3 py-2 bg-app-bg border border-app-border rounded text-sm text-app-text focus:outline-none focus:border-primary-500"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-5 py-4 bg-app-bg/50 border-t border-app-border flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-app-border rounded-lg text-sm text-app-text hover:bg-app-border transition-colors"
          >
            重置
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-primary-600 rounded-lg text-sm text-white hover:bg-primary-700 transition-colors"
          >
            应用筛选
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchFilters
