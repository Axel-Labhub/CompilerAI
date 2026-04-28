/**
 * 梦境循环 - 夜间整理模块
 * 
 * 核心理念：在"夜间"自动整理笔记，检测：
 * 1. 相似笔记（可能需要合并）
 * 2. 断裂链接（指向不存在的笔记）
 * 3. 整理建议（标签、归档等）
 */

import type { Note, DreamCycleReport, SimilarNotePair, BrokenLink, DreamSuggestion } from '../types'
import { getAllNotes, extractLinks, getNoteByTitle } from './db'

// 相似度阈值
const SIMILARITY_THRESHOLD = 0.6

// 提取关键词（简单实现）
function extractKeywords(text: string): string[] {
  // 移除 Markdown 符号，保留中文和英文
  const cleanText = text.replace(/[#*`\[\]()]/g, '')
  // 按空格和标点分割
  const words = cleanText.split(/[\s,，。、；;！!？?]+/)
  // 过滤太短的词和常见词
  const stopWords = new Set(['的', '是', '在', '了', '和', '与', '或', '以及', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or'])
  return words.filter(w => w.length >= 2 && !stopWords.has(w))
}

// 计算相似度（基于关键词重叠）
function calculateSimilarity(note1: Note, note2: Note): number {
  const keywords1 = new Set(extractKeywords(note1.title + ' ' + note1.content))
  const keywords2 = new Set(extractKeywords(note2.title + ' ' + note2.content))
  
  if (keywords1.size === 0 || keywords2.size === 0) return 0
  
  // Jaccard 相似度
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)))
  const union = new Set([...keywords1, ...keywords2])
  
  return intersection.size / union.size
}

// 检测相似笔记
async function detectSimilarNotes(notes: Note[]): Promise<SimilarNotePair[]> {
  const similarPairs: SimilarNotePair[] = []
  
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const similarity = calculateSimilarity(notes[i], notes[j])
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        // 生成相似原因
        const keywords1 = extractKeywords(notes[i].title)
        const keywords2 = extractKeywords(notes[j].title)
        const commonKeywords = keywords1.filter(k => keywords2.includes(k))
        
        similarPairs.push({
          note1: { id: notes[i].id, title: notes[i].title, content: notes[i].content.substring(0, 100) },
          note2: { id: notes[j].id, title: notes[j].title, content: notes[j].content.substring(0, 100) },
          similarity,
          reason: commonKeywords.length > 0
            ? `标题关键词重叠：「${commonKeywords.slice(0, 3).join('」「')}」`
            : `内容相似度 ${Math.round(similarity * 100)}%`,
        })
      }
    }
  }
  
  return similarPairs.sort((a, b) => b.similarity - a.similarity)
}

// 检测断裂链接
async function detectBrokenLinks(notes: Note[]): Promise<BrokenLink[]> {
  const brokenLinks: BrokenLink[] = []
  const existingTitles = new Set(notes.map(n => n.title))
  
  for (const note of notes) {
    const linkTitles = extractLinks(note.content)
    
    for (const targetTitle of linkTitles) {
      if (!existingTitles.has(targetTitle)) {
        // 提取链接上下文
        const lines = note.content.split('\n')
        let context = ''
        for (const line of lines) {
          if (line.includes(`[[${targetTitle}]]`)) {
            context = line.trim().substring(0, 80)
            break
          }
        }
        
        brokenLinks.push({
          sourceId: note.id,
          sourceTitle: note.title,
          targetTitle,
          context: context || `在「${note.title}」中引用`,
        })
      }
    }
  }
  
  return brokenLinks
}

