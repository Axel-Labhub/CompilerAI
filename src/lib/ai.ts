/**
 * AI 能力模块
 * 提供笔记清洗、标签生成、周报生成等 AI 功能
 * 已接入豆包 API (Doubao-Seed-2.0-lite)
 */

import type { Note, TagSuggestion, WeeklyReport } from '../types'
import { getAIConfig, isAIConfigured } from './ai-config'

// 获取当前 AI 配置
const getAIConfigLocal = () => getAIConfig()

// ==================== Token 使用统计 ====================

let totalTokensUsed = 0

export function getTotalTokensUsed(): number {
  return totalTokensUsed
}

export function resetTokenCount(): void {
  totalTokensUsed = 0
}

// ==================== 豆包 API 调用核心 ====================

/**
 * 调用豆包 API
 */
async function callDoubaoAPI(
  systemPrompt: string,
  userContent: string,
  options?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  if (!isAIConfigured()) {
    console.warn('AI API 未配置，使用模拟实现')
    return ''
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时

    const response = await fetch(`${getAIConfigLocal().baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAIConfigLocal().apiKey}`,
      },
      body: JSON.stringify({
        model: getAIConfigLocal().model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: options?.temperature ?? getAIConfigLocal().defaultParams.temperature,
        max_tokens: options?.max_tokens ?? getAIConfigLocal().defaultParams.max_tokens,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || errorData.message || response.statusText
      throw new Error(`AI API 调用失败 (${response.status}): ${errorMsg}`)
    }

    const data = await response.json()
    
    // 更新 token 统计
    if (data.usage) {
      totalTokensUsed += data.usage.total_tokens || 0
      console.log(`Token 使用统计: 输入 ${data.usage.prompt_tokens}, 输出 ${data.usage.completion_tokens}, 总计 ${data.usage.total_tokens}`)
    }
    
    // 兼容两种响应格式
    return data.choices?.[0]?.message?.content || data.output || ''
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('AI API 调用超时，请检查网络连接')
      }
      throw error
    }
    throw new Error('AI API 调用失败: 未知错误')
  }
}

// ==================== 模拟实现（API 未配置时使用） ====================

const SIMULATE_DELAY = 500

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 情绪词映射表
const EMOTION_MAP: Record<string, string> = {
  '真烦': '需要进一步沟通确认',
  '烦死了': '需要协调资源解决',
  '无语': '存在理解偏差，需澄清',
  '崩溃': '遇到技术挑战，需重点关注',
  '累死': '工作量较大，需评估优先级',
  '坑': '发现潜在风险点',
  '恶心': '遇到不符合预期的状况',
  '牛逼': '高质量完成',
  '厉害': '表现出色',
  '摸鱼': '高效完成工作',
  '甩锅': '需明确责任边界',
  '扯皮': '需多方协调',
  '加班': '投入额外工作时长',
  '头大': '复杂度较高',
}

const FORMAL_TRANSFORM: Record<string, string> = {
  '搞定了': '已完成',
  '搞': '完成',
  '弄': '处理',
  '怼': '推进',
  '肝': '投入开发',
  '跑': '执行',
  '整': '进行',
}

// ==================== AI 一键清洗 ====================

/**
 * AI 一键清洗 - 将情绪化内容转为专业表述
 * @param text 输入的文本
 * @returns 清洗后的专业表述
 */
export async function aiCleanText(text: string): Promise<string> {
  // 如果配置了 API，使用真实 AI
  if (isAIConfigured()) {
    const systemPrompt = `你是一个专业的职场内容编辑，负责将情绪化的文字转换为中立、专业的表述。

要求：
1. 保持原意不变，只改变表达方式
2. 去除情绪化词汇和口语化表达
3. 使用专业、客观、正式的职场语言
4. 保持原有的逻辑结构和段落划分
5. 直接输出清洗后的文本，不要添加解释`

    try {
      const result = await callDoubaoAPI(systemPrompt, text)
      if (result) return result
    } catch (error) {
      console.error('AI 清洗失败，使用模拟实现:', error)
    }
  }

  // 未配置 API，使用模拟实现
  await delay(SIMULATE_DELAY)
  return simulateCleanText(text)
}

/**
 * 模拟清洗实现
 */
function simulateCleanText(text: string): string {
  let result = text
  
  Object.entries(EMOTION_MAP).forEach(([emotion, formal]) => {
    const regex = new RegExp(emotion, 'gi')
    result = result.replace(regex, formal)
  })
  
  Object.entries(FORMAL_TRANSFORM).forEach(([colloquial, formal]) => {
    const regex = new RegExp(colloquial, 'g')
    result = result.replace(regex, formal)
  })
  
  result = result
    .replace(/！{2,}/g, '。')
    .replace(/！/g, '。')
    .replace(/\s+/g, ' ')
    .trim()
  
  return result
}

// ==================== AI 智能标签 ====================

