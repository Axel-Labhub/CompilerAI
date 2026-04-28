/**
 * MeetingNotesModal 组件
 * 会议纪要处理 - 从混乱的会议记录中提取结构化信息
 */

import React, { useState } from 'react'
import type { MeetingSummary } from '../types'
import { aiProcessMeetingNotes, buildMeetingNotesContent } from '../lib/ai'

interface MeetingNotesModalProps {
  onClose: () => void
  onInsertContent?: (content: string) => void
}

export const MeetingNotesModal: React.FC<MeetingNotesModalProps> = ({
  onClose,
  onInsertContent,
}) => {
  const [inputText, setInputText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<MeetingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 处理会议记录
  const handleProcess = async () => {
    if (!inputText.trim()) {
      setError('请粘贴会议记录内容')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const summary = await aiProcessMeetingNotes(inputText)
      setResult(summary)
    } catch (err) {
      setError('处理失败，请重试')
      console.error('处理会议纪要失败:', err)
    } finally {
      setProcessing(false)
    }
  }

  // 复制结果
  const handleCopy = async () => {
    if (!result) return
    
    try {
      const content = buildMeetingNotesContent(result)
      await navigator.clipboard.writeText(content)
      alert('已复制到剪贴板！')
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 插入到笔记
  const handleInsert = () => {
    if (!result || !onInsertContent) return
    const content = buildMeetingNotesContent(result)
    onInsertContent(content)
    onClose()
  }

  // 下载结果
  const handleDownload = () => {
    if (!result) return
    
    const content = buildMeetingNotesContent(result)
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `会议纪要_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 重置
  const handleReset = () => {
    setInputText('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-app-card border border-app-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-app-text">会议纪要处理</h2>
              <p className="text-sm text-app-muted">粘贴会议记录，AI 将自动提取关键信息</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-app-border text-app-muted hover:text-app-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden flex flex-col p-4">
          {!result ? (
            <>
              {/* 输入区域 */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-app-muted">粘贴会议记录</span>
                  <span className="text-xs text-app-muted">
                    {inputText.length} 字符
                  </span>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="请粘贴原始会议记录内容...
                  
示例：
今天下午开了个产品评审会，张三主持的
李四说用户反馈登录很慢，王五说可能是接口问题
最后决定先做性能优化，下周三之前完成
张三分负责前端优化，李四负责后端
高优先级处理，有风险的话及时同步"
                  className="flex-1 w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              {/* 提示信息 */}
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-400 mb-2">💡 支持识别以下内容：</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-app-muted">
                  <span>• 待办事项及负责人</span>
                  <span>• 决策结论</span>
                  <span>• 讨论要点</span>
                  <span>• 风险点</span>
                  <span>• 时间线</span>
                  <span>• 会议信息</span>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* 按钮 */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-app-muted hover:text-app-text transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processing || !inputText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      处理中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      开始处理
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* 结果区域 */}
              <div className="flex-1 overflow-y-auto">
                {/* 会议信息 */}
                {result.meetingInfo && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-400 mb-2">📋 会议信息</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs text-app-muted">
                      {result.meetingInfo.date && <span>时间：{result.meetingInfo.date}</span>}
                      {result.meetingInfo.host && <span>主持：{result.meetingInfo.host}</span>}
                      {result.meetingInfo.location && <span>地点：{result.meetingInfo.location}</span>}
                      {result.meetingInfo && result.meetingInfo.participants && result.meetingInfo.participants.length > 0 && (
                  <span className="col-span-2">参与：{result.meetingInfo.participants.join('、')}</span>
                )}
                    </div>
                  </div>
                )}

                {/* 一句话摘要 */}
                {result.summary && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h3 className="text-sm font-medium text-green-400 mb-1">📌 会议摘要</h3>
                    <p className="text-sm text-app-text">{result.summary}</p>
                  </div>
                )}

                {/* 待办事项 */}
                {result.todos.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-app-text mb-2">
                      ✅ 待办事项 <span className="text-app-muted">({result.todos.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {result.todos.map((todo, index) => (
                        <div key={index} className="p-3 bg-app-bg border border-app-border rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-app-muted text-sm">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="text-sm text-app-text">{todo.task}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-app-muted">
                                {todo.assignee && <span>👤 {todo.assignee}</span>}
                                {todo.deadline && <span>📅 {todo.deadline}</span>}
                                {todo.priority && (
                                  <span className={`${
                                    todo.priority === 'high' ? 'text-red-400' :
                                    todo.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                  }`}>
                                    {todo.priority === 'high' ? '🔴高' :
                                     todo.priority === 'medium' ? '🟡中' : '🟢低'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 决策结论 */}
                {result.decisions.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-app-text mb-2">
                      🎯 决策结论 <span className="text-app-muted">({result.decisions.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {result.decisions.map((decision, index) => (
                        <div key={index} className="p-3 bg-app-bg border border-app-border rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-app-muted text-sm">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="text-sm text-app-text">{decision.content}</p>
                              {decision.rationale && (
                                <p className="text-xs text-app-muted mt-1">理由：{decision.rationale}</p>
                              )}
                              {decision.decisionMaker && (
                                <p className="text-xs text-app-muted">决策者：{decision.decisionMaker}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 讨论要点 */}
                {result.discussionPoints.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-app-text mb-2">
                      💬 讨论要点 <span className="text-app-muted">({result.discussionPoints.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {result.discussionPoints.map((point, index) => (
                        <div key={index} className="p-3 bg-app-bg border border-app-border rounded-lg flex items-start gap-2">
                          <span className="text-app-muted text-sm">{index + 1}.</span>
                          <p className="text-sm text-app-text">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 风险点 */}
                {result.risks.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-app-text mb-2">
                      ⚠️ 风险点 <span className="text-app-muted">({result.risks.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {result.risks.map((risk, index) => (
                        <div key={index} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-red-400 text-sm">{index + 1}.</span>
                            <div className="flex-1">
                              <p className="text-sm text-app-text">{risk.description}</p>
                              {risk.impact && (
                                <p className="text-xs text-app-muted mt-1">影响：{risk.impact}</p>
                              )}
                              {risk.mitigation && (
                                <p className="text-xs text-green-400 mt-1">缓解：{risk.mitigation}</p>
                              )}
                              {risk.severity && (
                                <span className={`inline-block mt-1 text-xs ${
                                  risk.severity === 'high' ? 'text-red-400' :
                                  risk.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                  {risk.severity === 'high' ? '🔴高风险' :
                                   risk.severity === 'medium' ? '🟡中风险' : '🟢低风险'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 时间线 */}
                {result.timeline.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-app-text mb-2">
                      ⏱️ 会议时间线 <span className="text-app-muted">({result.timeline.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {result.timeline.map((item, index) => (
                        <div key={index} className="p-3 bg-app-bg border border-app-border rounded-lg">
                          <div className="flex items-start gap-2">
                            {item.time && (
                              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded">
                                {item.time}
                              </span>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-app-text">{item.topic}</p>
                              {item.speaker && (
                                <p className="text-xs text-app-muted mt-1">发言人：{item.speaker}</p>
                              )}
                              {item.keyPoints && item.keyPoints.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {item.keyPoints!.map((point, i) => (
                                    <p key={i} className="text-xs text-app-muted">• {point}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 统计信息 */}
                <div className="mt-4 p-3 bg-app-bg border border-app-border rounded-lg">
                  <div className="flex items-center justify-center gap-6 text-xs text-app-muted">
                    <span>待办 {result.todos.length}</span>
                    <span>•</span>
                    <span>决策 {result.decisions.length}</span>
                    <span>•</span>
                    <span>讨论 {result.discussionPoints.length}</span>
                    <span>•</span>
                    <span>风险 {result.risks.length}</span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-4 flex justify-between">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-app-muted hover:text-app-text transition-colors"
                >
                  重新处理
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 text-sm text-app-text border border-app-border rounded-lg hover:bg-app-border/50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载
                  </button>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 text-sm text-app-text border border-app-border rounded-lg hover:bg-app-border/50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    复制
                  </button>
                  {onInsertContent && (
                    <button
                      onClick={handleInsert}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      插入笔记
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MeetingNotesModal
