// 笔记类型定义
export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  isPinned: boolean
  isFavorite: boolean  // 新增：收藏状态
  // 编译真相架构 - 编译分区
  compiledSection?: CompiledSection | null
}

// 编译分区 - 编译真相架构核心
export interface CompiledSection {
  summary: string        // AI生成的核心结论
  insights: string[]     // 关键洞察列表
  lastCompiled: number   // 最后编译时间（时间戳）
  isManualEdit?: boolean // 是否手动编辑过（用户可覆盖AI结论）
}

// AI 清洗结果
export interface AITransformResult {
  original: string
  transformed: string
  type: 'clean' | 'tags' | 'report'
}

// 周报生成结果
export interface WeeklyReport {
  title: string
  content: string
  summary?: string
  highlights?: string[]
  achievements?: string[]
  problems?: string[]
  nextWeek?: string[]
  generatedAt: number
}

// 标签建议
export interface TagSuggestion {
  tag: string
  confidence: number
  reason?: string
}

// 应用状态
export type ViewMode = 'list' | 'editor' | 'preview'

// AI 功能类型
export type AIFeatureType = 'clean' | 'tags' | 'report'

// AI 提供商类型
export type AIProvider = 'deepseek' | 'douban'

// 预设标签分类
export const TAG_CATEGORIES: Record<string, readonly string[]> = {
  work: ['需求', '开发', '测试', '部署', '文档', '会议', '评审'],
  tech: ['React', 'TypeScript', 'Node.js', '数据库', 'API', '性能', '安全'],
  soft: ['沟通', '协作', '规划', '复盘', '成长'],
  project: ['迭代', 'Bug修复', '优化', '重构', '新功能']
}

// 所有预设标签
export const ALL_TAGS = Object.values(TAG_CATEGORIES).flat()

// 标签颜色配置
export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  work: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  tech: { bg: 'bg-green-500/20', text: 'text-green-300' },
  soft: { bg: 'bg-purple-500/20', text: 'text-purple-300' },
  project: { bg: 'bg-orange-500/20', text: 'text-orange-300' },
}

// 获取标签颜色
export function getTagColor(tag: string): { bg: string; text: string } {
  for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
    if (tags.includes(tag)) {
      return TAG_COLORS[category]
    }
  }
  return { bg: 'bg-primary-500/20', text: 'text-primary-300' }
}

// ==================== 笔记模板 ====================

export interface NoteTemplate {
  id: string
  name: string
  description: string
  content: string
  icon: string
}

// 内置模板
export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'meeting',
    name: '会议纪要',
    description: '记录会议讨论要点和行动计划',
    icon: '📋',
    content: `# 会议纪要

## 会议信息
- **时间**：
- **地点**：
- **主持人**：
- **参与者**：

## 议程
1.

## 讨论要点


## 行动计划
- [ ]

## 下次会议
`
  },
  {
    id: 'daily',
    name: '日报',
    description: '记录今日工作进展和明日计划',
    icon: '📅',
    content: `# 日报 - {{date}}

## 今日完成
1.

## 工作中遇到的问题


## 明日计划
1.

## 备注
`
  },
  {
    id: 'weekly',
    name: '周报',
    description: '总结本周工作和下周安排',
    icon: '📊',
    content: `# 周报 - {{week}}

## 本周完成
### 工作内容
1.

### 产出成果


## 问题与挑战


## 下周计划
1.

## 学习与成长
`
  },
  {
    id: 'review',
    name: '复盘',
    description: '项目或任务复盘总结',
    icon: '🔄',
    content: `# 复盘

## 基本信息
- **项目/任务**：
- **时间**：
- **参与人员**：

## 目标回顾
### 预期目标


### 实际结果


## 过程分析
### 做得好的一面


### 需要改进的地方


## 经验总结


## 后续行动
- [ ]
`
  },
  {
    id: 'problem',
    name: '问题记录',
    description: '记录问题、分析原因和解决方案',
    icon: '❓',
    content: `# 问题记录

## 问题描述


## 问题分析
### 根本原因


### 影响范围


## 解决方案
### 方案A


### 方案B


## 实施计划
- [ ]

## 验证结果


## 总结
`
  }
]

// ==================== 快捷命令 ====================

export interface SlashCommand {
  id: string
  name: string
  description: string
  icon: string
  insert: string  // 插入的 Markdown 内容
  placeholder?: string  // 光标停留位置
}

