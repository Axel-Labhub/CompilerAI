/**
 * 版本历史工具库
 * 处理笔记版本快照、比较、恢复等功能
 */

import type { Note, NoteVersion } from '../types'

// 版本差异类型
export interface VersionDiff {
  versionA: NoteVersion
  versionB: NoteVersion
  addedLines: string[]
  removedLines: string[]
  unchangedLines: string[]
  stats: {
    added: number
    removed: number
    unchanged: number
  }
}

/**
 * 计算两个版本之间的差异
 */
export function computeDiff(versionA: NoteVersion, versionB: NoteVersion): VersionDiff {
  const linesA = versionA.content.split('\n')
  const linesB = versionB.content.split('\n')

  const addedLines: string[] = []
  const removedLines: string[] = []
  const unchangedLines: string[] = []

  // 简单行比较算法
  const setA = new Set(linesA)
  const setB = new Set(linesB)

  for (const line of linesB) {
    if (!setA.has(line)) {
      addedLines.push(line)
    } else {
      unchangedLines.push(line)
    }
  }

  for (const line of linesA) {
    if (!setB.has(line)) {
      removedLines.push(line)
    }
  }

  return {
    versionA,
    versionB,
    addedLines,
    removedLines,
    unchangedLines,
    stats: {
      added: addedLines.length,
      removed: removedLines.length,
      unchanged: unchangedLines.length,
    },
  }
}

/**
 * 获取版本概览
 */
export interface VersionSummary {
  totalVersions: number
  oldestVersion: NoteVersion | null
  newestVersion: NoteVersion | null
  versionSpan: number // 时间跨度（毫秒）
  avgInterval: number // 平均版本间隔
}

export function getVersionSummary(versions: NoteVersion[]): VersionSummary {
  if (versions.length === 0) {
    return {
      totalVersions: 0,
      oldestVersion: null,
      newestVersion: null,
      versionSpan: 0,
      avgInterval: 0,
    }
  }

  const sorted = [...versions].sort((a, b) => a.createdAt - b.createdAt)
  const oldest = sorted[0]
  const newest = sorted[sorted.length - 1]
  const versionSpan = newest.createdAt - oldest.createdAt

  let avgInterval = 0
  if (sorted.length > 1) {
    avgInterval = versionSpan / (sorted.length - 1)
  }

  return {
    totalVersions: versions.length,
    oldestVersion: oldest,
    newestVersion: newest,
    versionSpan,
    avgInterval,
  }
}

/**
 * 格式化时间跨度
 */
