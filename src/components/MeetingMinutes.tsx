/**
 * MeetingMinutes 组件
 * 会议纪要 - 快速生成专业的会议记录
 */

import React, { useState } from 'react'

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

  const handleGenerate = () => {
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
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-app-card border border-app-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-lg font-semibold text-app-text">会议纪要</h2>
              <p className="text-xs text-app-muted">快速记录会议要点和行动项</p>
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

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 基础信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-text mb-1.5">
                会议主题
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="如：产品评审会"
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500"
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
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text focus:outline-none focus:border-primary-500"
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
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500"
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
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
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
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
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
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
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
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none font-mono"
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
              className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-5 py-4 border-t border-app-border flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-app-muted hover:text-app-text transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleGenerate}
            className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>✨</span>
            生成纪要
          </button>
        </div>
      </div>
    </div>
  )
}

export default MeetingMinutes