// 斜杠命令列表
export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'h1', name: '标题1', description: '一级标题', icon: 'H1', insert: '# ' },
  { id: 'h2', name: '标题2', description: '二级标题', icon: 'H2', insert: '## ' },
  { id: 'h3', name: '标题3', description: '三级标题', icon: 'H3', insert: '### ' },
  { id: 'bold', name: '粗体', description: '加粗文字', icon: 'B', insert: '**{{text}}**', placeholder: 'text' },
  { id: 'italic', name: '斜体', description: '斜体文字', icon: 'I', insert: '*{{text}}*', placeholder: 'text' },
  { id: 'code', name: '代码块', description: '行内代码', icon: '`', insert: '`{{code}}`', placeholder: 'code' },
  { id: 'codeblock', name: '代码块', description: '多行代码', icon: '```', insert: '```\n{{code}}\n```', placeholder: 'code' },
  { id: 'list-ul', name: '无序列表', description: '项目符号列表', icon: '•', insert: '- ' },
  { id: 'list-ol', name: '有序列表', description: '数字编号列表', icon: '1.', insert: '1. ' },
  { id: 'checkbox', name: '待办事项', description: '可勾选的任务', icon: '☐', insert: '- [ ] ' },
  { id: 'quote', name: '引用', description: '引用块', icon: '"', insert: '> ' },
  { id: 'link', name: '链接', description: '超链接', icon: '🔗', insert: '[{{text}}]({{url}})', placeholder: 'text' },
  { id: 'table', name: '表格', description: '插入表格', icon: '▦', insert: '| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |' },
  { id: 'hr', name: '分割线', description: '水平分隔线', icon: '—', insert: '\n---\n' },
  { id: 'date', name: '日期', description: '插入当前日期', icon: '📅', insert: '{{date}}' },
  { id: 'template', name: '模板', description: '插入笔记模板', icon: '📄', insert: '' },  // 特殊处理
]

// ==================== 历史版本 ====================

export interface NoteVersion {
  id: string
  noteId: string
  title: string
  content: string
  tags: string[]
  createdAt: number
}

// ==================== 快捷键 ====================

export interface KeyboardShortcut {
  key: string
  description: string
  mac?: string  // Mac 快捷键
  windows?: string  // Windows 快捷键
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Ctrl/Cmd + S', description: '保存笔记', mac: '⌘ + S', windows: 'Ctrl + S' },
  { key: 'Ctrl/Cmd + N', description: '新建笔记', mac: '⌘ + N', windows: 'Ctrl + N' },
  { key: 'Ctrl/Cmd + F', description: '搜索', mac: '⌘ + F', windows: 'Ctrl + F' },
  { key: 'Ctrl/Cmd + P', description: '预览模式', mac: '⌘ + P', windows: 'Ctrl + P' },
  { key: 'Ctrl/Cmd + .', description: '全屏模式', mac: '⌘ + .', windows: 'Ctrl + .', },
  { key: 'Ctrl/Cmd + Shift + C', description: 'AI 清洗当前内容', mac: '⌘ + ⇧ + C', windows: 'Ctrl + Shift + C' },
  { key: 'Ctrl/Cmd + Shift + R', description: 'AI 编译真相', mac: '⌘ + ⇧ + R', windows: 'Ctrl + Shift + R' },
  { key: 'Ctrl/Cmd + Shift + W', description: '生成周报', mac: '⌘ + ⇧ + W', windows: 'Ctrl + Shift + W' },
  { key: 'Ctrl/Cmd + /', description: '显示/隐藏快捷键帮助', mac: '⌘ + /', windows: 'Ctrl + /' },
  { key: 'Escape', description: '关闭弹窗/返回', windows: 'Esc' },
  { key: 'Tab', description: '插入缩进', windows: 'Tab' },
  { key: '?', description: '显示快捷键帮助', windows: '?' },
]

// ==================== 导出类型 ====================

export type ExportFormat = 'md' | 'html' | 'pdf'

// 导出选项
export interface ExportOptions {
  includeMetadata: boolean    // 包含元数据（创建时间、更新时间、标签）
  includeCompiledSection: boolean  // 包含编译真相区域
}

// ==================== 搜索筛选 ====================

export interface SearchFilters {
  dateRange?: {
    start: number
    end: number
  }
  tags?: string[]
  sortBy: 'updatedAt' | 'createdAt' | 'title'
  sortOrder: 'asc' | 'desc'
}

// ==================== 主题 ====================

export type Theme = 'light' | 'dark' | 'system'

