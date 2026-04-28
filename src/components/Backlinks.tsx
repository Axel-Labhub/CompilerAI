/**
 * Backlinks 组件
 * 反向链接显示（被哪些笔记引用）
 */

import React from 'react'
import type { Note } from '../types'

interface BacklinksProps {
  backlinks: Note[]
  onClickNote: (note: Note) => void
}

export const Backlinks: React.FC<BacklinksProps> = ({ backlinks, onClickNote }) => {
  if (backlinks.length === 0) return null

  return (
    <div className="border-t border-app-border mt-6 pt-4">
      <h4 className="text-sm font-medium text-app-muted mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        被 {backlinks.length} 篇笔记引用
      </h4>
      <div className="space-y-2">
        {backlinks.map(note => (
          <button
            key={note.id}
            onClick={() => onClickNote(note)}
            className="w-full p-3 bg-app-bg/50 rounded-lg text-left hover:bg-app-border/50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm text-app-text group-hover:text-primary-400 transition-colors">
                {note.title || '无标题笔记'}
              </span>
            </div>
            <p className="text-xs text-app-muted mt-1 ml-6 line-clamp-1">
              {note.content.substring(0, 100)}...
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Backlinks
