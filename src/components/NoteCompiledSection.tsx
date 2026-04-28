/**
 * NoteCompiledSection 组件
 * 编译真相架构 - 结论区组件
 * 显示 AI 生成的核心结论和关键洞察，支持手动编辑
 * 
 * 设计理念：
 * - 上线区（编译真相）：AI 提炼的精华结论，高亮呈现
 * - 下线区（原始记录）：保留原始笔记内容，随时可查
 * - 价值感知：通过视觉层次和交互引导用户理解"提炼"的价值
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
      <div className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-purple-900/30 
                      border border-purple-500/40 rounded-xl p-5 mb-4 overflow-hidden
                      shadow-lg shadow-purple-900/20">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 
                              flex items-center justify-center text-lg shadow-lg shadow-purple-500/30">
                🔮
              </div>
              <div>
                <h3 className="text-base font-semibold text-purple-200">编译真相</h3>
                <p className="text-xs text-purple-400/70">AI 智能提炼 · 结论升华</p>
              </div>
            </div>
            <button
              onClick={onCompile}
              disabled={isCompiling}
              className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 
                         hover:from-purple-500 hover:to-indigo-500 disabled:from-purple-600/50 disabled:to-indigo-600/50
                         text-white rounded-lg transition-all duration-200 
                         flex items-center gap-2 shadow-lg shadow-purple-500/30
                         hover:shadow-purple-500/50 hover:-translate-y-0.5 active:scale-95"
            >
              {isCompiling ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>AI 编译中...</span>
                </>
              ) : (
                <>
                  <span className="text-base">✨</span>
                  <span>编译笔记</span>
                </>
              )}
            </button>
          </div>
          
          {/* 价值说明 */}
          <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <div className="text-purple-400 mt-0.5">💡</div>
              <div className="text-sm text-gray-300 leading-relaxed">
                <p className="mb-2">
                  <span className="text-purple-300 font-medium">一键提炼，散落笔记 → 精华结论</span>
                </p>
                <p className="text-xs text-gray-400">
                  AI 将从你的工作记录中提取核心结论和关键洞察，
                  生成可沉淀、可复用的「编译真相」。
                </p>
              </div>
            </div>
            
            {/* 流程示意 */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
              <span className="px-2 py-1 bg-gray-800/50 rounded">📝 原始笔记</span>
              <span className="text-purple-400">→</span>
              <span className="px-2 py-1 bg-purple-900/50 rounded">🔮 AI 提炼</span>
              <span className="text-purple-400">→</span>
              <span className="px-2 py-1 bg-gradient-to-r from-purple-800/50 to-indigo-800/50 rounded border border-purple-500/30">
                ✨ 编译真相
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 已编译状态
  return (
    <div className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-purple-900/30 
                    border border-purple-500/40 rounded-xl mb-4 overflow-hidden
                    shadow-lg shadow-purple-900/20">
      {/* 顶部装饰条 - 区分上线区 */}
      <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500" />
      
      {/* 头部 - 可折叠 */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-purple-900/20 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 
                          flex items-center justify-center text-sm shadow-md shadow-purple-500/20">
            🔮
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-purple-200">编译真相</h3>
              {compiled.isManualEdit && (
                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded border border-yellow-500/30">
                  已手动编辑
                </span>
              )}
            </div>
            <span className="text-[10px] text-purple-400/60">
              {formatCompileTime(compiled.lastCompiled)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCompile()
            }}
            disabled={isCompiling}
            className="px-3 py-1.5 text-xs bg-purple-600/50 hover:bg-purple-500/50 disabled:opacity-50
                       text-white rounded-lg transition-all flex items-center gap-1.5
                       hover:-translate-y-0.5 active:scale-95"
            title="重新编译"
          >
            {isCompiling ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>编译中</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>重新编译</span>
              </>
            )}
          </button>
          <span className="text-purple-400 text-sm transition-transform duration-200" 
                style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
      </div>

      {/* 内容区 - 可展开/折叠 */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-5">
          {/* 上线区：核心结论 - 高亮展示 */}
          <div className="relative">
            <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
            
            <div className="flex items-center justify-between mb-3 pl-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">核心结论</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded border border-green-500/30">
                  上线区
                </span>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded hover:bg-purple-500/20"
                >
                  ✏️ 编辑
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-3 pl-2">
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full h-24 px-4 py-3 bg-gray-800/60 border border-purple-500/40 rounded-lg
                           text-sm text-gray-200 resize-none focus:outline-none focus:border-purple-400 
                           focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="输入核心结论..."
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-1.5 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 
                               rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 
                               hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <div className="pl-2 bg-gradient-to-r from-purple-900/30 to-transparent rounded-lg p-4 border-l-2 border-purple-500/50">
                <p className="text-sm text-gray-200 leading-relaxed">
                  {compiled.summary}
                </p>
              </div>
            )}
          </div>

          {/* 分割线 */}
          <div className="border-t border-purple-500/20" />
          
          {/* 下线区：关键洞察 */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-indigo-400 uppercase tracking-wider">关键洞察</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                下线区
              </span>
              <span className="text-xs text-gray-500">({compiled.insights.length} 条)</span>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                {editInsights.map((insight, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <span className="text-indigo-400 mt-1.5 w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={insight}
                      onChange={(e) => handleInsightChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800/60 border border-indigo-500/30 rounded-lg
                               text-xs text-gray-200 focus:outline-none focus:border-indigo-400 
                               focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      placeholder="输入洞察..."
                    />
                    <button
                      onClick={() => handleRemoveInsight(index)}
                      className="px-2 py-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 
                                 rounded transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddInsight}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors 
                             flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-500/10"
                >
                  <span>+</span> 添加洞察
                </button>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-1.5 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 
                               rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 text-xs bg-gradient-to-r from-indigo-600 to-purple-600 
                               hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {compiled.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-gray-800/30 
                                            rounded-lg border border-indigo-500/20 hover:border-indigo-500/40 
                                            transition-colors">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center 
                                     text-[10px] text-indigo-400 font-medium shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-300 leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* 底部价值提示 */}
          <div className="text-center text-[10px] text-gray-500 pt-2 border-t border-purple-500/10">
            💡 这些洞察来自你的工作记录，已为你提炼升华
          </div>
        </div>
      )}
    </div>
  )
}

export default NoteCompiledSection
