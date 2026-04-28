/**
 * 链接工具库
 * 处理笔记之间的双向链接关系
 */

import type { Note, NoteLink } from '../types'

// 链接信息类型
export interface LinkInfo {
  title: string
  exists: boolean
  noteId?: string
  linkCount: number
}

/**
 * 从内容中提取所有 [[链接]]
 */
export function extractLinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1])
  }

  return [...new Set(links)] // 去重
}

/**
 * 提取链接及其位置信息
 */
export interface LinkMatch {
  title: string
  fullMatch: string
  start: number
  end: number
}

export function extractLinksWithPosition(content: string): LinkMatch[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const matches: LinkMatch[] = []
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    matches.push({
      title: match[1],
      fullMatch: match[0],
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  return matches
}

/**
 * 在内容中插入链接
 */
export function insertLink(content: string, position: number, title: string): string {
  const before = content.substring(0, position)
  const after = content.substring(position)
  return `${before}[[${title}]]${after}`
}

/**
 * 将光标处的文本转换为链接
 */
export function wrapSelectionWithLink(
  content: string,
  start: number,
  end: number,
  title: string
): { content: string; newCursorPos: number } {
  const before = content.substring(0, start)
  const selected = content.substring(start, end)
  const after = content.substring(end)

  // 如果选中了链接文本，使用选中的文本
  const linkTitle = selected.trim() || title
  const newContent = `${before}[[${linkTitle}]]${after}`
  const newCursorPos = start + linkTitle.length + 4 // [[ + title + ]]

  return { content: newContent, newCursorPos }
}

/**
 * 解析链接周围的上下文
 */
export function getLinkContext(
  content: string,
  linkTitle: string,
  contextLength: number = 50
): string {
  const linkPattern = `[[${linkTitle}]]`
  const index = content.indexOf(linkPattern)

  if (index === -1) return ''

  const start = Math.max(0, index - contextLength)
  const end = Math.min(content.length, index + linkPattern.length + contextLength)

  let context = content.substring(start, end)

  // 清理格式
  context = context
    .replace(/#{1,6}\s/g, '') // 移除标题标记
    .replace(/\*\*/g, '')     // 移除粗体
    .replace(/\*/g, '')        // 移除斜体
    .replace(/\n/g, ' ')      // 换行转空格
    .trim()

  if (start > 0) context = '...' + context
  if (end < content.length) context = context + '...'

  return context
}

/**
 * 验证链接是否存在
 */
export function validateLinks(
  links: string[],
  existingNotes: Note[]
): Map<string, boolean> {
  const existingTitles = new Set(existingNotes.map(n => n.title))
  const validation = new Map<string, boolean>()

  for (const title of links) {
    validation.set(title, existingTitles.has(title))
  }

  return validation
}

/**
 * 生成链接建议列表
 */
export function generateLinkSuggestions(
  notes: Note[],
  query: string,
  excludeIds: string[] = [],
  limit: number = 8
): Note[] {
  if (!query.trim()) {
    // 无查询时返回最近的笔记
    return notes
      .filter(n => !excludeIds.includes(n.id))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
  }

  const lowerQuery = query.toLowerCase()

  return notes
    .filter(n =>
      !excludeIds.includes(n.id) &&
      (n.title.toLowerCase().includes(lowerQuery) ||
       n.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    )
    .sort((a, b) => {
      // 标题匹配优先
      const aTitleMatch = a.title.toLowerCase().includes(lowerQuery)
      const bTitleMatch = b.title.toLowerCase().includes(lowerQuery)
      if (aTitleMatch && !bTitleMatch) return -1
      if (!aTitleMatch && bTitleMatch) return 1
      // 然后按更新时间
      return b.updatedAt - a.updatedAt
    })
    .slice(0, limit)
}

/**
 * 渲染链接（将 [[xxx]] 转换为可点击元素）
 */
export interface RenderedLink {
  type: 'text' | 'link'
  content: string
  isValid?: boolean
  noteId?: string
}

export function parseContentWithLinks(
  content: string,
  existingNotes: Note[]
): RenderedLink[] {
  const existingTitles = new Map<string, string>()
  existingNotes.forEach(n => existingTitles.set(n.title.toLowerCase(), n.id))

  const parts: RenderedLink[] = []
  const linkRegex = /\[\[([^\]]+)\]\]/g
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    // 添加链接前的文本
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      })
    }

    // 添加链接
    const title = match[1]
    const lowerTitle = title.toLowerCase()
    const noteId = existingTitles.get(lowerTitle)

    parts.push({
      type: 'link',
      content: title,
      isValid: !!noteId,
      noteId,
    })

    lastIndex = match.index + match[0].length
  }

  // 添加剩余文本
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex),
    })
  }

  return parts
}