// 生成整理建议
function generateSuggestions(
  similarPairs: SimilarNotePair[],
  brokenLinks: BrokenLink[],
  notes: Note[]
): DreamSuggestion[] {
  const suggestions: DreamSuggestion[] = []
  
  // 相似笔记合并建议
  for (const pair of similarPairs.slice(0, 3)) {
    suggestions.push({
      type: 'merge',
      title: `建议合并「${pair.note1.title}」和「${pair.note2.title}」`,
      description: pair.reason,
      actionItems: [
        `查看「${pair.note1.title}」的完整内容`,
        `查看「${pair.note2.title}」的完整内容`,
        '决定保留哪一篇或合并两者',
        '删除不需要的版本',
      ],
      relatedNoteIds: [pair.note1.id, pair.note2.id],
    })
  }
  
  // 断裂链接修复建议
  if (brokenLinks.length > 0) {
    const uniqueSources = [...new Set(brokenLinks.map(b => b.sourceId))]
    suggestions.push({
      type: 'link',
      title: `发现 ${brokenLinks.length} 个断裂链接`,
      description: `涉及 ${uniqueSources.length} 篇笔记，可能需要创建新笔记或修正链接`,
      actionItems: brokenLinks.slice(0, 5).map(b => `创建「${b.targetTitle}」或修正「${b.sourceTitle}」中的链接`),
      relatedNoteIds: uniqueSources,
    })
  }
  
  // 无标签笔记建议
  const untaggedNotes = notes.filter(n => n.tags.length === 0 && n.content.length > 100)
  if (untaggedNotes.length > 0) {
    suggestions.push({
      type: 'tag',
      title: `${untaggedNotes.length} 篇笔记缺少标签`,
      description: '为这些笔记添加标签可以提高搜索效率和知识组织',
      actionItems: untaggedNotes.slice(0, 5).map(n => `为「${n.title}」添加标签`),
      relatedNoteIds: untaggedNotes.slice(0, 5).map(n => n.id),
    })
  }
  
  // 长期未更新建议
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const staleNotes = notes.filter(n => n.updatedAt < thirtyDaysAgo && n.content.length > 100)
  if (staleNotes.length > 0) {
    suggestions.push({
      type: 'archive',
      title: `${staleNotes.length} 篇笔记长期未更新`,
      description: '这些笔记可能已过时，建议归档或删除',
      actionItems: staleNotes.slice(0, 5).map(n => `审核「${n.title}」：更新或归档`),
      relatedNoteIds: staleNotes.slice(0, 5).map(n => n.id),
    })
  }
  
  return suggestions
}

/**
 * 运行梦境循环 - 执行笔记整理
 * @returns 整理报告
 */
export async function runDreamCycle(): Promise<DreamCycleReport> {
  // 获取所有笔记
  const notes = await getAllNotes()
  
  // 1. 检测相似笔记
  const similarPairs = await detectSimilarNotes(notes)
  
  // 2. 检测断裂链接
  const brokenLinks = await detectBrokenLinks(notes)
  
  // 3. 生成建议
  const suggestions = generateSuggestions(similarPairs, brokenLinks, notes)
  
  // 生成报告
  const report: DreamCycleReport = {
    id: `dream_${Date.now()}`,
    timestamp: Date.now(),
    notesAnalyzed: notes.length,
    similarPairs,
    brokenLinks,
    suggestions,
    executed: false,
  }
  
  return report
}

/**
 * 获取今天修改的笔记
 */
export async function getTodayModifiedNotes(): Promise<Note[]> {
  const notes = await getAllNotes()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()
  
  return notes.filter(note => note.updatedAt >= todayStart)
}

/**
 * 检查笔记是否可以合并
 */
export function canMerge(note1: Note, note2: Note): boolean {
  const similarity = calculateSimilarity(note1, note2)
  return similarity >= SIMILARITY_THRESHOLD
}

/**
 * 合并两篇笔记
 */
export function mergeNotes(note1: Note, note2: Note): Partial<Note> {
  // 合并内容（保留两者，但用分隔线隔开）
  const mergedContent = `## ${note1.title}\n\n${note1.content}\n\n---\n\n## ${note2.title}\n\n${note2.content}`
  
  // 合并标签（去重）
  const mergedTags = [...new Set([...note1.tags, ...note2.tags])]
  
  return {
    content: mergedContent,
    tags: mergedTags,
  }
}

/**
 * 格式化报告时间
 */
export function formatReportTime(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
