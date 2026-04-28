/**
 * useKeyboardShortcuts Hook
 * 全局快捷键管理，支持在编辑器获取焦点时也能响应快捷键
 */

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcutHandlers {
  onSave?: () => void
  onNew?: () => void
  onSearch?: () => void
  onPreview?: () => void
  onFullscreen?: () => void
  onHelp?: () => void
  onAIClean?: () => void
  onAICompile?: () => void
  onWeeklyReport?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  // 使用 ref 存储 handlers，避免重新注册监听器
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey

      // 获取当前焦点元素
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || 
                             target.tagName === 'TEXTAREA' || 
                             target.isContentEditable

      // Cmd/Ctrl + Shift + C：AI 清洗当前内容
      if (cmdKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        handlersRef.current.onAIClean?.()
        return
      }

      // Cmd/Ctrl + Shift + R：AI 编译真相
      if (cmdKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        handlersRef.current.onAICompile?.()
        return
      }

      // Cmd/Ctrl + Shift + W：生成周报
      if (cmdKey && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        handlersRef.current.onWeeklyReport?.()
        return
      }

      // Cmd/Ctrl + /：显示/隐藏快捷键帮助面板
      if (cmdKey && e.key === '/') {
        e.preventDefault()
        handlersRef.current.onHelp?.()
        return
      }

      // 保存 Ctrl/Cmd + S - 无论是否在输入框都响应
      if (cmdKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handlersRef.current.onSave?.()
        return
      }
      
      // 新建 Ctrl/Cmd + N - 仅在列表视图响应
      if (cmdKey && e.key.toLowerCase() === 'n' && !isInputFocused) {
        e.preventDefault()
        handlersRef.current.onNew?.()
        return
      }
      
      // 搜索 Ctrl/Cmd + F - 仅在非输入框响应
      if (cmdKey && e.key.toLowerCase() === 'f' && !isInputFocused) {
        e.preventDefault()
        handlersRef.current.onSearch?.()
        return
      }
      
      // 预览 Ctrl/Cmd + P
      if (cmdKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        handlersRef.current.onPreview?.()
        return
      }
      
      // 全屏 Ctrl/Cmd + .
      if (cmdKey && e.key === '.') {
        e.preventDefault()
        handlersRef.current.onFullscreen?.()
        return
      }
      
      // 帮助 ?
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault()
        handlersRef.current.onHelp?.()
        return
      }

      // Escape 关闭弹窗
      if (e.key === 'Escape') {
        handlersRef.current.onEscape?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

/**
 * 检测是否在输入元素中
 */
export function isInInputElement(): boolean {
  const target = document.activeElement as HTMLElement
  if (!target) return false
  
  return target.tagName === 'INPUT' || 
         target.tagName === 'TEXTAREA' || 
         target.isContentEditable ||
         target.closest('[contenteditable="true"]') !== null
}

export default useKeyboardShortcuts