export function formatTimeSpan(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days} 天 ${hours % 24} 小时`
  }
  if (hours > 0) {
    return `${hours} 小时 ${minutes % 60} 分钟`
  }
  if (minutes > 0) {
    return `${minutes} 分钟`
  }
  return `${seconds} 秒`
}

/**
 * 生成版本快照摘要
 */
export interface VersionSnapshot {
  id: string
  noteId: string
  timestamp: number
  preview: string
  wordCount: number
  lineCount: number
  hasChanges: boolean
  changeType?: 'major' | 'minor' | 'trivial'
}

export function createVersionSnapshot(version: NoteVersion): VersionSnapshot {
  const content = version.content
  const lines = content.split('\n')
  const words = content.split(/\s+/).filter(w => w.length > 0)

  return {
    id: version.id,
    noteId: version.noteId,
    timestamp: version.createdAt,
    preview: getPreviewText(content, 60),
    wordCount: words.length,
    lineCount: lines.length,
    hasChanges: true,
    changeType: classifyChange(content),
  }
}

/**
 * 分类版本变更类型
 */
function classifyChange(content: string): 'major' | 'minor' | 'trivial' {
  const words = content.split(/\s+/).filter(w => w.length > 0).length

  if (words < 10) return 'trivial'
  if (words < 50) return 'minor'
  return 'major'
}

/**
 * 获取预览文本
 */
function getPreviewText(content: string, maxLength: number): string {
  // 移除 markdown 语法
  const plain = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()

  if (plain.length <= maxLength) return plain
  return plain.substring(0, maxLength) + '...'
}

/**
 * 判断内容是否有实质性变化
 */
export function hasSignificantChanges(
  oldContent: string,
  newContent: string,
  threshold: number = 0.1
): boolean {
  // 移除空白进行比较
  const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase()

  if (normalize(oldContent) === normalize(newContent)) {
    return false
  }

  // 计算变化比例
  const longer = Math.max(oldContent.length, newContent.length)
  const distance = levenshteinDistance(normalize(oldContent), normalize(newContent))
  const changeRatio = distance / longer

  return changeRatio >= threshold
}

/**
 * Levenshtein 距离算法
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * 生成版本变化报告
 */
export interface ChangeReport {
  currentVersion: NoteVersion
  previousVersion: NoteVersion | null
  contentChanges: {
    wordsAdded: number
    wordsRemoved: number
    netChange: number
  }
  titleChanged: boolean
  tagsAdded: string[]
  tagsRemoved: string[]
}

export function generateChangeReport(
  current: NoteVersion,
  previous: NoteVersion | null
): ChangeReport {
  if (!previous) {
    return {
      currentVersion: current,
      previousVersion: null,
      contentChanges: {
        wordsAdded: current.content.split(/\s+/).length,
        wordsRemoved: 0,
        netChange: current.content.split(/\s+/).length,
      },
      titleChanged: false,
      tagsAdded: current.tags,
      tagsRemoved: [],
    }
  }

  const currentWords = current.content.split(/\s+/).filter(w => w.length > 0)
  const previousWords = previous.content.split(/\s+/).filter(w => w.length > 0)

  const currentSet = new Set(currentWords)
  const previousSet = new Set(previousWords)

  const wordsAdded = currentWords.filter(w => !previousSet.has(w)).length
  const wordsRemoved = previousWords.filter(w => !currentSet.has(w)).length

  const tagsAdded = current.tags.filter(t => !previous.tags.includes(t))
  const tagsRemoved = previous.tags.filter(t => !current.tags.includes(t))

  return {
    currentVersion: current,
    previousVersion: previous,
    contentChanges: {
      wordsAdded,
      wordsRemoved,
      netChange: wordsAdded - wordsRemoved,
    },
    titleChanged: current.title !== previous.title,
    tagsAdded,
    tagsRemoved,
  }
}

/**
 * 智能版本清理
 * 根据规则决定保留哪些版本
 */
export function shouldKeepVersion(
  version: NoteVersion,
  index: number,
  totalVersions: number
): boolean {
  // 总是保留最新版本
  if (index === 0) return true

  // 保留最近的 5 个版本
  if (index < 5) return true

  // 每隔一个版本保留一个（指数衰减）
  if (index < 10) return index % 2 === 0
  if (index < 20) return index % 3 === 0

  // 超过 20 个版本，只保留每小时一个
  return index % 4 === 0
}

/**
 * 获取版本时间线
 */
export interface TimelineEntry {
  version: NoteVersion
  isFirstOfDay: boolean
  isFirstOfWeek: boolean
  timeSincePrevious: number
}

export function buildVersionTimeline(versions: NoteVersion[]): TimelineEntry[] {
  const sorted = [...versions].sort((a, b) => b.createdAt - a.createdAt)

  return sorted.map((version, index) => {
    const previous = sorted[index + 1]
    const timeSincePrevious = previous ? version.createdAt - previous.createdAt : 0

    const versionDate = new Date(version.createdAt)
    const previousDate = previous ? new Date(previous.createdAt) : null

    const isFirstOfDay = !previousDate ||
      versionDate.toDateString() !== previousDate.toDateString()

    const weekOfYear = getWeekOfYear(versionDate)
    const prevWeekOfYear = previousDate ? getWeekOfYear(previousDate) : null

    const isFirstOfWeek = !prevWeekOfYear || weekOfYear !== prevWeekOfYear

    return {
      version,
      isFirstOfDay,
      isFirstOfWeek,
      timeSincePrevious,
    }
  })
}

function getWeekOfYear(date: Date): number {
  const firstDay = new Date(date.getFullYear(), 0, 1)
  const pastDays = (date.getTime() - firstDay.getTime()) / 86400000
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7)
}

/**
 * 批量清理旧版本
 */
export function cleanupOldVersions(
  versions: NoteVersion[],
  maxVersions: number = 20
): NoteVersion[] {
  const sorted = [...versions].sort((a, b) => b.createdAt - a.createdAt)
  const toKeep: NoteVersion[] = []

  for (let i = 0; i < sorted.length; i++) {
    if (shouldKeepVersion(sorted[i], i, sorted.length) || i < maxVersions) {
      toKeep.push(sorted[i])
    }
  }

  return toKeep.sort((a, b) => b.createdAt - a.createdAt)
}