/**
 * AI 智能打标签
 * @param title 笔记标题
 * @param content 笔记内容
 * @returns 建议的标签列表（按置信度排序）
 */
export async function aiSuggestTags(title: string, content: string): Promise<TagSuggestion[]> {
  // 如果配置了 API，使用真实 AI
  if (isAIConfigured()) {
    const systemPrompt = `你是一个职场内容标签专家，负责为笔记内容提取关键词标签。

要求：
1. 输出 3-5 个标签
2. 标签用中文，简洁明了（2-4个字）
3. 涵盖主题、技能、场景等维度
4. 输出格式：JSON数组，如 ["职场沟通", "项目管理", "团队协作"]
5. 只输出 JSON 数组，不要其他内容`

    try {
      const result = await callDoubaoAPI(
        systemPrompt,
        `标题：${title}\n\n内容：${content.slice(0, 1000)}`,
        { max_tokens: 200 }
      )
      
      if (!result) {
        throw new Error('API 返回为空')
      }
      
      // 解析 JSON 响应
      const tags = JSON.parse(result)
      if (Array.isArray(tags)) {
        return tags.slice(0, 5).map((tag, index) => ({
          tag,
          confidence: 0.95 - index * 0.1,
          reason: 'AI 自动识别'
        }))
      }
    } catch (error) {
      console.error('AI 标签生成失败，使用模拟实现:', error)
    }
  }

  // 未配置 API 或解析失败，使用模拟实现
  await delay(SIMULATE_DELAY)
  return simulateSuggestTags(title, content)
}

/**
 * 模拟标签生成实现
 */
function simulateSuggestTags(title: string, content: string): TagSuggestion[] {
  const text = `${title} ${content}`.toLowerCase()
  const suggestions: TagSuggestion[] = []
  
  const keywordRules: Record<string, { tag: string; keywords: string[] }[]> = {
    work: [
      { tag: '需求', keywords: ['需求', 'prd', '功能', 'feature'] },
      { tag: '开发', keywords: ['开发', '代码', 'code', '接口'] },
      { tag: '测试', keywords: ['测试', 'test', 'bug', '用例'] },
      { tag: '部署', keywords: ['部署', 'deploy', '上线', '发布'] },
      { tag: '会议', keywords: ['会议', 'meeting', '评审', '讨论'] },
    ],
    tech: [
      { tag: 'React', keywords: ['react', '组件', 'hooks'] },
      { tag: 'TypeScript', keywords: ['typescript', 'ts', '类型'] },
      { tag: 'Node.js', keywords: ['node', 'express', 'koa'] },
      { tag: '数据库', keywords: ['数据库', 'mysql', 'sql'] },
    ],
    soft: [
      { tag: '沟通', keywords: ['沟通', '对齐', '同步'] },
      { tag: '协作', keywords: ['协作', '合作', '配合'] },
      { tag: '复盘', keywords: ['复盘', '总结', '反思'] },
    ],
  }
  
  Object.values(keywordRules).flat().forEach(rule => {
    const matched = rule.keywords.some(kw => text.includes(kw))
    if (matched) {
      suggestions.push({
        tag: rule.tag,
        confidence: 0.8,
        reason: '关键词匹配'
      })
    }
  })
  
  return suggestions.slice(0, 5)
}

// ==================== AI 周报生成 ====================

/**
 * AI 生成周报
 * @param notes 选中的笔记列表
 * @param weekRange 可选的周报时间范围描述（如"2024年1月第二周"）
 * @returns 生成的周报内容
 */