/**
 * 统计链接信息
 */
export function getLinkStats(links: NoteLink[]): {
  totalLinks: number
  validLinks: number
  invalidLinks: number
  mostLinkedNotes: { title: string; count: number }[]
} {
  const targetCounts = new Map<string, number>()
  let validCount = 0
  let invalidCount = 0

  for (const link of links) {
    const count = targetCounts.get(link.targetTitle) || 0
    targetCounts.set(link.targetTitle, count + 1)

    if (link.targetId) {
      validCount++
    } else {
      invalidCount++
    }
  }

  const mostLinked = Array.from(targetCounts.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalLinks: links.length,
    validLinks: validCount,
    invalidLinks: invalidCount,
    mostLinkedNotes: mostLinked,
  }
}

/**
 * 清理无效链接
 * 将不存在的笔记链接转换为普通文本
 */
export function cleanInvalidLinks(
  content: string,
  existingNotes: Note[]
): string {
  const existingTitles = new Set(existingNotes.map(n => n.title.toLowerCase()))

  return content.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
    if (existingTitles.has(title.toLowerCase())) {
      return match // 保留有效链接
    }
    return title // 将无效链接转换为纯文本
  })
}

/**
 * 自动补全链接
 * 在输入时提供建议
 */
export interface AutocompleteResult {
  completed: string
  remaining: string
  suggestions: string[]
}

export function autocompleteLink(
  content: string,
  cursorPos: number,
  notes: Note[]
): AutocompleteResult | null {
  // 查找光标前的 [[
  const beforeCursor = content.substring(0, cursorPos)
  const linkStart = beforeCursor.lastIndexOf('[[')

  if (linkStart === -1) return null

  // 检查 [[ 之后是否有 ]]
  const afterLink = beforeCursor.substring(linkStart + 2)
  if (afterLink.includes(']]')) return null

  // 提取当前输入的部分
  const currentInput = afterLink

  // 生成建议
  const suggestions = generateLinkSuggestions(notes, currentInput, [], 5)
    .map(n => n.title)

  if (suggestions.length === 0) return null

  // 计算补全
  const firstSuggestion = suggestions[0]
  const completed = firstSuggestion
  const remaining = completed.substring(currentInput.length)

  return {
    completed,
    remaining,
    suggestions,
  }
}

/**
 * 快速插入笔记链接
 */
export function quickInsertLink(
  content: string,
  cursorPos: number,
  noteTitle: string
): { newContent: string; newCursorPos: number } {
  const beforeCursor = content.substring(0, cursorPos)
  const afterCursor = content.substring(cursorPos)

  // 查找最近的 [[
  const linkStart = beforeCursor.lastIndexOf('[[')

  let newContent: string
  let newCursorPos: number

  if (linkStart !== -1) {
    // 替换 [[ 之后的内容
    const before = content.substring(0, linkStart)
    newContent = `${before}[[${noteTitle}]]${afterCursor}`
    newCursorPos = linkStart + noteTitle.length + 4
  } else {
    // 插入新链接
    newContent = `${beforeCursor}[[${noteTitle}]]${afterCursor}`
    newCursorPos = cursorPos + noteTitle.length + 4
  }

  return { newContent, newCursorPos }
}
