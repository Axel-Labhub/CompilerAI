/**
 * 编译真相架构 - 编译模块
 * 模拟 AI 分析，提取笔记的核心结论和关键洞察
 * 
 * 核心理念：笔记分区 = 结论区(编译后) + 记录区(原始内容)
 */

import type { Note, CompiledSection } from '../types'

// 关键词列表，用于识别关键洞察
const INSIGHT_KEYWORDS = [
  '关键', '重点', '核心', '重要', '必须', '需要',
  '决定', '结论', '结果', '发现', '方案', '策略',
  '价值', '意义', '目标', '原则', '本质', '规律'
]

// 提取句子（按句号、换行等分割）
function extractSentences(text: string): string[] {
  return text
    .replace(/[#*`\[\]]/g, '')  // 移除 Markdown 符号
    .split(/[。！？\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 200)  // 过滤太短或太长的句子
}

/**
 * 模拟编译 - 从内容中提取核心结论
 * @param title 笔记标题
 * @param content 笔记内容
 * @returns 编译后的分区数据
 */
export async function compileNote(title: string, content: string): Promise<CompiledSection> {
  // 模拟 AI 处理延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  const sentences = extractSentences(content)
  
  // 1. 提取核心结论：取前3句有意义的句子
  const summarySentences = sentences.slice(0, 3)
  const summary = summarySentences.length > 0
    ? summarySentences.join('。') + (summarySentences.length > 0 ? '。' : '')
    : `关于「${title}」的记录总结`

  // 2. 提取关键洞察：包含关键词的句子
  const insights = sentences
    .filter(sentence => INSIGHT_KEYWORDS.some(keyword => sentence.includes(keyword)))
    .slice(0, 5)  // 最多5条洞察
    .map(s => s.length > 100 ? s.substring(0, 100) + '...' : s)

  // 如果没有找到关键词洞察，取中间几句作为补充
  if (insights.length < 2) {
    const additionalInsights = sentences
      .filter(s => !insights.includes(s))
      .slice(0, 3 - insights.length)
    insights.push(...additionalInsights.map(s => s.length > 80 ? s.substring(0, 80) + '...' : s))
  }

  return {
    summary,
    insights: [...new Set(insights)],  // 去重
    lastCompiled: Date.now(),
    isManualEdit: false,
  }
}

/**
 * 刷新编译 - 重新生成编译结果
 * 当内容变化后，需要重新编译
 */
export async function refreshCompile(note: Note): Promise<CompiledSection> {
  return compileNote(note.title, note.content)
}

/**
 * 更新编译结论 - 用户手动编辑后的保存
 */
export function updateCompiledSummary(
  compiled: CompiledSection,
  newSummary: string
): CompiledSection {
  return {
    ...compiled,
    summary: newSummary,
    isManualEdit: true,
    lastCompiled: Date.now(),
  }
}

/**
 * 更新关键洞察 - 用户手动编辑后的保存
 */
export function updateCompiledInsights(
  compiled: CompiledSection,
  newInsights: string[]
): CompiledSection {
  return {
    ...compiled,
    insights: newInsights,
    isManualEdit: true,
    lastCompiled: Date.now(),
  }
}

/**
 * 格式化编译时间为可读字符串
 */
export function formatCompileTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}
