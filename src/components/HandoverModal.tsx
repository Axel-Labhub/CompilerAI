/**
 * HandoverModal 组件
 * 离职交接报告生成器
 */

import React, { useState } from 'react'
import type { HandoverReport } from '../types'
import { aiGenerateHandover, buildHandoverContent } from '../lib/ai'

interface HandoverModalProps {
  onClose: () => void
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ onClose }) => {
  // 表单状态
  const [employeeName, setEmployeeName] = useState('')
  const [department, setDepartment] = useState('')
  const [position, setPosition] = useState('')
  const [lastWorkDate, setLastWorkDate] = useState('')
  const [handoverDate, setHandoverDate] = useState('')
  const [projects, setProjects] = useState('')
  const [contacts, setContacts] = useState('')
  const [todos, setTodos] = useState('')
  const [documents, setDocuments] = useState('')
  const [accounts, setAccounts] = useState('')
  const [reminders, setReminders] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // 生成状态
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<HandoverReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 切换标签页
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input')

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeName || !department || !position || !lastWorkDate) {
      setError('请填写必填项：姓名、部门、岗位、最后工作日')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const result = await aiGenerateHandover({
        employeeName,
        department,
        position,
        lastWorkDate,
        handoverDate: handoverDate || lastWorkDate,
        projects: projects || undefined,
        contacts: contacts || undefined,
        todos: todos || undefined,
        documents: documents || undefined,
        accounts: accounts || undefined,
        reminders: reminders || undefined,
        additionalNotes: additionalNotes || undefined,
      })
      setReport(result)
      setActiveTab('preview')
    } catch (err) {
      setError('生成失败，请重试')
      console.error('生成交接报告失败:', err)
    } finally {
      setGenerating(false)
    }
  }

  // 复制报告
  const handleCopy = async () => {
    if (!report) return

    try {
      const content = buildHandoverContent(report)
      await navigator.clipboard.writeText(content)
      alert('已复制到剪贴板！')
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 下载报告
  const handleDownload = () => {
    if (!report) return

    const content = buildHandoverContent(report)
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `离职交接报告_${employeeName}_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 重置表单
  const handleReset = () => {
    setEmployeeName('')
    setDepartment('')
    setPosition('')
    setLastWorkDate('')
    setHandoverDate('')
    setProjects('')
    setContacts('')
    setTodos('')
    setDocuments('')
    setAccounts('')
    setReminders('')
    setAdditionalNotes('')
    setReport(null)
    setActiveTab('input')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-app-card border border-app-border rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-app-text">离职交接报告生成</h2>
              <p className="text-sm text-app-muted">填写离职信息，AI 将生成专业的交接文档</p>
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

        {/* 标签页 */}
        {report && (
          <div className="flex border-b border-app-border">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'input'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              填写信息
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              预览报告
            </button>
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'input' ? (
            /* 左侧：表单输入 */
            <div className="w-full flex flex-col overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* 基本信息 */}
                <div className="bg-app-bg/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-primary-400 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-primary-500/20 flex items-center justify-center text-xs">1</span>
                    基本信息（必填）
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-app-muted mb-1">
                        姓名 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        placeholder="离职员工姓名"
                        className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-app-muted mb-1">
                        部门 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="所属部门"
                        className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-app-muted mb-1">
                        岗位 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="职位名称"
                        className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-app-muted mb-1">
                        最后工作日 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="date"
                        value={lastWorkDate}
                        onChange={(e) => setLastWorkDate(e.target.value)}
                        className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text focus:outline-none focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-app-muted mb-1">
                        交接日期
                      </label>
                      <input
                        type="date"
                        value={handoverDate}
                        onChange={(e) => setHandoverDate(e.target.value)}
                        className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 项目信息 */}
                <div className="bg-app-bg/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center text-xs">2</span>
                    项目交接信息（选填）
                  </h3>
                  <div>
                    <label className="block text-xs text-app-muted mb-1">
                      正在进行的项目
                    </label>
                    <textarea
                      value={projects}
                      onChange={(e) => setProjects(e.target.value)}
                      placeholder={`描述正在进行的项目，格式示例：\n项目名称：XXX项目\n当前进展：完成了XX功能开发\n对接人：张三（电话/邮箱）\n关键里程碑：XX日完成XX交付\n注意事项：需要XX权限`}
                      rows={5}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                </div>

                {/* 联系人 */}
                <div className="bg-app-bg/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-xs">3</span>
                    对接人联系方式（选填）
                  </h3>
                  <div>
                    <label className="block text-xs text-app-muted mb-1">
                      联系人信息
                    </label>
                    <textarea
                      value={contacts}
                      onChange={(e) => setContacts(e.target.value)}
                      placeholder={`格式示例：\n姓名：张三\n职位：项目经理\n部门：产品部\n电话：138xxxx\n邮箱：xxx@xxx.com\n微信：xxx\n职责：负责XX项目对接`}
                      rows={4}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                </div>

                {/* 待办事项 */}
                <div className="bg-app-bg/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-yellow-500/20 flex items-center justify-center text-xs">4</span>
                    未完成事项（选填）
                  </h3>
                  <div>
                    <label className="block text-xs text-app-muted mb-1">
                      待办事项列表
                    </label>
                    <textarea
                      value={todos}
                      onChange={(e) => setTodos(e.target.value)}
                      placeholder={`格式示例：\n[高] 完成XX功能开发，截止日期：XX日，负责人：张三\n[中] 整理XX文档，截止日期：XX日\n[低] 参加XX培训`}
                      rows={4}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                </div>

                {/* 文档位置 */}
                <div className="bg-app-bg/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-purple-500/20 flex items-center justify-center text-xs">5</span>
                    重要文档位置（选填）
                  </h3>
                  <div>
                    <label className="block text-xs text-app-muted mb-1">
                      文档索引
                    </label>
                    <textarea
                      value={documents}
                      onChange={(e) => setDocuments(e.target.value)}
                      placeholder={`格式示例：\n文档名称：XX需求文档\n存放位置：共享盘/项目/XX/需求文档.docx\n最后更新时间：2024-01-01\n说明：包含XX功能详细需求`}
                      rows={4}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                </div>

                {/* 账号密码 */}
                <div className="bg-app-bg/50 rounded-lg p-4 border border-orange-500/30">
                  <h3 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center text-xs">6</span>
                    账号密码记录（选填 - 敏感信息）
                  </h3>
                  <div>
                    <label className="block text-xs text-orange-300 mb-1">
                      ⚠️ 注意：账号密码信息将仅用于生成交接提示，实际密码请通过安全渠道传递
                    </label>
                    <textarea
                      value={accounts}
                      onChange={(e) => setAccounts(e.target.value)}
                      placeholder={`格式示例：\n系统名称：XXX后台管理系统\n用户名：zhangsan\n访问权限：管理员\n说明：密码请当面告知交接人`}
                      rows={4}
                      className="w-full px-3 py-2 bg-app-bg border border-orange-500/30 rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>
                </div>

                {/* 注意事项 */}
                <div className="bg-app-bg/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-pink-400 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-pink-500/20 flex items-center justify-center text-xs">7</span>
                    注意事项（选填）
                  </h3>
                  <div>
                    <label className="block text-xs text-app-muted mb-1">
                      其他需要交代的重要事项
                    </label>
                    <textarea
                      value={reminders}
                      onChange={(e) => setReminders(e.target.value)}
                      placeholder={`格式示例：\n- 需归还笔记本电脑一台\n- 门禁卡需交还行政部\n- XX权限需在XX日前撤销`}
                      rows={3}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                </div>

                {/* 补充说明 */}
                <div className="bg-app-bg/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-cyan-400 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center text-xs">8</span>
                    补充说明（选填）
                  </h3>
                  <div>
                    <label className="block text-xs text-app-muted mb-1">
                      其他需要说明的内容
                    </label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="输入任何其他需要说明的内容..."
                      rows={3}
                      className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-primary-500 resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* 按钮组 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-app-border disabled:text-app-muted text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        AI 生成中...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        生成交接报告
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 bg-app-border hover:bg-app-muted/30 text-app-text rounded-lg font-medium transition-colors"
                  >
                    重置
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* 右侧：报告预览 */
            <div className="w-full flex flex-col bg-app-bg/50">
              {report ? (
                <>
                  <div className="p-4 border-b border-app-border flex items-center justify-between">
                    <span className="text-sm text-app-muted">{report.title}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1 text-xs bg-app-border hover:bg-app-muted/30 rounded-lg text-app-text transition-colors"
                      >
                        复制
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-3 py-1 text-xs bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-lg transition-colors"
                      >
                        下载
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <pre className="whitespace-pre-wrap text-sm text-app-text leading-relaxed">
                      {buildHandoverContent(report)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-app-muted">
                  <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>填写信息后点击生成</p>
                  <p className="text-sm mt-1">AI 将自动生成专业的交接文档</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部保密提示 */}
        <div className="p-3 border-t border-app-border bg-orange-500/5">
          <p className="text-xs text-orange-400 text-center">
            ⚠️ 交接文档包含敏感信息，请妥善保管，仅限交接相关人员查阅
          </p>
        </div>
      </div>
    </div>
  )
}

export default HandoverModal
