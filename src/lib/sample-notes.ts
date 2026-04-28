/**
 * 示例笔记数据
 * 预置 2-3 条演示笔记，帮助用户快速理解产品价值
 */

import type { Note } from '../types'

// 辅助函数：生成示例笔记 ID
const generateSampleId = (index: number) => `sample_note_${index}_${Date.now()}`

// 示例笔记1：周报素材笔记（展示 AI 清洗 + 周报生成）
export const sampleNote1: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '📋 周报素材',
  content: `今天终于把那个需求搞完了，累死了，不过结果还行

上午开了个项目评审会，扯了半天皮，需求又改了，领导说要注意用户体验

下午修了个bug，花了一整天，终于跑通了，测试那边反馈没问题了

还有一个接口文档要写，明天继续吧`,
  tags: ['需求', '开发', 'Bug修复'],
  isPinned: false,
  isFavorite: false,
}

// 示例笔记2：情绪吐槽笔记（展示情绪化表达 → 专业表达）
export const sampleNote2: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '💭 工作吐槽',
  content: `领导又改需求了，气死了，这个坑太深

组里那个卷王天天加班到10点，搞得大家都卷起来

代码写得稀烂还觉得自己很牛，真是无语

卷不动了卷不动了，感觉要被卷死了

不过今天总算把核心模块重构完了，还算有点成就感`,
  tags: ['复盘', '成长'],
  isPinned: false,
  isFavorite: false,
}

// 示例笔记3：编译真相示例（展示提炼精华）
export const sampleNote3: Omit<Note, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '🔍 本周技术方案讨论',
  content: `周一：
- 讨论了数据库选型方案，最终决定使用 PostgreSQL
- 理由：支持 JSON 类型，查询性能好，生态成熟

周二：
- 用户量预估达到 10 万 QPS，需要考虑缓存方案
- 初步方案：Redis + 本地缓存二级缓存

周三：
- 技术方案评审，重点讨论了高可用架构
- 决定采用主从 + 哨兵模式，保证 99.9% 可用性

周四：
- 确认了分库分表策略，按用户 ID 哈希分区
- 预计可支撑 100 倍当前数据量增长

周五：
- 整理了技术方案文档，输出到 wiki
- 下周开始实现第一阶段：用户服务重构`,
  tags: ['开发', '评审', '规划'],
  isPinned: false,
  isFavorite: false,
}

// 所有示例笔记列表
export const SAMPLE_NOTES = [sampleNote1, sampleNote2, sampleNote3]

// 示例笔记说明（用于 UI 展示）
export const SAMPLE_NOTES_INFO = [
  {
    id: 'sample_1',
    title: '周报素材笔记',
    description: '随手记录情绪化的工作片段，一键 AI 清洗生成正式周报',
    icon: '📋',
    tags: ['需求', '开发', 'Bug修复'],
  },
  {
    id: 'sample_2',
    title: '情绪吐槽笔记',
    description: '把「领导又改需求了气死了」清洗成专业表达',
    icon: '💭',
    tags: ['复盘', '成长'],
  },
  {
    id: 'sample_3',
    title: '编译真相示例',
    description: '长篇技术讨论 → 提炼精华结论，抓住核心要点',
    icon: '🔍',
    tags: ['开发', '评审', '规划'],
  },
]

// 编译真相示例的预生成结论
export const SAMPLE_COMPILED_SECTION = {
  summary: '本周完成技术方案设计，确定 PostgreSQL + Redis 缓存 + 分库分表架构',
  insights: [
    'PostgreSQL 满足 JSON 存储和查询性能需求',
    'Redis 二级缓存方案可支撑 10 万 QPS',
    '分库分表按用户 ID 哈希，支撑 100 倍数据增长',
    '主从 + 哨兵模式保证高可用性',
  ],
}
