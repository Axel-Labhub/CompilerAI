/**
 * DreamCycleReport 组件
 * 梦境循环整理报告 - 显示笔记整理结果和建议
 */

import React, { useState } from 'react'
import type { DreamCycleReport as DreamCycleReportType, DreamSuggestion } from '../types'
import { formatReportTime } from '../lib/dreamCycle'

interface DreamCycleReportProps {
  report: DreamCycleReportType | null
  isRunning: boolean
  onRun: () => Promise<void>
  onClose: () => void
  onNavigateToNote?: (noteId: string) => void
}

export const DreamCycleReport: React.FC<DreamCycleReportProps> = ({
  report,
  isRunning,
  onRun,
  onClose,
  onNavigateToNote,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['suggestions']))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleSuggestionClick = (suggestion: DreamSuggestion) => {
    if (onNavigateToNote && suggestion.relatedNoteIds.length > 0) {
      onNavigateToNote(suggestion.relatedNoteIds[0])
    }
  }

  // 正在运行状态
  if (isRunning) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-4xl animate-pulse">🌙</div>
          <div className="text-lg font-medium text-indigo-300">梦境循环运行中...</div>
          <div className="text-sm text-gray-400">
            正在扫描笔记，检测相似内容和断裂链接
          </div>
          <div className="w-48 h-1 bg-indigo-900/50 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    )
  }

  // 无报告状态
  if (!report) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-4xl">🌙</div>
          <div className="text-lg font-medium text-indigo-300">梦境循环</div>
          <div className="text-sm text-gray-400 text-center max-w-sm">
            夜间自动整理笔记，检测相似内容、修复断裂链接、整理知识结构
          </div>
          <button
            onClick={onRun}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span>✨</span>
            运行整理
          </button>
        </div>
      </div>
    )
  }

  const totalIssues = report.similarPairs.length + report.brokenLinks.length
  const hasSuggestions = report.suggestions.length > 0

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-lg overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌙</span>
            <div>
              <h2 className="text-lg font-medium text-indigo-200">梦境循环报告</h2>
              <p className="text-xs text-gray-400">
                {formatReportTime(report.timestamp)} · 分析了 {report.notesAnalyzed} 篇笔记
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRun}
              className="px-3 py-1.5 text-xs bg-indigo-600/50 hover:bg-indigo-500/50 text-white rounded transition-colors"
            >
              重新运行
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-indigo-900/50 rounded text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="flex items-center gap-4 mt-4">
          <div className={`px-3 py-1.5 rounded-full text-xs ${totalIssues > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}`}>
            {totalIssues > 0 ? `⚠️ ${totalIssues} 个问题待处理` : '✅ 无问题发现'}
          </div>
          {hasSuggestions && (
            <div className="px-3 py-1.5 rounded-full text-xs bg-purple-500/20 text-purple-300">
              💡 {report.suggestions.length} 条建议
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-h-96 overflow-y-auto">
        {/* 建议列表 */}
        {hasSuggestions && (
          <div className="border-b border-indigo-500/20">
            <button
              onClick={() => toggleSection('suggestions')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">💡</span>
                <span className="text-sm font-medium text-indigo-200">整理建议</span>
                <span className="text-xs text-gray-500">({report.suggestions.length})</span>
              </div>
              <span className={`text-gray-400 transition-transform ${expandedSections.has('suggestions') ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.has('suggestions') && (
              <div className="px-4 pb-4 space-y-2">
                {report.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      suggestion.type === 'merge' ? 'bg-blue-900/30 hover:bg-blue-900/50' :
                      suggestion.type === 'link' ? 'bg-amber-900/30 hover:bg-amber-900/50' :
                      suggestion.type === 'tag' ? 'bg-green-900/30 hover:bg-green-900/50' :
                      'bg-gray-900/30 hover:bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg mt-0.5">
                        {suggestion.type === 'merge' ? '🔀' :
                         suggestion.type === 'link' ? '🔗' :
                         suggestion.type === 'tag' ? '🏷️' : '📦'}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-200">{suggestion.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                        {suggestion.actionItems.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {suggestion.actionItems.slice(0, 3).map((item, i) => (
                              <li key={i} className="text-xs text-gray-500 flex items-start gap-1">
                                <span className="text-indigo-400">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 相似笔记 */}
        {report.similarPairs.length > 0 && (
          <div className="border-b border-indigo-500/20">
            <button
              onClick={() => toggleSection('similar')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">🔀</span>
                <span className="text-sm font-medium text-indigo-200">相似笔记</span>
                <span className="text-xs text-gray-500">({report.similarPairs.length})</span>
              </div>
              <span className={`text-gray-400 transition-transform ${expandedSections.has('similar') ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.has('similar') && (
              <div className="px-4 pb-4 space-y-2">
                {report.similarPairs.slice(0, 5).map((pair, index) => (
                  <div key={index} className="p-3 bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer"
                          onClick={() => onNavigateToNote?.(pair.note1.id)}
                        >
                          {pair.note1.title}
                        </span>
                        <span className="text-gray-500">↔</span>
                        <span 
                          className="text-sm text-indigo-400 hover:text-indigo-300 cursor-pointer"
                          onClick={() => onNavigateToNote?.(pair.note2.id)}
                        >
                          {pair.note2.title}
                        </span>
                      </div>
                      <span className="text-xs text-blue-400">
                        {Math.round(pair.similarity * 100)}% 相似
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{pair.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 断裂链接 */}
        {report.brokenLinks.length > 0 && (
          <div className="border-b border-indigo-500/20">
            <button
              onClick={() => toggleSection('broken')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-400">⚠️</span>
                <span className="text-sm font-medium text-amber-200">断裂链接</span>
                <span className="text-xs text-gray-500">({report.brokenLinks.length})</span>
              </div>
              <span className={`text-gray-400 transition-transform ${expandedSections.has('broken') ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {expandedSections.has('broken') && (
              <div className="px-4 pb-4 space-y-2">
                {report.brokenLinks.slice(0, 5).map((link, index) => (
                  <div key={index} className="p-3 bg-amber-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">
                        「{link.sourceTitle}」
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className="text-sm text-amber-400">
                        [[{link.targetTitle}]]
                      </span>
                      <span className="text-xs text-amber-600">(不存在)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{link.context}</p>
                  </div>
                ))}
                {report.brokenLinks.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    还有 {report.brokenLinks.length - 5} 个断裂链接...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 空状态 */}
        {!hasSuggestions && report.similarPairs.length === 0 && report.brokenLinks.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-3xl mb-2">✨</div>
            <p className="text-gray-400">你的知识库状态良好，无需整理</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DreamCycleReport