// ==================== 笔记链接（双向链接）====================

export interface NoteLink {
  id: string
  sourceId: string  // 来源笔记 ID
  targetTitle: string  // 目标笔记标题
  targetId?: string  // 目标笔记 ID（如果存在）
}

// ==================== 梦境循环（夜间整理）====================

// 相似笔记对
export interface SimilarNotePair {
  note1: { id: string; title: string; content: string }
  note2: { id: string; title: string; content: string }
  similarity: number  // 相似度 0-1
  reason: string      // 相似原因
}

// 断裂链接
export interface BrokenLink {
  sourceId: string
  sourceTitle: string
  targetTitle: string  // 不存在的目标标题
  context: string      // 链接所在上下文
}

// 整理建议
export interface DreamSuggestion {
  type: 'merge' | 'link' | 'tag' | 'archive'
  title: string
  description: string
  actionItems: string[]
  relatedNoteIds: string[]
}

// 梦境循环报告
export interface DreamCycleReport {
  id: string
  timestamp: number
  notesAnalyzed: number
  similarPairs: SimilarNotePair[]
  brokenLinks: BrokenLink[]
  suggestions: DreamSuggestion[]
  executed: boolean  // 是否已执行
}

// 梦境循环配置
export interface DreamCycleConfig {
  enabled: boolean
  scheduleTime: string  // HH:mm 格式，每天执行时间
  lastRun?: number      // 上次运行时间
}

// ==================== 离职交接报告 ====================

// 交接项目信息
export interface HandoverProject {
  name: string
  description: string
  status: '进行中' | '已完成' | '暂停' | '待交接'
  progress: string
  contactPerson: string
  keyMilestones?: string[]
  documents?: string[]
  notes?: string
}

// 联系人信息
export interface HandoverContact {
  name: string
  role: string
  department: string
  phone?: string
  email?: string
  wechat?: string
  responsibilities: string
}

// 待办事项
export interface HandoverTodo {
  task: string
  priority: '高' | '中' | '低'
  deadline?: string
  assignee?: string
  status: '待处理' | '进行中' | '已完成'
}

// 文档索引
export interface HandoverDocument {
  name: string
  location: string
  description: string
  lastUpdated?: string
}

// 重要提醒
export interface HandoverReminder {
  category: '账号' | '权限' | '合同' | '设备' | '其他'
  title: string
  description: string
  action?: string
}

// 离职交接报告
export interface HandoverReport {
  title: string
  employeeName: string
  department: string
  position: string
  lastWorkDate: string
  handoverDate: string
  projects: HandoverProject[]
  contacts: HandoverContact[]
  todos: HandoverTodo[]
  documents: HandoverDocument[]
  reminders: HandoverReminder[]
  accountCredentials?: HandoverAccount[]
  additionalNotes?: string
  generatedAt: number
}

// 账号密码记录（用于内部交接，不对外公开）
export interface HandoverAccount {
  system: string
  username: string
  // password 字段会在 UI 层加密显示，不直接存储
  accessLevel: string
  notes?: string
}

// 交接报告内容类型
export interface HandoverContent {
  projectList: string        // 项目交接清单
  todoList: string           // 待办事项列表
  contactList: string        // 联系人列表
  documentIndex: string      // 文档索引
  importantReminders: string // 重要提醒
  accountCredentials?: string // 账号密码记录（加密）
  additionalNotes?: string   // 补充说明
}

// ==================== 会议纪要处理 ====================

export interface MeetingSummary {
  title?: string
  meetingInfo?: {
    date?: string
    location?: string
    host?: string
    participants?: string[]
  }
  // 待办事项
  todos: TodoItem[]
  // 决策结论
  decisions: Decision[]
  // 讨论要点
  discussionPoints: string[]
  // 风险点
  risks: Risk[]
  // 时间线
  timeline: TimelineItem[]
  // 原始内容摘要
  summary?: string
  generatedAt: number
}

export interface TodoItem {
  task: string
  assignee?: string
  deadline?: string
  priority?: 'high' | 'medium' | 'low'
  status?: 'pending' | 'in-progress' | 'completed'
}

export interface Decision {
  content: string
  rationale?: string
  decisionMaker?: string
}

export interface Risk {
  description: string
  impact?: string
  mitigation?: string
  severity?: 'high' | 'medium' | 'low'
}

export interface TimelineItem {
  time?: string
  topic: string
  speaker?: string
  keyPoints?: string[]
}
