/**
 * 搜索工具库
 * 提供搜索、匹配、高亮等功能
 */

import type { Note } from '../types'

// 搜索结果类型
export interface SearchResult {
  note: Note
  matchType: 'title' | 'content' | 'tag'
  matchedText: string
  score: number
  highlights: {
    title?: string[]
    content?: string[]
    tags?: string[]
  }
}

/**
 * 执行全文搜索
 * @param notes 笔记列表
 * @param query 搜索关键词
 * @param options 搜索选项
 * @returns 搜索结果列表
 */
export function searchNotes(
  notes: Note[],
  query: string,
  options: {
    limit?: number
    fuzzy?: boolean
  } = {}
): SearchResult[] {
  const { limit = 20, fuzzy = false } = options

  if (!query.trim()) {
    return notes.slice(0, limit).map(note => ({
      note,
      matchType: 'title' as const,
      matchedText: note.title,
      score: 0,
      highlights: { title: [note.title] },
    }))
  }

  const lowerQuery = query.toLowerCase()
  const results: SearchResult[] = []

  for (const note of notes) {
    const lowerTitle = note.title.toLowerCase()
    const lowerContent = note.content.toLowerCase()

    // 标题匹配（最高优先级）
    if (lowerTitle.includes(lowerQuery)) {
      const score = calculateMatchScore(lowerTitle, lowerQuery, 'title')
      results.push({
        note,
        matchType: 'title',
        matchedText: getContentContext(note.content, lowerQuery, 50),
        score,
        highlights: {
          title: findMatches(note.title, query),
        },
      })
      continue
    }

    // 标签匹配（高优先级）
    const matchedTags = note.tags.filter(tag =>
      tag.toLowerCase().includes(lowerQuery)
    )
    if (matchedTags.length > 0) {
      const score = calculateMatchScore(lowerTitle, lowerQuery, 'tag')
      results.push({
        note,
        matchType: 'tag',
        matchedText: matchedTags.join(', '),
        score,
        highlights: {
          tags: matchedTags,
        },
      })
      continue
    }

    // 内容匹配
    if (lowerContent.includes(lowerQuery)) {
      const index = lowerContent.indexOf(lowerQuery)
      const context = getContentContext(note.content, lowerQuery, 80)
      const score = calculateMatchScore(lowerContent, lowerQuery, 'content')

      results.push({
        note,
        matchType: 'content',
        matchedText: context,
        score,
        highlights: {
          content: [context],
        },
      })
    }
  }

  // 按分数排序
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}

/**
 * 计算匹配分数
 */
function calculateMatchScore(
  text: string,
  query: string,
  matchType: 'title' | 'content' | 'tag'
): number {
  let score = 0

  // 基础分数
  const baseScore = {
    title: 100,
    tag: 80,
    content: 50,
  }
  score += baseScore[matchType]

  // 精确匹配加成
  if (text === query) {
    score += 50
  }

  // 开头匹配加成
  if (text.startsWith(query)) {
    score += 30
  }

  // 单词边界匹配加成
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(query)}\\b`, 'i')
  if (wordBoundaryRegex.test(text)) {
    score += 20
  }

  // 匹配次数加成（内容匹配时）
  if (matchType === 'content') {
    const matches = text.match(new RegExp(escapeRegex(query), 'gi'))
    score += (matches?.length || 0) * 5
  }

  return score
}

/**
 * 获取内容上下文
 */
export function getContentContext(
  content: string,
  query: string,
  contextLength: number = 50
): string {
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)

  if (index === -1) {
    return content.substring(0, contextLength * 2)
  }

  const start = Math.max(0, index - contextLength)
  const end = Math.min(content.length, index + query.length + contextLength)

  let context = content.substring(start, end)

  if (start > 0) {
    context = '...' + context
  }
  if (end < content.length) {
    context = context + '...'
  }

  return context
}

/**
 * 查找所有匹配位置
 */
export function findMatches(text: string, query: string): string[] {
  const matches: string[] = []
  const regex = new RegExp(escapeRegex(query), 'gi')
  let match

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0])
  }

  return matches
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 高亮搜索关键词
 */
export function highlightKeywords(
  text: string,
  query: string,
  highlightClass: string = 'search-highlight'
): string {
  if (!query.trim()) return text

  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, `<mark class="${highlightClass}">$1</mark>`)
}

/**
 * 生成搜索建议
 */
export function generateSuggestions(
  notes: Note[],
  query: string,
  limit: number = 5
): string[] {
  if (!query.trim()) return []

  const lowerQuery = query.toLowerCase()
  const suggestions = new Set<string>()

  // 从标题中提取建议
  for (const note of notes) {
    const words = note.title.split(/[\s,，、。!！?？:：;；()（）\[\]]+/)
    for (const word of words) {
      if (word.toLowerCase().includes(lowerQuery) && word.length > 1) {
        suggestions.add(word)
      }
    }
  }

  // 从标签中提取建议
  for (const note of notes) {
    for (const tag of note.tags) {
      if (tag.toLowerCase().includes(lowerQuery)) {
        suggestions.add(tag)
      }
    }
  }

  return Array.from(suggestions).slice(0, limit)
}

/**
 * 模糊搜索
 */
export function fuzzySearch(
  notes: Note[],
  query: string,
  threshold: number = 0.3
): SearchResult[] {
  if (!query.trim()) return []

  const results: SearchResult[] = []

  for (const note of notes) {
    const titleScore = fuzzyMatch(note.title, query)
    const contentScore = fuzzyMatch(note.content, query)
    const maxScore = Math.max(titleScore, contentScore)

    if (maxScore >= threshold) {
      results.push({
        note,
        matchType: titleScore >= contentScore ? 'title' : 'content',
        matchedText: titleScore >= contentScore ? note.title : getContentContext(note.content, query, 50),
        score: maxScore,
        highlights: {
          title: titleScore >= contentScore ? [note.title] : undefined,
        },
      })
    }
  }

  results.sort((a, b) => b.score - a.score)

  return results.slice(0, 20)
}

/**
 * 模糊匹配算法
 * 返回 0-1 之间的匹配分数
 */
function fuzzyMatch(text: string, query: string): number {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // 精确包含
  if (lowerText.includes(lowerQuery)) {
    return 1
  }

  // 字符序列匹配
  let queryIndex = 0
  let matchedChars = 0
  let lastMatchIndex = -1

  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      matchedChars++
      // 连续的字符匹配给予更高分数
      if (i === lastMatchIndex + 1) {
        matchedChars += 0.5
      }
      lastMatchIndex = i
      queryIndex++
    }
  }

  if (queryIndex < lowerQuery.length) {
    return 0
  }

  return matchedChars / (lowerQuery.length * 1.5)
}

/**
 * 提取笔记中的链接
 */
export function extractWikiLinks(content: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    links.push(match[1])
  }

  return [...new Set(links)]
}

/**
 * 替换内容中的链接文本
 */
export function replaceWikiLinks(
  content: string,
  replacements: Record<string, string>
): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
    return replacements[title] || match
  })
}

/**
 * 搜索历史管理
 */
const SEARCH_HISTORY_KEY = 'searchHistory'
const MAX_HISTORY = 10

export function getSearchHistory(): string[] {
  try {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function addToSearchHistory(query: string): void {
  if (!query.trim()) return

  const history = getSearchHistory()
  const updated = [query, ...history.filter(h => h !== query)].slice(0, MAX_HISTORY)

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated))
  } catch {
    console.error('Failed to save search history')
  }
}

export function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY)
}
