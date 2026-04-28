/**
 * Preview 组件
 * Markdown 预览模式
 */

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PreviewProps {
  title: string
  content: string
  tags: string[]
  onBack: () => void
  onEdit: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

export const Preview: React.FC<PreviewProps> = ({
  title,
  content,
  tags,
  onBack,
  onEdit,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <div className={`flex flex-col h-full bg-dark-bg ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 工具栏 */}
      <div className="h-12 bg-dark-card border-b border-dark-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="font-medium text-dark-text">{title || '无标题笔记'}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg text-sm hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            编辑
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors"
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="px-4 py-2 border-b border-dark-border bg-dark-card/30 flex items-center gap-2">
          {tags.map(tag => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <article className="markdown-preview">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-dark-muted italic">暂无内容</p>
            )}
          </article>
        </div>
      </div>
    </div>
  )
}

export default Preview
