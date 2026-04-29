/**
 * MeetingMinutes 组件（优化版）
 * 会议纪要 - 快速生成专业的会议记录
 * 使用 BaseModal 进行优化
 */

import React, { useState } from 'react'
import { BaseModal } from './BaseModal'

interface MeetingMinutesProps {
  onClose: () => void
  onCreateNote: (title: string, content: string, tags: string[]) => void
}

export const MeetingMinutes: React.FC<MeetingMinutesProps> = ({
  onClose,
  onCreateNote,
}) => {
  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0])
  const [attendees, setAttendees] = useState('')
  const [agenda, setAgenda] = useState('')
  const [discussions, setDiscussions] = useState('')
  const [decisions, setDecisions] = useState('')
  const [actionItems, setActionItems] = useState('')
  const [nextMeeting, setNextMeeting] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [isAIProcessing, setIsAIProcessing] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    // 模拟生成过程
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const title = meetingTitle || `会议纪要 - ${meetingDate}`
    
    const content = `## 会议信息

- **日期**：${meetingDate}
- **参会人**：${attendees || '未记录'}
- **下次会议**：${nextMeeting || '待定'}

## 议程

${agenda || '无'}

## 讨论内容

${discussions || '无'}

## 决议

${decisions || '无'}

## 行动项

${actionItems || '无'}

---
*本纪要由编译器自动生成*`

    const tags = ['会议', '纪要']
    onCreateNote(title, content, tags)
    setIsGenerating(false)
    onClose()
  }

  // AI 辅助填充功能
  const handleAIAssist = async () => {
    if (!aiInput.trim()) return
    
    setIsAIProcessing(true)
    
    // 模拟 AI 处理
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 简单解析输入，智能填充字段
    const lines = aiInput.split('\n').filter(l => l.trim())
    
    const newState: Record<string, string> = {}
    
    // 简单关键词匹配
    lines.forEach(line => {
      const lower = line.toLowerCase()
      if (lower.includes('主题') || lower.includes('议题')) {
        newState.meetingTitle = line.replace(/^[^\s]+\s*/, '').trim()
      } else if (lower.includes('参会') || lower.includes('参加') || lower.includes('人')) {
        newState.attendees = line.replace(/^[^\s]+\s*/, '').trim()
      } else if (lower.includes('决议') || lower.includes('决定') || lower.includes('结论')) {
        newState.decisions = (newState.decisions || '') + line.replace(/^[^\s]+\s*/, '').trim() + '\n'
      } else if (lower.includes('行动') || lower.includes('任务') || lower.includes('@') || /\d+/.test(lower)) {
        newState.actionItems = (newState.actionItems || '') + '• ' + line.replace(/^[^\s]+\s*/, '').trim() + '\n'
      } else if (lower.includes('下次') || lower.includes('下次会议')) {
        newState.nextMeeting = line.replace(/^[^\s]+\s*/, '').trim()
      } else if (!newState.agenda) {
        newState.agenda = (newState.agenda || '') + '• ' + line.trim() + '\n'
      }
    })
    
    // 应用识别结果
    if (newState.meetingTitle) setMeetingTitle(newState.meetingTitle)
    if (newState.attendees) setAttendees(newState.attendees)
    if (newState.decisions) setDecisions(prev => prev + newState.decisions)
    if (newState.actionItems) setActionItems(prev => prev + newState.actionItems)
    if (newState.nextMeeting) setNextMeeting(newState.nextMeeting)
    if (newState.agenda && !agenda) setAgenda(newState.agenda)
    
    setAiInput('')
    setShowAIPanel(false)
    setIsAIProcessing(false)
  }

  // 自定义 Header 图标
  const HeaderIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="会议纪要"
      description="快速记录会议要点和行动项"
      icon={HeaderIcon}
      iconBgClass="bg-blue-500/20"
      iconColorClass="text-blue-400"
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all flex items-center gap-2 ${
              showAIPanel 
                ? 'bg-primary-500/20 text-primary-400' 
                : 'text-app-muted hover:text-primary-400 hover:bg-primary-500/10'
            }`}
          >
            <span>✨</span>
            AI 辅助
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-app-muted hover:text-app-text hover:bg-app-border/50 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed text-white text-sm rounded-lg font-medium transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <span>✨</span>
                  生成纪要
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="p-5 space-y-4">
        {/* AI 辅助面板 */}
        {showAIPanel && (
          <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <span className="text-sm font-medium text-primary-400">AI 智能填充</span>
            </div>
            <p className="text-xs text-app-muted mb-3">
              输入会议要点，AI 将自动识别并填充对应字段（决议、行动项等）
            </p>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="输入会议要点，例如：
主题：产品评审会
参会人：张三、李四
决议：上线新功能A
行动项：@张三 周五前完成测试
下次会议：下周三14:00"
              rows={4}
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => setShowAIPanel(false)}
                className="px-3 py-1.5 text-xs text-app-muted hover:text-app-text transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAIAssist}
                disabled={isAIProcessing || !aiInput.trim()}
                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                {isAIProcessing ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    处理中...
                  </>
                ) : (
                  <>智能填充</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 基础信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-app-text mb-1.5">
              会议主题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="如：产品评审会"
              className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-app-text mb-1.5">
              会议日期
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">
            参会人员
          </label>
          <input
            type="text"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="如：张三、李四、王五"
            className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">
            议程
          </label>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="本次会议的议程安排..."
            rows={3}
            className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">
            讨论内容
          </label>
          <textarea
            value={discussions}
            onChange={(e) => setDiscussions(e.target.value)}
            placeholder="会议中讨论的主要内容和观点..."
            rows={4}
            className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">
            决议
          </label>
          <textarea
            value={decisions}
            onChange={(e) => setDecisions(e.target.value)}
            placeholder="会议中做出的决定..."
            rows={3}
            className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">
            行动项
          </label>
          <textarea
            value={actionItems}
            onChange={(e) => setActionItems(e.target.value)}
            placeholder="任务1：[@人] [截止日期] [描述]
任务2：[@人] [截止日期] [描述]"
            rows={3}
            className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none transition-all font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-app-text mb-1.5">
            下次会议
          </label>
          <input
            type="text"
            value={nextMeeting}
            onChange={(e) => setNextMeeting(e.target.value)}
            placeholder="如：下周三 14:00"
            className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          />
        </div>
      </div>
    </BaseModal>
  )
}

export default MeetingMinutes
