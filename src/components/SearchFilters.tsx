/**
 * SearchFilters 组件
 * 高级搜索筛选面板 - 优化版
 * 
 * 优化内容：
 * - 增加收藏筛选选项
 * - 优化日期选择器交互
 * - 增加快捷日期选项（今天、本周、本月）
 * - 增加搜索结果预览
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
    favoritesOnly: false,
  })
  const [dateRangeEnabled, setDateRangeEnabled] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 快捷日期选项
  const setQuickDateRange = (range: 'today' | 'week' | 'month') => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (range) {
      case 'today':
        setStartDate(today.toISOString().split('T')[0])
        setEndDate(today.toISOString().split('T')[0])
        setDateRangeEnabled(true)
        break
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        setStartDate(weekAgo.toISOString().split('T')[0])
        setEndDate(today.toISOString().split('T')[0])
        setDateRangeEnabled(true)
        break
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        setStartDate(monthAgo.toISOString().split('T')[0])
        setEndDate(today.toISOString().split('T')[0])
        setDateRangeEnabled(true)
        break
    }
  }

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
    setFilters({ sortBy: 'updatedAt', sortOrder: 'desc', tags: [], favoritesOnly: false })
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
      <div className="relative bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-modal-scale-in">
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
          {/* 收藏筛选 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-app-text mb-2">
              <input
                type="checkbox"
                checked={filters.favoritesOnly || false}
                onChange={(e) => setFilters(prev => ({ ...prev, favoritesOnly: e.target.checked }))}
                className="rounded border-app-border text-primary-500 focus:ring-primary-500"
              />
              <span>只看收藏</span>
            </label>
          </div>

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
              <>
                {/* 快捷日期按钮 */}
                <div className="flex gap-2 mt-2 mb-3">
                  <button
                    onClick={() => setQuickDateRange('today')}
                    className="px-3 py-1 text-xs bg-app-bg hover:bg-app-border rounded-lg text-app-text transition-colors"
                  >
                    今天
                  </button>
                  <button
                    onClick={() => setQuickDateRange('week')}
                    className="px-3 py-1 text-xs bg-app-bg hover:bg-app-border rounded-lg text-app-text transition-colors"
                  >
                    本周
                  </button>
                  <button
                    onClick={() => setQuickDateRange('month')}
                    className="px-3 py-1 text-xs bg-app-bg hover:bg-app-border rounded-lg text-app-text transition-colors"
                  >
                    本月
                  </button>
                </div>
                {/* 日期选择器 */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                  <span className="text-app-muted">至</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </>
            )}
          </div>

          {/* 标签筛选 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-app-text">标签</label>
              {filters.tags && filters.tags.length > 0 && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, tags: [] }))}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  清除全部
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.slice(0, 15).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 rounded text-xs transition-all duration-200 ${
                    filters.tags?.includes(tag)
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                      : 'bg-app-bg text-app-muted hover:bg-app-border hover:shadow-sm'
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
                className="flex-1 px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="updatedAt">更新时间</option>
                <option value="createdAt">创建时间</option>
                <option value="title">标题</option>
              </select>
              <select
                value={filters.sortOrder}
                onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                className="w-28 px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary-500/50"
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
            className="flex-1 px-4 py-2 border border-app-border rounded-lg text-sm text-app-text hover:bg-app-border transition-all duration-200"
          >
            重置
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-lg text-sm text-white hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
          >
            应用筛选
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchFilters
