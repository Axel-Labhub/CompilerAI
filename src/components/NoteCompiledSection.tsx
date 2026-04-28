/**
 * NoteCompiledSection 组件
 * 编译真相架构 - 结论区组件
 * 显示 AI 生成的核心结论和关键洞察，支持手动编辑
 */

import React, { useState, useEffect } from 'react'
import type { CompiledSection } from '../types'
import { formatCompileTime } from '../lib/compiler'

interface NoteCompiledSectionProps {
  compiled: CompiledSection | null | undefined
  onCompile: () => Promise<void>
  onUpdateSummary: (summary: string) => void
  onUpdateInsights: (insights: string[]) => void
  isCompiling?: boolean
}

export const NoteCompiledSection: React.FC<NoteCompiledSectionProps> = ({
  compiled,
  onCompile,
  onUpdateSummary,
  onUpdateInsights,
  isCompiling = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editSummary, setEditSummary] = useState('')
  const [editInsights, setEditInsights] = useState<string[]>([])

  // 初始化编辑状态
  useEffect(() => {
    if (compiled) {
      setEditSummary(compiled.summary)
      setEditInsights([...compiled.insights])
    }
  }, [compiled])

  const handleSaveEdit = () => {
    if (editSummary.trim()) {
      onUpdateSummary(editSummary.trim())
    }
    if (editInsights.length > 0) {
      onUpdateInsights(editInsights.filter(i => i.trim()))
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (compiled) {
      setEditSummary(compiled.summary)
      setEditInsights([...compiled.insights])
    }
    setIsEditing(false)
  }

  const handleInsightChange = (index: number, value: string) => {
    const newInsights = [...editInsights]
    newInsights[index] = value
    setEditInsights(newInsights)
  }

  const handleAddInsight = () => {
    setEditInsights([...editInsights, ''])
  }

  const handleRemoveInsight = (index: number) => {
    const newInsights = editInsights.filter((_, i) => i !== index)
    setEditInsights(newInsights)
  }

  // 未编译状态
  if (!compiled) {
    return (
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔮</span>
            <h3 className="text-sm font-medium text-purple-300">编译真相</h3>
          </div>
          <button
            onClick={onCompile}
            disabled={isCompiling}
            className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 
                       text-white rounded-md transition-colors flex items-center gap-1.5"
          >
            {isCompiling ? (
              <>
                <span className="animate-spin">⏳</span>
                编译中...
              </>
            ) : (
              <>
                <span>✨</span>
                编译笔记
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          点击「编译笔记」，AI 将从内容中提取核心结论和关键洞察，
          生成属于你的「编译真相」。
        </p>
      </div>
    )
  }

  // 已编译状态
  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 rounded-lg mb-4 overflow-hidden">
      {/* 头部 - 可折叠 */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-900/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{isExpanded ? '🔮' : '🔮'}</span>
          <h3 className="text-sm font-medium text-purple-300">编译真相</h3>
          {compiled.isManualEdit && (
            <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">
              已手动编辑
            </span>
          )}
          <span className="text-[10px] text-gray-500">
            {formatCompileTime(compiled.lastCompiled)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCompile()
            }}
            disabled={isCompiling}
            className="px-2 py-1 text-xs bg-purple-600/50 hover:bg-purple-500/50 disabled:opacity-50
                       text-white rounded transition-colors flex items-center gap-1"
            title="重新编译"
          >
            {isCompiling ? '⏳' : '🔄'}
          </button>
          <span className="text-purple-400 text-sm transition-transform" 
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </div>

      {/* 内容区 - 可展开/折叠 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* 核心结论 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-purple-400 uppercase tracking-wide">
                核心结论
              </h4>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                >
                  编辑
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full h-20 px-3 py-2 bg-gray-800/50 border border-purple-500/30 rounded-md
                           text-sm text-gray-200 resize-none focus:outline-none focus:border-purple-500"
                  placeholder="输入核心结论..."
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-200 leading-relaxed">
                {compiled.summary}
              </p>
            )}
          </div>

          {/* 分割线 */}
          <div className="border-t border-purple-500/20" />

          {/* 关键洞察 */}
          <div>
            <h4 className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-2">
              关键洞察 ({compiled.insights.length})
            </h4>
            
            {isEditing ? (
              <div className="space-y-2">
                {editInsights.map((insight, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-purple-400 mt-1.5">•</span>
                    <input
                      type="text"
                      value={insight}
                      onChange={(e) => handleInsightChange(index, e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-gray-800/50 border border-purple-500/30 rounded
                               text-xs text-gray-200 focus:outline-none focus:border-purple-500"
                      placeholder="输入洞察..."
                    />
                    <button
                      onClick={() => handleRemoveInsight(index)}
                      className="px-1.5 py-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddInsight}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <span>+</span> 添加洞察
                </button>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {compiled.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NoteCompiledSection
