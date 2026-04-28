/**
 * KeyboardShortcutsHelp 组件
 * 快捷键帮助面板
 */

import React from 'react'
import { KEYBOARD_SHORTCUTS } from '../types'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  // 检测是否为 Mac
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 面板内容 */}
      <div className="relative bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">⌨️</span>
            <h2 className="text-lg font-semibold text-dark-text">快捷键</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-dark-border text-dark-muted hover:text-dark-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
          {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-dark-muted">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {isMac && shortcut.mac ? (
                  shortcut.mac.split(' + ').map((key, i) => (
                    <React.Fragment key={i}>
                      <kbd className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-dark-text">
                        {key}
                      </kbd>
                      {i < shortcut.mac!.split(' + ').length - 1 && <span className="text-dark-muted">+</span>}
                    </React.Fragment>
                  ))
                ) : shortcut.windows ? (
                  shortcut.windows.split(' + ').map((key, i) => (
                    <React.Fragment key={i}>
                      <kbd className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-dark-text">
                        {key}
                      </kbd>
                      {i < shortcut.windows!.split(' + ').length - 1 && <span className="text-dark-muted">+</span>}
                    </React.Fragment>
                  ))
                ) : (
                  <kbd className="px-2 py-1 bg-dark-bg border border-dark-border rounded text-xs text-dark-text">
                    {shortcut.key}
                  </kbd>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-5 py-3 bg-dark-bg/50 border-t border-dark-border">
          <p className="text-xs text-dark-muted text-center">
            按 <kbd className="px-1.5 py-0.5 bg-dark-card border border-dark-border rounded text-xs">Esc</kbd> 或点击外部关闭
          </p>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsHelp
