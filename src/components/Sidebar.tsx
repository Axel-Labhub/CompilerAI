/**
 * Sidebar 组件
 * 侧边栏 - 标签筛选和快捷入口
 */

import React from 'react'
import { TAG_CATEGORIES, getTagColor } from '../types'

interface SidebarProps {
  allTags: string[]
  activeTag: string | null
  onTagClick: (tag: string | null) => void
  onNewNote: () => void
  onOpenWeeklyReport: () => void
  onOpenDreamCycle: () => void
  onOpenHandover: () => void
  onOpenGraph?: () => void
  noteCount: number
  favoriteCount?: number
  onShowFavorites?: () => void
  lastDreamRun?: number | null
}

export const Sidebar: React.FC<SidebarProps> = ({
  allTags,
  activeTag,
  onTagClick,
  onNewNote,
  onOpenWeeklyReport,
  onOpenDreamCycle,
  onOpenHandover,
  onOpenGraph,
  noteCount,
  favoriteCount = 0,
  onShowFavorites,
  lastDreamRun,
}) => {
  return (
    <aside className="w-56 bg-app-card border-r border-app-border flex flex-col h-full">
      {/* 新建笔记按钮 */}
      <div className="p-4">
        <button
          onClick={onNewNote}
          className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建笔记
        </button>
      </div>

      {/* 笔记统计 */}
      <div className="px-4 pb-3">
        <div className="text-xs text-app-muted">
          共 <span className="text-primary-400 font-medium">{noteCount}</span> 条笔记
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto px-2">
        {/* 全部笔记 */}
        <button
          onClick={() => onTagClick(null)}
          className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2 mb-1 transition-colors ${
            activeTag === null
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-app-text hover:bg-app-border/50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          全部笔记
        </button>

        {/* 收藏夹入口 */}
        {favoriteCount > 0 && (
          <button
            onClick={onShowFavorites}
            className="w-full px-3 py-2 rounded-lg text-left text-sm text-app-text hover:bg-app-border/50 flex items-center gap-2 mb-1 transition-colors"
          >
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            收藏夹
            <span className="ml-auto px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              {favoriteCount}
            </span>
          </button>
        )}

        {/* 周报生成入口 */}
        <button
          onClick={onOpenWeeklyReport}
          className="w-full px-3 py-2 rounded-lg text-left text-sm text-app-text hover:bg-app-border/50 flex items-center gap-2 mb-1 transition-colors"
        >
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          生成周报
        </button>

        {/* 关系图谱入口 */}
        {onOpenGraph && (
          <button
            onClick={onOpenGraph}
            className="w-full px-3 py-2 rounded-lg text-left text-sm text-app-text hover:bg-app-border/50 flex items-center gap-2 mb-1 transition-colors"
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            关系图谱
          </button>
        )}

        {/* 梦境循环入口 */}
        <button
          onClick={onOpenDreamCycle}
          className="w-full px-3 py-2 rounded-lg text-left text-sm text-app-text hover:bg-app-border/50 flex items-center gap-2 mb-3 transition-colors"
        >
          <span className="text-lg">🌙</span>
          <div className="flex-1">
            <span>梦境循环</span>
            {lastDreamRun && (
              <div className="text-[10px] text-app-muted">
                上次: {formatLastRun(lastDreamRun)}
              </div>
            )}
          </div>
        </button>

        {/* 离职交接入口 */}
        <button
          onClick={onOpenHandover}
          className="w-full px-3 py-2 rounded-lg text-left text-sm text-app-text hover:bg-app-border/50 flex items-center gap-2 mb-3 transition-colors"
        >
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>离职交接</span>
        </button>

        {/* 分割线 */}
        <div className="border-t border-app-border my-2" />

        {/* 标签分类 */}
        {Object.entries(TAG_CATEGORIES).map(([category, tags]) => (
          <div key={category} className="mb-3">
            <div className="px-3 py-1 text-xs text-app-muted uppercase tracking-wider">
              {getCategoryName(category)}
            </div>
            {tags.filter(tag => allTags.includes(tag)).map(tag => {
              const colors = getTagColor(tag)
              return (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className={`w-full px-3 py-1.5 rounded-lg text-left text-sm flex items-center gap-2 transition-colors ${
                    activeTag === tag
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-app-muted hover:text-app-text hover:bg-app-border/50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                  {tag}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-app-border">
        <div className="text-xs text-app-muted text-center">
          <p>数据存储在本地</p>
          <p className="mt-1 opacity-50">认知源码只属于你 ✨</p>
        </div>
      </div>
    </aside>
  )
}

// 获取分类中文名称
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    work: '工作',
    tech: '技术',
    soft: '软技能',
    project: '项目',
  }
  return names[category] || category
}

// 格式化上次运行时间
function formatLastRun(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return '今天'
  
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export default Sidebar
