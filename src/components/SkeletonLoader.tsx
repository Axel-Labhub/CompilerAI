/**
 * SkeletonLoader 组件
 * 骨架屏加载状态
 */

import React from 'react'

// 笔记卡片骨架屏
export const NoteCardSkeleton: React.FC = () => {
  return (
    <div className="bg-app-card border border-app-border rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 bg-app-border rounded w-3/4" />
        <div className="h-4 w-4 bg-app-border rounded" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-app-border rounded w-full" />
        <div className="h-3 bg-app-border rounded w-5/6" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-app-border rounded" />
          <div className="h-5 w-12 bg-app-border rounded" />
        </div>
        <div className="h-3 w-16 bg-app-border rounded" />
      </div>
    </div>
  )
}

// 笔记列表骨架屏
export const NoteListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// 加载动画
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({ size = 'md', text }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size]

  return (
    <div className="flex items-center gap-2">
      <svg className={`${sizeClass} animate-spin text-primary-500`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      {text && <span className="text-sm text-app-muted">{text}</span>}
    </div>
  )
}

// AI 处理进度动画 - 增强版
export const AIProcessingIndicator: React.FC<{ message?: string }> = ({ message = 'AI 处理中...' }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-primary-500/10 to-transparent rounded-lg border border-primary-500/20">
      <div className="relative w-7 h-7">
        {/* 外圈 */}
        <svg className="w-7 h-7 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {/* 内部星星 */}
        <span className="absolute inset-0 flex items-center justify-center text-xs">✨</span>
      </div>
      <div>
        <p className="text-sm font-medium text-primary-400">{message}</p>
        <p className="text-xs text-app-muted">正在分析内容</p>
      </div>
      {/* 脉冲点动画 */}
      <div className="flex gap-1 ml-2">
        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

// 保存中动画
export const SavingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 text-sm text-primary-400">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      保存中...
    </div>
  )
}

export const SkeletonLoader = {
  NoteCardSkeleton,
  NoteListSkeleton,
  LoadingSpinner,
  AIProcessingIndicator,
  SavingIndicator,
}
