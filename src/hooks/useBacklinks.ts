/**
 * useBacklinks Hook
 * 反向链接逻辑封装
 */

import { useState, useCallback, useMemo } from 'react'

export interface BacklinkItem {
  noteId: string
  noteTitle: string
  linkCount: number
  contexts: string[]
}

export interface UseBacklinksOptions {
  /** 当前笔记 ID */
  noteId: string | null
  /** 所有笔记列表（用于查找链接） */
  allNotes: Array<{ id: string; title: string; content: string }>
}

export interface UseBacklinksReturn {
  /** 反向链接列表 */
  backlinks: BacklinkItem[]
  /** 链接数量 */
  count: number
}

/**
 * 解析笔记内容中的链接
 */
function parseLinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1])
  }

  return links
}

/**
 * 反向链接 Hook
 */
export function useBacklinks(options: UseBacklinksOptions): UseBacklinksReturn {
  const { noteId, allNotes } = options

  const backlinks = useMemo(() => {
    if (!noteId) return []

    const currentNote = allNotes.find(n => n.id === noteId)
    if (!currentNote) return []

    // 找出所有包含指向当前笔记的链接的笔记
    const linkedNotes: BacklinkItem[] = allNotes
      .filter(note => {
        if (note.id === noteId) return false
        const links = parseLinks(note.content)
        return links.some(link => {
          // 匹配链接文本或笔记标题
          return link === currentNote.title || link === noteId
        })
      })
      .map(note => {
        // 提取链接的上下文
        const links = parseLinks(note.content)
        const contexts: string[] = []
        
        links.forEach(link => {
          if (link === currentNote.title || link === noteId) {
            // 找到链接所在行的上下文
            const lines = note.content.split('\n')
            for (const line of lines) {
              if (line.includes(`[[${link}]]`)) {
                // 提取周围文字作为上下文
                const linkIndex = line.indexOf(`[[${link}]]`)
                const start = Math.max(0, linkIndex - 30)
                const end = Math.min(line.length, linkIndex + link.length + 30)
                const context = (start > 0 ? '...' : '') + 
                               line.substring(start, end) + 
                               (end < line.length ? '...' : '')
                contexts.push(context)
                break
              }
            }
          }
        })

        return {
          noteId: note.id,
          noteTitle: note.title,
          linkCount: links.filter(l => l === currentNote.title || l === noteId).length,
          contexts: contexts.slice(0, 2), // 最多取2个上下文
        }
      })

    return linkedNotes
  }, [noteId, allNotes])

  return {
    backlinks,
    count: backlinks.length,
  }
}

/**
 * useBacklinksPanel Hook
 * 反向链接面板状态管理
 */
export function useBacklinksPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedLink, setSelectedLink] = useState<string | null>(null)

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const collapse = useCallback(() => {
    setIsExpanded(false)
  }, [])

  const selectLink = useCallback((noteId: string) => {
    setSelectedLink(noteId)
    setIsExpanded(true)
  }, [])

  return {
    isExpanded,
    selectedLink,
    toggle,
    collapse,
    selectLink,
  }
}
