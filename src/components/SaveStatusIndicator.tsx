/**
 * SaveStatusIndicator 组件
 * 保存状态指示器
 */

import React from 'react'

type SaveStatus = 'saved' | 'saving' | 'unsaved'

interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSavedAt?: Date | null
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status, lastSavedAt }) => {
  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>已保存</span>
            {lastSavedAt && (
              <span className="text-dark-muted">{formatTime(lastSavedAt)}</span>
            )}
          </div>
        )
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-xs text-primary-400">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>保存中...</span>
          </div>
        )
      case 'unsaved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-yellow-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>未保存</span>
          </div>
        )
    }
  }

  return (
    <div className="flex items-center">
      {getStatusDisplay()}
    </div>
  )
}

export default SaveStatusIndicator
