/**
 * 智能提示系统
 * 根据用户输入习惯和上下文提供智能建议
 */

import type { Note } from '../types'

/**
 * 分析用户输入模式，提供智能补全建议
 */
export class SmartSuggestions {
  private recentSearches: string[] = []
  private recentTags: string[] = []
  private wordFrequency: Map<string, number> = new Map()

  /**
   * 更新用户输入历史
   */
  updateHistory(note: Note) {
    // 提取常用词
    const words = note.content.split(/\s+/).filter(w => w.length > 2)
    words.forEach(word => {
      const count = this.wordFrequency.get(word) || 0
      this.wordFrequency.set(word, count + 1)
    })

    // 提取标签
    this.recentTags = [...new Set([...this.recentTags, ...note.tags])].slice(-20)
  }

  /**
   * 获取搜索建议
   */
  getSearchSuggestions(query: string): string[] {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()
    const suggestions: Set<string> = new Set()

    // 从历史标签中匹配
    this.recentTags.forEach(tag => {
      if (tag.toLowerCase().includes(lowerQuery)) {
        suggestions.add(tag)
      }
    })

    // 从常用词中匹配
    Array.from(this.wordFrequency.entries())
      .filter(([word]) => word.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([word]) => suggestions.add(word))

    return Array.from(suggestions).slice(0, 5)
  }

  /**
   * 获取标签建议
   */
  getTagSuggestions(content: string, existingTags: string[]): string[] {
    const suggestions: Set<string> = new Set()
    const contentLower = content.toLowerCase()

    // 基于关键词匹配
    const keywordToTag: Record<string, string[]> = {
      'meeting': ['会议', '评审'],
      'project': ['项目', '迭代'],
      'bug': ['Bug修复', '测试'],
      'deploy': ['部署', '发布'],
      'api': ['API', '开发'],
      'design': ['设计', 'UI'],
      'review': ['复盘', '总结'],
      'daily': ['日报'],
      'weekly': ['周报'],
      'planning': ['规划', '迭代'],
      'performance': ['性能', '优化'],
      'security': ['安全'],
      'database': ['数据库'],
      'frontend': ['前端', 'React'],
      'backend': ['后端', 'Node.js'],
      'test': ['测试', '用例'],
      'launch': ['上线', '发布'],
    }

    Object.entries(keywordToTag).forEach(([keyword, tags]) => {
      if (contentLower.includes(keyword)) {
        tags.forEach(tag => {
          if (!existingTags.includes(tag)) {
            suggestions.add(tag)
          }
        })
      }
    })

    // 从最近使用的标签中推荐
    this.recentTags
      .filter(tag => !existingTags.includes(tag))
      .slice(0, 3)
      .forEach(tag => suggestions.add(tag))

    return Array.from(suggestions).slice(0, 5)
  }

  /**
   * 内容质量评估
   */
  assessContentQuality(content: string): {
    score: number
    suggestions: string[]
  } {
    const suggestions: string[] = []
    let score = 100

    // 检查长度
    if (content.length < 50) {
      score -= 20
      suggestions.push('内容过短，建议补充更多细节')
    }

    // 检查是否包含标题
    if (!content.includes('#') && !content.includes('标题')) {
      score -= 10
      suggestions.push('建议添加标题结构')
    }

    // 检查是否包含标签指示
    if (!content.includes('标签') && !content.includes('tag')) {
      score -= 5
      suggestions.push('考虑添加相关标签')
    }

    // 检查重复内容
    const words = content.split(/\s+/)
    const uniqueWords = new Set(words)
    if (uniqueWords.size < words.length * 0.3) {
      score -= 15
      suggestions.push('检测到较多重复内容，建议精简')
    }

    return {
      score: Math.max(0, score),
      suggestions
    }
  }
}

// 导出单例
export const smartSuggestions = new SmartSuggestions()