export async function aiGenerateWeeklyReport(
  notes: Pick<Note, 'title' | 'content' | 'tags' | 'createdAt'>[],
  weekRange?: string
): Promise<WeeklyReport> {
  // 解析时间范围
  const now = new Date()
  let startDate: Date
  let endDate: Date
  
  if (weekRange) {
    // 尝试解析 weekRange 中的日期
    // 简化处理：取最近7天
    endDate = new Date()
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  } else {
    // 默认本周
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 距离周一的天数
    startDate = new Date(now)
    startDate.setDate(now.getDate() - diff)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date()
  }
  // 如果配置了 API，使用真实 AI
  if (isAIConfigured()) {
    const notesContent = notes
      .map((n, i) => `${i + 1}. 【${n.title}】\n${n.content.slice(0, 500)}`)
      .join('\n\n')
    
    const systemPrompt = `你是一个专业的职场周报撰写专家，负责根据用户提供的笔记内容生成结构化的周报。

要求：
1. 按以下结构输出周报：
   - 本周工作重点（3-5条）
   - 主要成果（量化数据优先）
   - 遇到的问题及解决方案
   - 下周计划
2. 语言专业、简洁、客观
3. 突出重点和成果
4. 输出格式：JSON对象
{
  "title": "第X周工作周报",
  "summary": "本周工作概述（1-2句话）",
  "highlights": ["重点1", "重点2", "重点3"],
  "achievements": ["成果1", "成果2"],
  "problems": ["问题及解决方案"],
  "nextWeek": ["下周计划1", "下周计划2"]
}`

    try {
      const result = await callDoubaoAPI(
        systemPrompt,
        `时间范围：${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n笔记内容：\n${notesContent}`,
        { max_tokens: 1500 }
      )
      
      if (!result) {
        throw new Error('API 返回为空')
      }
      
      const report = JSON.parse(result)
      // 构建 content 用于显示
      const content = buildReportContent(report)
      return {
        title: report.title || '本周工作周报',
        content,
        summary: report.summary || '',
        highlights: report.highlights || [],
        achievements: report.achievements || [],
        problems: report.problems || [],
        nextWeek: report.nextWeek || [],
        generatedAt: Date.now(),
      }
    } catch (error) {
      console.error('AI 周报生成失败，使用模拟实现:', error)
    }
  }

  // 未配置 API 或解析失败，使用模拟实现
  await delay(SIMULATE_DELAY)
  
  const highlights = notes.slice(0, 3).map(n => n.title)
  const tags = [...new Set(notes.flatMap(n => n.tags))]
  
  const mockReport = {
    title: '本周工作周报',
    summary: `本周共完成 ${notes.length} 项工作，涉及 ${tags.slice(0, 3).join('、')} 等方面。`,
    highlights,
    achievements: ['按计划完成各项任务', '协作顺畅，沟通高效'],
    problems: ['暂无重大问题'],
    nextWeek: ['继续推进现有项目', '跟进待办事项'],
  }
  
  return {
    ...mockReport,
    content: buildReportContent(mockReport),
    generatedAt: Date.now(),
  }
}

// 构建周报内容字符串
function buildReportContent(report: {
  title: string
  summary?: string
  highlights?: string[]
  achievements?: string[]
  problems?: string[]
  nextWeek?: string[]
}): string {
  const parts: string[] = []
  
  if (report.summary) {
    parts.push(`## 概述\n${report.summary}\n`)
  }
  
  if (report.highlights?.length) {
    parts.push(`## 本周重点\n${report.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n`)
  }
  
  if (report.achievements?.length) {
    parts.push(`## 主要成果\n${report.achievements.map((a, i) => `- ${a}`).join('\n')}\n`)
  }
  
  if (report.problems?.length) {
    parts.push(`## 问题与解决\n${report.problems.map((p, i) => `- ${p}`).join('\n')}\n`)
  }
  
  if (report.nextWeek?.length) {
    parts.push(`## 下周计划\n${report.nextWeek.map((n, i) => `${i + 1}. ${n}`).join('\n')}\n`)
  }
  
  return parts.join('\n')
}

// ==================== AI 编译真相（洞察提炼） ====================

/**
 * AI 提炼核心结论和关键洞察
 * @param content 笔记内容
 * @returns 核心结论和关键洞察
 */
export async function aiExtractInsights(content: string): Promise<{
  coreConclusion: string
  keyInsights: string[]
}> {
  // 如果配置了 API，使用真实 AI
  if (isAIConfigured()) {
    const systemPrompt = `你是一个职场知识提炼专家，负责从笔记中提炼核心结论和关键洞察。

要求：
1. 提炼 1 个核心结论（1-2句话，概括最核心的观点）
2. 列出 3-5 个关键洞察（有价值的发现、启发或经验）
3. 洞察要有价值、具体、可行动
4. 输出格式：JSON对象
{
  "coreConclusion": "核心结论...",
  "keyInsights": ["洞察1", "洞察2", "洞察3"]
}`

    try {
      const result = await callDoubaoAPI(
        systemPrompt,
        content,
        { max_tokens: 800 }
      )
      
      if (!result) {
        throw new Error('API 返回为空')
      }
      
      const insights = JSON.parse(result)
      return {
        coreConclusion: insights.coreConclusion || '',
        keyInsights: insights.keyInsights || [],
      }
    } catch (error) {
      console.error('AI 洞察提炼失败，使用模拟实现:', error)
    }
  }

  // 未配置 API 或解析失败，使用模拟实现
  await delay(SIMULATE_DELAY)
  
  // 简单提取前几句作为核心结论
  const sentences = content.split(/[。！？\n]/).filter(s => s.trim().length > 10)
  const coreConclusion = sentences[0]?.trim() || '无法提炼核心结论'
  
  // 提取包含关键词的句子作为洞察
  const keywords = ['关键', '重点', '核心', '重要', '发现', '经验', '建议', '注意']
  const keyInsights = sentences
    .filter(s => keywords.some(kw => s.includes(kw)))
    .slice(0, 3)
  
  if (keyInsights.length === 0) {
    keyInsights.push(...sentences.slice(1, 4))
  }
  
  return {
    coreConclusion,
    keyInsights: keyInsights.map(s => s.trim()).filter(Boolean),
  }
}
