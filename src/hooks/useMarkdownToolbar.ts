/**
 * useMarkdownToolbar Hook
 * Markdown 工具栏逻辑封装
 */

import { useCallback } from 'react'
import type { SlashCommand } from '../types'

export interface MarkdownToolbarActions {
  /** 插入 Markdown 语法 */
  handleInsert: (before: string, after: string, placeholder?: string) => void
  /** 处理斜杠命令 */
  handleSlashCommand: (command: SlashCommand, value?: string) => void
}

export interface UseMarkdownToolbarOptions {
  /** Textarea ref */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  /** 当前内容 */
  content: string
  /** 设置内容回调 */
  setContent: (content: string) => void
}

/**
 * Markdown 工具栏 Hook
 */
export function useMarkdownToolbar(options: UseMarkdownToolbarOptions): MarkdownToolbarActions {
  const { textareaRef, content, setContent } = options

  // 插入 Markdown 语法
  const handleInsert = useCallback((before: string, after: string, placeholder?: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    // 使用选中文本或占位符
    const insertText = selectedText || placeholder || ''
    const newContent = content.substring(0, start) + before + insertText + after + content.substring(end)

    setContent(newContent)

    // 设置光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        if (selectedText || placeholder) {
          textareaRef.current.selectionStart = start + before.length
          textareaRef.current.selectionEnd = start + before.length + insertText.length
        } else {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + before.length
        }
        textareaRef.current.focus()
      }
    }, 0)
  }, [textareaRef, content, setContent])

  // 处理斜杠命令选择
  const handleSlashCommand = useCallback((command: SlashCommand, _value?: string) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.substring(0, cursorPos)
    const lineStart = textBeforeCursor.lastIndexOf('\n') + 1

    // 删除 / 命令
    const beforeCommand = content.substring(0, lineStart)
    const afterCursor = content.substring(cursorPos)

    // 插入命令内容
    let insertContent = command.insert
    if (command.insert.includes('{{date}}')) {
      insertContent = insertContent.replace('{{date}}', new Date().toISOString().split('T')[0])
    }
    if (command.insert.includes('{{text}}') || command.insert.includes('{{code}}') || command.insert.includes('{{url}}')) {
      insertContent = insertContent.replace(/\{\{[^}]+\}\}/g, '')
    }

    const newContent = beforeCommand + insertContent + afterCursor
    setContent(newContent)

    // 设置光标到合适位置
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lineStart + insertContent.length
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos
        textareaRef.current.focus()
      }
    }, 0)
  }, [textareaRef, content, setContent])

  return {
    handleInsert,
    handleSlashCommand,
  }
}
