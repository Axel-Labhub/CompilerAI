/**
 * WelcomeGuide 组件
 * 新手指引 - 帮助用户快速理解产品价值
 */

import React, { useState, useEffect } from 'react'
import { SAMPLE_NOTES_INFO } from '../lib/sample-notes'

interface WelcomeGuideProps {
  onComplete: () => void
  onViewSamples: () => void
}

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onComplete, onViewSamples }) => {
  const [currentStep, setCurrentStep] = useState(0)

  // 引导步骤配置
  const steps = [
    {
      number: 1,
      title: '记录工作',
      subtitle: '随手记笔记',
      description: '把工作中的碎碎念、项目进度、灵感想法都记录下来。支持 Markdown，标签分类，搜索查找。',
      icon: '✍️',
      color: 'blue',
    },
    {
      number: 2,
      title: 'AI 清洗',
      subtitle: '一键去情绪',
      description: '「今天累死了终于搞完了」一键转换为专业表达。保留真实工作内容，去除情绪化表达。',
      icon: '🧹',
      color: 'purple',
    },
    {
      number: 3,
      title: '编译真相',
      subtitle: '提炼精华',
      description: 'AI 自动分析你的笔记，提炼出核心结论、关键洞察。告别长篇大论，一眼看穿本质。',
      icon: '🔍',
      color: 'green',
    },
    {
      number: 4,
      title: '生成周报',
      subtitle: '一键输出',
      description: '勾选本周工作笔记，一键生成结构化周报。从碎碎念到正式报告，轻松搞定。',
      icon: '📊',
      color: 'orange',
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // 标记已看过引导
    localStorage.setItem('welcome_guide_completed', 'true')
    onComplete()
  }

  const step = steps[currentStep]
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      active: 'bg-blue-500',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      active: 'bg-purple-500',
    },
    green: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/30',
      active: 'bg-green-500',
    },
    orange: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      active: 'bg-orange-500',
    },
  }

  const colors = colorClasses[step.color as keyof typeof colorClasses]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-app-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-app-border">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">欢迎使用「编译器」</h2>
              <p className="text-white/70 text-sm">你是你唯一的算法 · 认知源码只属于你</p>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          {/* 步骤指示器 */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, index) => (
              <button
                key={s.number}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 transition-all ${
                  index === currentStep
                    ? 'opacity-100 scale-105'
                    : 'opacity-50 hover:opacity-75'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index === currentStep
                      ? `${colors.active} text-white`
                      : index < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-app-border text-app-muted'
                  }`}
                >
                  {index < currentStep ? '✓' : s.number}
                </div>
                <span className={`text-xs hidden sm:block ${
                  index === currentStep ? 'text-app-text' : 'text-app-muted'
                }`}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* 步骤内容 */}
          <div className={`${colors.bg} ${colors.border} border rounded-xl p-6 mb-6 transition-all`}>
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center text-3xl shrink-0`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${colors.text} uppercase tracking-wider`}>
                    步骤 {step.number}
                  </span>
                  <span className="text-app-muted text-xs">·</span>
                  <span className="text-app-muted text-xs">{step.subtitle}</span>
                </div>
                <h3 className="text-xl font-bold text-app-text mb-2">{step.title}</h3>
                <p className="text-app-muted leading-relaxed">{step.description}</p>
              </div>
            </div>
          </div>

          {/* 功能预览卡片 */}
          <div className="bg-app-bg rounded-xl p-4 mb-6">
            <div className="grid grid-cols-3 gap-3">
              {SAMPLE_NOTES_INFO.map((info) => (
                <div
                  key={info.id}
                  className="text-center p-3 rounded-lg bg-app-card border border-app-border"
                >
                  <div className="text-2xl mb-1">{info.icon}</div>
                  <div className="text-xs font-medium text-app-text truncate">{info.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <button
              onClick={onViewSamples}
              className="px-4 py-2 text-sm text-app-muted hover:text-app-text transition-colors flex items-center gap-2"
            >
              <span className="text-lg">📝</span>
              先看看示例
            </button>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-sm text-app-muted hover:text-app-text transition-colors"
                >
                  上一步
                </button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-all ${colors.active} hover:opacity-90`}
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-all"
                >
                  开始体验 ✨
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 检查是否需要显示引导
export function shouldShowWelcomeGuide(): boolean {
  // 如果已经看过引导，不再显示
  if (localStorage.getItem('welcome_guide_completed') === 'true') {
    return false
  }
  // 首次使用，显示引导
  return true
}
