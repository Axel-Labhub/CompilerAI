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

// ==================== 错误类型定义 ====================

/**
 * AI API 错误类型
 */
export enum AIErrorType {
  /** API 未配置 */
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  /** 网络连接错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** API 请求超时 */
  TIMEOUT = 'TIMEOUT',
  /** API 认证失败 */
  AUTH_ERROR = 'AUTH_ERROR',
  /** API 限流 */
  RATE_LIMIT = 'RATE_LIMIT',
  /** API 服务器错误 */
  SERVER_ERROR = 'SERVER_ERROR',
  /** API 返回格式错误 */
  PARSE_ERROR = 'PARSE_ERROR',
  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * AI API 错误类
 */
export class AIError extends Error {
  type: AIErrorType
  originalError?: Error
  isRetryable: boolean

  constructor(type: AIErrorType, message: string, originalError?: Error) {
    super(message)
    this.name = 'AIError'
    this.type = type
    this.originalError = originalError
    
    // 判断是否可重试
    this.isRetryable = [
      AIErrorType.TIMEOUT,
      AIErrorType.SERVER_ERROR,
      AIErrorType.RATE_LIMIT,
      AIErrorType.NETWORK_ERROR,
    ].includes(type)
  }
}

/**
 * 获取友好的错误提示信息
 */
export function getAIErrorMessage(error: AIError): string {
  switch (error.type) {
    case AIErrorType.NOT_CONFIGURED:
      return 'AI 功能尚未配置，请先在设置中配置 API'
    case AIErrorType.TIMEOUT:
      return '请求超时，AI 响应较慢，请稍后重试'
    case AIErrorType.NETWORK_ERROR:
      return '网络连接失败，请检查网络后重试'
    case AIErrorType.AUTH_ERROR:
      return 'API 认证失败，请检查 API Key 是否正确'
    case AIErrorType.RATE_LIMIT:
      return '请求过于频繁，请稍后再试'
    case AIErrorType.SERVER_ERROR:
      return 'AI 服务暂时不可用，请稍后重试'
    case AIErrorType.PARSE_ERROR:
      return 'AI 返回格式异常，已使用本地处理'
    default:
      return error.message || 'AI 处理失败，请稍后重试'
  }
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
    throw new AIError(
      AIErrorType.NOT_CONFIGURED,
      'AI API 未配置，使用模拟实现'
    )
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

    // 处理 HTTP 错误状态
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error?.message || errorData.message || response.statusText

      switch (response.status) {
        case 401:
        case 403:
          throw new AIError(
            AIErrorType.AUTH_ERROR,
            `API 认证失败 (${response.status}): ${errorMsg}`,
            new Error(errorMsg)
          )
        case 429:
          throw new AIError(
            AIErrorType.RATE_LIMIT,
            `请求过于频繁，请稍后再试 (${response.status})`,
            new Error(errorMsg)
          )
        case 500:
        case 502:
        case 503:
          throw new AIError(
            AIErrorType.SERVER_ERROR,
            `AI 服务暂时不可用 (${response.status})，请稍后重试`,
            new Error(errorMsg)
          )
        default:
          throw new AIError(
            AIErrorType.SERVER_ERROR,
            `AI API 调用失败 (${response.status}): ${errorMsg}`,
            new Error(errorMsg)
          )
      }
    }

    const data = await response.json()
    
    // 更新 token 统计
    if (data.usage) {
      totalTokensUsed += data.usage.total_tokens || 0
      console.log(`Token 使用统计: 输入 ${data.usage.prompt_tokens}, 输出 ${data.usage.completion_tokens}, 总计 ${data.usage.total_tokens}`)
    }
    
    // 兼容两种响应格式
    const content = data.choices?.[0]?.message?.content || data.output || ''
    
    // 检查返回内容是否为空
    if (!content || content.trim() === '') {
      throw new AIError(
        AIErrorType.PARSE_ERROR,
        'AI 返回内容为空',
        new Error('Empty response')
      )
    }
    
    return content
  } catch (error) {
    if (error instanceof AIError) {
      throw error
    }
    
    if (error instanceof Error) {
      // 处理 AbortError（超时）
      if (error.name === 'AbortError') {
        throw new AIError(
          AIErrorType.TIMEOUT,
          'AI API 调用超时，请检查网络连接',
          error
        )
      }
      
      // 处理网络错误
      if (error.message.includes('fetch') || 
          error.message.includes('network') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')) {
        throw new AIError(
          AIErrorType.NETWORK_ERROR,
          '网络连接失败，请检查网络后重试',
          error
        )
      }
      
      // 其他错误
      throw new AIError(
        AIErrorType.UNKNOWN,
        `AI API 调用失败: ${error.message}`,
        error
      )
    }
    
    throw new AIError(
      AIErrorType.UNKNOWN,
      'AI API 调用失败: 未知错误',
      undefined
    )
  }
}

// ==================== 模拟实现（API 未配置时使用） ====================

const SIMULATE_DELAY = 500

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ==================== 情绪词映射表（扩充至100+） ====================

/**
 * 负面情绪词 → 正式表达
 */
const NEGATIVE_EMOTIONS: Record<string, string> = {
  // 烦恼类
  '烦死了': '需要进一步协调处理',
  '好烦': '需持续关注',
  '太烦了': '需多方协调',
  '烦': '需要处理',
  '心烦': '需调整方案',
  '闹心': '存在待解决问题',
  '纠结': '需进一步明确需求',
  '心塞': '资源受限，需调整策略',
  '闹腾': '存在较多干扰因素',
  '蛋疼': '问题较棘手',
  '扎心': '触及敏感点',

  // 崩溃类
  '崩溃': '遇到技术挑战，需重点关注',
  '要崩溃': '遇到较大阻力',
  '快崩溃': '工作压力较大',
  '崩了': '遇到突发问题',
  '原地爆炸': '情况超出预期',
  '炸裂': '影响范围较大',
  '裂开': '问题较严重',
  '碎了': '信心受挫',

  // 无语类
  '无语': '存在理解偏差，需澄清',
  '真无语': '与预期有较大出入',
  '超无语': '存在较大认知差异',
  '服了': '需重新评估方案',
  '服气': '需要调整认知',
  '无话可说': '需要进一步沟通',
  '没话说': '需补充信息',

  // 疲惫类
  '累死了': '工作量较大，需评估优先级',
  '太累了': '工作强度较高',
  '累': '工作量较大',
  '疲惫': '需适当调整节奏',
  '疲倦': '精力消耗较大',
  '精疲力竭': '资源耗尽，需休整',
  '透支': '超负荷运转',
  '虚脱': '精力不足',

  // 头大/焦虑类
  '头大': '复杂度较高',
  '头秃': '技术难度较大',
  '焦虑': '需要资源支持',
  '焦虑症': '压力较大，需关注',
  '着急': '时间紧迫',
  '急死': '交付时间临近',
  '慌张': '需稳定心态',
  '紧张': '准备不够充分',
  '压力山大': '承压较大',
  '秃头': '难度较大',
  '掉头发': '耗时较长',

  // 烦躁类
  '烦躁': '需协调多方意见',
  '暴躁': '沟通方式需调整',
  '郁闷': '存在未解决的阻塞问题',
  '难受': '工作体验受影响',
  '不爽': '存在不满意因素',
  '憋屈': '诉求未能表达',

  // 气恼类
  '气死了': '情绪激动，需冷静处理',
  '气': '情绪波动',
  '恼火': '状况超出预期',
  '恼人': '存在持续干扰因素',
  '火大': '冲突较明显',
  '抓狂': '问题较为棘手',
  '暴怒': '情绪失控',

  // 无奈类
  '无奈': '资源或条件受限',
  '醉了': '情况复杂',
  '瞎了': '信息量过大',
  '麻了': '已习以为常',
  '麻': '需调整心态',

  // 委屈类
  '委屈': '付出未被认可',
  '冤枉': '存在误解',
  '吃亏': '权益受损',

  // 失望类
  '失望': '结果未达预期',
  '绝望': '需重新定位方向',
  '心凉': '信心受挫',
  '凉凉': '前景不明朗',
  '完蛋': '情况不乐观',

  // 酸类（网络语）
  '酸了': '存在竞争心态',
  '柠檬精': '存在比较心理',
  '羡慕': '期望提升',
  '嫉妒': '存在竞争意识',
  '眼红': '利益诉求',
  '柠檬': '需调整心态',

  // 躺平摆烂类
  '躺平': '采取保守策略',
  '摆烂': '暂不追求突破',
  '摸鱼': '高效完成基础任务',
  '划水': '完成基本工作',
  '佛系': '采取稳健策略',
  '躺': '保持现状',
  '开摆': '暂不追求突破',
  '摆': '灵活处理',

  // 内卷类
  '卷': '竞争激烈',
  '太卷了': '行业竞争加剧',
  '内卷': '资源争夺激烈',
  '卷王': '高绩效表现者',
  '卷不动': '需要策略调整',
  '卷死': '竞争过于激烈',

  // 吐槽类
  '坑': '存在潜在风险',
  '巨坑': '存在重大风险',
  '天坑': '风险程度较高',
  '挖坑': '引入新风险点',
  '坑爹': '问题严重程度较高',
  '坑人': '影响权益',
  '恶心': '不符合预期',
  '恶心人': '存在干扰因素',
  '膈应': '存在不适因素',

  // 甩锅扯皮类
  '甩锅': '需明确责任边界',
  '扯皮': '需多方协调',
  '推诿': '责任不清晰',
  '踢皮球': '流程待优化',
  '背锅': '承担额外责任',
  '背锅侠': '承担责任较多',
  '接锅': '承担责任',

  // 画饼类
  '画饼': '目标设定过高',
  '大饼': '承诺难以兑现',
  '饼太大': '目标需分阶段实现',
  'PPT': '方案待落地',
  '大饼画圆': '承诺需逐步兑现',

  // PUA类
  'PUA': '沟通方式需调整',
  'CPU': '需理性判断',
  '职场PUA': '管理方式待改进',

  // KPI/考核类
  'KPI压死人': '绩效目标较高',
  '卷绩效': '追求更高绩效',
  '绩效考核': '定期评估',
  '绩效压力': '承压较大',

  // 加班类
  '加班': '投入额外工作时长',
  '通宵': '工作强度较大',
  '肝': '投入大量精力',
  '肝不动': '精力有限',
  '爆肝': '严重透支',
  '996': '工作时间较长',
  '007': '全天候待命',
  '大小周': '工作节奏紧凑',
  '周末加班': '投入额外工作时间',

  // 开会类
  '开会': '进行沟通会议',
  '无效会议': '会议效率待提升',
  '文山会海': '沟通成本较高',
  '拉会': '组织协调',

  // 职场黑话类
  '对齐': '信息同步',
  '拉齐': '多方协调',
  '落地': '实施执行',
  '赋能': '提供支持',
  '闭环': '完成闭环',
  '抓手': '切入点',
  '打法': '策略方案',
  '维度': '角度考量',
  '沉淀': '积累经验',
  '复用': '重复使用',
  '透传': '直接传递',
  '中台': '共享平台',
  '垂直': '专业领域',
  '横向': '跨部门协作',
  '纵深': '深度发展',
  '迭代': '持续优化',
  '灰度': '分批发布',
  '容灾': '备份机制',
  '降级': '降低服务级别',
  '熔断': '紧急中断',
  '赋能业务': '支持业务发展',
  '打通': '实现联通',
  '整合': '资源优化配置',
  '聚焦': '专注核心领域',
  '突破': '达成关键进展',
  '协同': '多方协作配合',
  '联动': '跨部门协作',
  '对齐颗粒度': '细化目标共识',

  // 邮件/文档类
  '回邮件': '进行邮件沟通',
  '写报告': '进行文档输出',
  '写文档': '进行文档整理',
  'PPT造火箭': '形式大于内容',

  // 技术开发类
  '跑通': '实现功能',
  '卡住': '遇到阻塞问题',
  '阻塞': '存在阻断问题',
  '提测': '提交测试',
  '联调': '联调测试',
  '预发': '预发布',
  '上线': '正式发布',
  '回滚': '版本回退',
  '热修复': '紧急修复',
  'Bug': '缺陷',
  '代码review': '代码评审',
  '技术债': '技术债务',
  '重构': '代码优化',
  '方案评审': '方案审核',
  '需求评审': '需求审核',
  '打回': '退回修改',
  '延期': '调整交付时间',
  '跳票': '延迟交付',
  '翻车': '出现问题',
  '掉链子': '出现故障',

  // 跨部门协作类
  '需求方': '业务方',
  '甲方爸爸': '甲方',
  '乙方': '服务方',
  '加需求': '增加需求',
  '砍需求': '缩减需求',
  '需求变更': '需求调整',
  '需求膨胀': '范围蔓延',
  '跨团队': '跨部门',
  '沟通成本': '协调投入',
  '撕逼': '深入讨论',
  'battle': '竞争比选',
  'PK': '竞争对比',

  // 汇报类
  '述职': '述职报告',
  '年终总结': '年度总结',
  '季度复盘': '季度回顾',
  '周会汇报': '周期汇报',
  '数据汇报': '数据呈现',
  'PPT汇报': '演示汇报',
  '画大饼': '设定远大目标',
  '汇报材料': '汇报文档',

  // 绩效晋升类
  '年终奖': '年度奖金',
  '涨薪': '薪资调整',
  '晋升': '职级提升',
  '职级': '专业等级',
  '绩效S': '卓越绩效',
  '绩效A': '超出预期',
  '绩效B': '符合预期',
  '绩效C': '低于预期',
  '末位淘汰': '绩效优化',
  '调薪': '薪酬调整',
  '打包': '裁员',
  '优化': '人员调整',
  '毕业': '离职',
  '向社会输送人才': '裁员',

  // 远程办公类
  '居家办公': '远程办公',
  'WFH': '居家办公',
  '视频会议': '在线会议',
  '在线文档': '协同文档',
  '已读不回': '未及时回复',
  '钉一下': '即时提醒',
  '夺命连环call': '连续电话',
  '在线等': '等待回复',

  // 开会类
  '无效会议': '低效会议',
  '文山会海': '会议过多',
  '拉会': '组织会议',
  '周会': '周期会议',
  '晨会': '早间站会',
  '评审会': '评审会议',
  '对齐会': '同步会议',
  '吐槽会': '反馈会议',
  '甩锅会': '责任讨论会',

  // 其他职场表达
  '领导': '管理层',
  '老板': '负责人',
  '摸鱼': '高效完成基础任务',
  '划水': '完成基本工作',
  '太卷': '竞争激烈',
  '太难': '复杂度高',
  '太赶': '时间紧迫',
  '太赶了': '交付压力较大',
  '太重了': '权重较高',
  '太轻了': '权重较低',
  '太贵': '成本较高',
  '太便宜': '价格较低',
  '太慢': '进度较慢',
  '太快': '节奏较快',
  '太闲': '工作不饱和',
  '太忙': '工作负荷较大',

  // 讽刺反讽类
  '懂的都懂': '需进一步说明',
  '你品你细品': '需仔细理解',
  '懂的自然懂': '信息不对称',
  '表面': '外在表现',
  '背地里': '私下情况',
  '明的暗的': '显性和隐性',
  '套路': '固定模式',
  '骚操作': '不规范操作',
  '骚套路': '非常规方法',
  '骚操作': '特殊处理方式',
  '骚气': '做法较为大胆',
  '魔幻': '超出预期',
  '离谱': '偏离正常',
  '逆天': '不符合常规',
  '迷惑行为': '难以理解的行为',
  '奇葩': '独特需求',
  '神操作': '关键操作',

  // 资源争取类
  '抢资源': '资源竞争',
  '争资源': '资源协调',
  '资源倾斜': '重点投入',
  '资源池': '可用资源',
  '抢人': '人才争夺',
  '抢预算': '预算竞争',
  '抢时间': '时间紧迫',
  '排期': '排期安排',
  '插队': '紧急任务插入',
  '加塞': '插入优先级',
  '砍预算': '缩减投入',
  '缩预算': '降低投入',

  // 进度相关类
  'delay': '延期',
  '进度落后': '进度滞后',
  '赶进度': '加快进度',
  '催进度': '跟进进度',
  '卡进度': '进度受阻',
  '拖进度': '影响进度',
  '跳票': '延迟交付',
  '延期上线': '延迟发布',
  '提前上线': '提前发布',
  '赶工期': '压缩工期',
  '压进度': '压缩进度',
  '里程碑': '关键节点',
  'deadline': '截止日期',

  // 质量相关类
  'Bug多': '质量问题较多',
  'Bug率': '缺陷率',
  '翻车': '出现质量问题',
  '质量事故': '质量问题',
  '线上故障': '生产环境问题',
  '故障率': '问题发生率',
  '可用性': '服务可用性',
  '稳定性': '系统稳定性',
  '性能差': '性能不达标',
  '卡顿': '响应延迟',
  '闪退': '异常退出',
  '白屏': '页面异常',
  '崩溃': '服务中断',

  // 人际关系类
  '抱大腿': '寻求支持',
  '站队': '选择立场',
  '宫斗': '内部竞争',
  '职场政治': '组织协调',
  '小人': '不当行为',
  '穿小鞋': '刁难',
  '边缘化': '参与度降低',
  '抢功': '成果归属争议',
  '摘桃子': '获取他人成果',
  '挖墙脚': '争取资源',
  '画圈圈': '设置障碍',
  '孤立': '排除在核心外',

  // 客户相关类
  '甲方': '客户方',
  '乙方': '服务方',
  '甲方要求': '客户需求',
  '甲方爸爸': '重要客户',
  '客户变更': '需求变更',
  '客户验收': '客户确认',
  '客户反馈': '用户意见',
  '客户满意': '用户满意度',
  '客诉': '客户投诉',
  '投诉': '负面反馈',
  '差评': '负面评价',
  '投诉处理': '问题处理',

  // 缩写词类
  'PM': '项目经理',
  'TL': '技术负责人',
  'PD': '产品设计师',
  'RD': '研发人员',
  'QA': '测试人员',
  'OP': '运维人员',
  'UI': '界面设计',
  'UE': '用户体验',
  'UX': '用户体验设计',
  'PRD': '产品需求文档',
  'MRD': '市场需求文档',
  'BRD': '商业需求文档',
  'FAQ': '常见问题',
  'ROI': '投资回报率',
  'OKR': '目标与关键成果',
  'KPI': '关键绩效指标',

  // 加班相关类
  '加班到凌晨': '夜间加班',
  '通宵达旦': '通宵工作',
  '周末加班': '周末工作',
  '节假日加班': '假期工作',
  '调休': '补休安排',
  '加班费': '超时补贴',
  '加班文化': '超时工作氛围',
  '无偿加班': '无补贴加班',
  '强制加班': '必须加班',
  '自愿加班': '主动加班',

  // 薪资相关类
  '白菜价': '薪资较低',
  '打包价': '整体薪资',
  '薪资倒挂': '新员工薪资高于老员工',
  '年终': '年度奖金',
  '年中奖': '半年度奖金',
  '季度奖': '季度奖金',
  '项目奖': '项目奖金',
  '股票': '股权激励',
  '期权': '股票期权',
  'RSU': '限制性股票',
  '总包': '年度总报酬',
  'Base': '基本薪资',
  '福利': '员工福利',
  '五险一金': '社会保险',

  // 面试相关类
  '面试': '招聘面试',
  '笔试': '笔试考核',
  '一面': '初试',
  '二面': '复试',
  '三面': '终面',
  'HR面': '人事面试',
  '背调': '背景调查',
  '谈薪': '薪资谈判',
  'OC': '录用通知',
  'HC': '招聘名额',
  '岗位': '职位',
  'JD': '职位描述',
  '简历': '个人履历',

  // 入离职相关类
  '入职': '加入公司',
  '离职': '离开公司',
  '跳槽': '更换工作',
  '裸辞': '未找到新工作离职',
  '被裁': '被动离职',
  '裁员': '人员优化',
  '优化': '裁员',
  'N+1': '离职补偿',
  '试用期': '考察期',
  '转正': '正式员工',
  '实习': '实习期',
  '劝退': '要求主动离职',
  '开人': '解除劳动关系',

  // 邮件相关类
  '回复': '反馈',
  '不回': '未响应',
  '已读': '已查看',
  '未读': '未查看',
  '抄送': '副本发送',
  '密送': '隐藏副本',
  '群发': '批量发送',
  '轰炸': '大量发送',
  '垃圾邮件': '无关邮件',
  '催命邮件': '紧急邮件',
  '长邮件': '内容冗长的邮件',
  '邮件礼仪': '沟通规范',

  // 潜规则类
  '职场潜规则': '内部规则',
  '关系户': '有关系的人员',
  '论资排辈': '按资历排序',
  '裙带关系': '亲属关系',
  '溜须拍马': '讨好上级',
  '见风使舵': '迎合变化',
  '见人说人话': '差异化沟通',
  '表面功夫': '形式化工作',
  '形式主义': '重形式轻实质',

  // Emoji表情替换 → 先转情绪描述，再转正式表达
  // 负面情绪类
  '😤': '强烈不满',
  '😠': '存在不满',
  '😡': '情绪激动',
  '🤬': '非常不满',
  '👿': '遇到阻碍',
  '💢': '存在冲突',
  '😱': '情况紧急',
  '😭': '情绪较为激动',
  '😢': '感到遗憾',
  '😞': '存在失落',
  '😔': '情绪低落',
  '😩': '工作压力较大',
  '😫': '精力不足',
  '🥺': '需支持帮助',
  '😒': '态度需调整',
  '🙄': '存在疑虑',
  '😑': '情绪疲惫',
  '😬': '存在尴尬',
  '😮‍💨': '需调整心态',
  '😮': '感到意外',
  '🤯': '超出预期',
  '😵‍💫': '信息过载',
  '😵': '感到困惑',
  
  // 正面情绪类
  '😊': '心情愉悦',
  '😄': '非常满意',
  '🥰': '工作顺利',
  '😍': '非常满意',
  '🤩': '非常满意',
  '😎': '充满信心',
  '🤗': '心情愉悦',
  '😌': '工作顺利',
  '🤠': '充满信心',
  '🙂': '态度正面',
  '😇': '表现良好',
  '🥳': '取得成果',
  '🎉': '取得成果',
  '🎊': '取得成果',
  
  // 中性/动作类
  '🤔': '需进一步思考',
  '😐': '态度中立',
  '😶': '保留意见',
  '😏': '态度需调整',
  '🙃': '需调整视角',
  '🤭': '需注意沟通',
  '🤫': '需谨慎处理',
  '🫢': '需澄清',
  '🫡': '收到指令',
  '👋': '挥手告别',
  '👍': '表示认可',
  '👎': '表示异议',
  '👏': '给予肯定',
  '🤝': '达成共识',
  '💪': '需持续努力',
  '🙏': '表示感谢',
  '✊': '表示支持',
  '🤙': '收到反馈',
  
  // 物品/场景类
  '💼': '工作相关',
  '📊': '数据分析',
  '📈': '业绩增长',
  '📉': '业绩下降',
  '💡': '有新想法',
  '🔥': '情况紧急',
  '⚡': '进展迅速',
  '⏰': '时间紧迫',
  '⌛': '等待中',
  '📝': '待处理',
  '✅': '已完成',
  '❌': '存在问题',
  '⚠️': '存在风险',
  '🚨': '紧急情况',
  '🏆': '获得成就',
  '💔': '受到影响',

  // 谐音梗类
  '耗子尾汁': '好自为之',
  '基操勿6': '基本操作，不用大惊小怪',
  '虾仁猪心': '杀人诛心',
  '不讲武德': '行为不规范',

  // 程度加强类
  '巨坑': '存在重大风险',
  '巨难': '难度极大',
  '巨累': '工作强度很大',
  '巨烦': '非常繁琐',
  '巨香': '非常值得',
  '绝绝子': '效果极佳',
  '无敌': '极具竞争力',
  '爆炸': '影响巨大',
  '超神': '表现卓越',

  // 感叹词类
  '我的天': '经分析',
  '我的妈': '经分析发现',
  '天哪': '经评估',
  '啊这': '需进一步说明',
  '就离谱': '偏离正常',
  '好家伙': '需要重视',

  // 否定表达类
  '不行': '需要改进',
  '不香': '性价比不高',
  '不爽': '存在不满',
  '不舒服': '体验不佳',
  '不靠谱': '可靠性不足',
  '不OK': '不符合要求',

  // 职场焦虑类
  '35岁危机': '职业发展瓶颈',
  '中年危机': '职业发展焦虑',
  '失业焦虑': '职业稳定性担忧',
  '转行焦虑': '职业转型压力',
  'KPI焦虑': '绩效压力',
  '职场天花板': '晋升受限',

  // 通勤类
  '挤地铁': '公共交通出行',
  '打卡': '签到',
  '迟到': '未按时到达',
  '堵车': '交通拥堵',
  '通勤': '上下班出行',

  // 办公室政治类
  '明争暗斗': '内部竞争',
  '尔虞我诈': '信任缺失',
  '两面三刀': '行为不一致',
  '阿谀奉承': '不真诚沟通',
  '勾心斗角': '内部竞争',

  // PUA话术应对类
  '你不行': '能力待提升',
  '你看看别人': '与行业差距',
  '再努努力': '需进一步提升',
  '能者多劳': '工作分配不均',

  // 摸鱼哲学类
  '带薪上厕所': '合理利用休息时间',
  '摸鱼时间': '工作间隙休息',
  '划水时间': '调整工作节奏',
  '摸鱼哲学': '工作生活平衡',
  '躺平哲学': '保持平和心态',

  // 职场自嘲类
  '工具人': '执行角色',
  '打工人': '职业工作者',
  '社畜': '职场人员',
  '搬砖人': '基层工作者',
  '码农': '开发工程师',
  '程序猿': '开发人员',
  '产品汪': '产品经理',

  // 工作量类
  '活太多': '工作负荷较大',
  '活太少': '工作不饱和',
  '活来了': '新任务',
  '活干不完': '任务积压',
  '干不完': '进度受阻',

  // 开会吐槽类
  '又开会': '会议较多',
  '没有输出': '无实质进展',
  '没有结论': '待明确',
  '会而不议': '效率较低',
  '议而不决': '决策滞后',

  // 需求吐槽类
  '需求奇葩': '需求独特',
  '需求反复': '需求变更频繁',
  '需求不明确': '需求待澄清',
  '边做边改': '迭代优化',

  // 代码吐槽类
  '代码烂': '代码质量待提升',
  '屎山': '代码复杂度高',
  '祖传代码': '历史代码',
  '魔改': '大幅修改',
  '重构': '代码优化',

  // 测试吐槽类
  '提Bug': '提交缺陷',
  'Bug回归': '缺陷复现',
  '测试不通过': '验证未通过',
  '线上事故': '生产环境问题',
  '紧急上线': '加急发布',

  // 团队协作类
  '甩锅': '责任转移',
  '接锅': '承担责任',
  '背锅': '承担额外责任',
  '撕逼': '深入讨论',

  // 工作氛围类
  '卷文化': '过度竞争氛围',
  '狼性文化': '高绩效要求',
  '弹性工作': '灵活工时',

  // 职场社交类
  '团建': '团队活动',
  '下午茶': '茶歇时间',
  '应酬': '社交活动',
  '陪笑': '礼貌性沟通',

  // 职场成长类
  '学不到东西': '成长受限',
  '没有晋升': '发展空间受限',
  '天花板': '上升空间有限',
  '混日子': '保持现状',

  // 工作满意度类
  '想离职': '考虑职业变动',
  '干够了': '职业倦怠',
  '想跳槽': '寻找新机会',
  '想躺平': '保持现状',

  // 其他补充类
  '无语子': '存在疑惑',
  '芭比Q了': '情况不利',
  '老铁': '同事',
  '扎心': '触及敏感点',
  '破防': '心理防线被突破',
  '内耗': '自我消耗',
  '精神内耗': '心理压力',
  '自我怀疑': '信心不足',
  '玻璃心': '心理承受能力较弱',
  '心态崩了': '心理状态不佳',
}

/**
 * 吐槽表达词 → 正式表达
 */
const SARCASM_EXPRESSIONS: Record<string, string> = {
  // 坑类
  '坑': '发现潜在风险点',
  '巨坑': '存在重大风险',
  '天坑': '风险程度较高',
  '挖坑': '引入新风险点',
  '坑爹': '问题严重程度较高',
  
  // 恶心类
  '恶心': '遇到不符合预期的状况',
  '太恶心': '严重偏离预期',
  '反胃': '问题性质恶劣',
  '吐了': '问题影响恶劣',
  
  // 甩锅类
  '甩锅': '需明确责任边界',
  '甩': '责任归属需明确',
  '推卸': '职责边界需清晰',
  
  // 扯皮类
  '扯皮': '需多方协调',
  '皮球': '流程待优化',
  '踢皮球': '协作机制待完善',
  
  // 摆烂类
  '摆烂': '需重新审视执行策略',
  '烂': '质量有待提升',
  
  // 摸鱼类
  '摸鱼': '高效完成工作',
  '摸': '灵活调整工作方式',
  
  // 划水类
  '划水': '高效完成工作',
  '水': '工作方式灵活',
  
  // 偷懒类
  '偷懒': '注重效率优化',
  '懒': '方法值得借鉴',
  
  // 内卷类
  '内卷': '竞争较激烈',
  '卷': '投入度较高',
  '卷王': '表现出色',
}

/**
 * 积极/夸赞表达词 → 正式表达
 */
const POSITIVE_EXPRESSIONS: Record<string, string> = {
  // 牛逼类
  '牛逼': '高质量完成',
  'NB': '高质量完成',
  '牛': '表现优异',
  '牛批': '表现卓越',
  '牛叉': '成果超出预期',
  
  // 厉害类
  '厉害': '表现出色',
  '强': '能力突出',
  '太强了': '远超预期',
  '太强': '超出预期',
  '超厉害': '表现卓越',
  
  // YYDS类
  'YYDS': '堪称典范',
  '永远的神': '标杆案例',
  '绝了': '效果极佳',
  '绝绝子': '效果卓越',
  
  // 赞类
  '赞': '完成度较高',
  '点赞': '值得肯定',
  '棒': '表现良好',
  '棒棒哒': '完成度良好',
  '优秀': '成果优秀',
  '优秀啊': '成果优秀，值得表扬',
}

/**
 * 口语化动词 → 正式表达
 */
const COLLOQUIAL_VERBS: Record<string, string> = {
  // 完成类
  '搞定了': '已完成',
  '搞定': '已完成',
  '搞完': '已完成',
  '搞掂': '已完成',
  '完事': '已完成',
  
  // 操作类
  '搞': '完成',
  '弄': '处理',
  '怼': '推进',
  '肝': '投入开发',
  '跑': '执行',
  '整': '进行',
  '整活': '创新尝试',
  '搞起': '启动执行',
  
  // 开发类
  '写': '编写',
  '撸': '开发实现',
  '敲': '编码',
  '码': '开发',
  '搬砖': '完成开发任务',
  '砌砖': '完成开发工作',
  
  // 推进类
  '催': '跟进',
  'push': '推进',
  '推': '推进',
  '赶': '推进',
  '催命': '紧急跟进',
  
  // 修复类
  '修': '修复',
  '改': '优化',
  '调': '调整',
  '调教': '调试优化',
  
  // 沟通类
  '聊': '沟通',
  '唠': '交流',
  '扯': '讨论',
  '吹': '交流',
  
  // Emoji情绪描述转正式表达
  '强烈不满': '存在需要重点关注的问题',
  '情绪激动': '态度较为激动',
  '非常满意': '整体表现优异',
  '心情愉悦': '工作状态良好',
  '工作顺利': '项目进展顺利',
  '感到遗憾': '存在一定遗憾',
  '存在失落': '信心有待提升',
  '情绪低落': '需关注工作状态',
  '工作压力较大': '工作量较大，需合理安排',
  '精力不足': '需适当调整工作节奏',
  '需支持帮助': '需相关方配合支持',
  '态度需调整': '沟通方式需优化',
  '存在疑虑': '需进一步澄清',
  '情绪疲惫': '需适当休息调整',
  '存在尴尬': '需注意沟通方式',
  '需调整心态': '保持平和心态',
  '感到意外': '情况超出预期',
  '超出预期': '影响较大',
  '信息过载': '信息量较大',
  '感到困惑': '存在理解偏差',
}

/**
 * 综合情绪词映射（用于模拟清洗）
 * 合并以上所有分类
 */
const EMOTION_MAP: Record<string, string> = {
  ...NEGATIVE_EMOTIONS,
  ...SARCASM_EXPRESSIONS,
  ...POSITIVE_EXPRESSIONS,
  ...COLLOQUIAL_VERBS,
  
  // 特殊符号处理
  '!!!': '。',
  '!!': '。',
}

/**
 * 口语化表达正式化映射
 */
const FORMAL_TRANSFORM: Record<string, string> = {
  ...COLLOQUIAL_VERBS,
  
  // 语气词处理
  '哈': '',
  '呀': '',
  '嘛': '',
  '哦': '，',
  '嗷': '，',
  '嗯': '，',
  
  // 重复表达
  '真的': '确实',
  '真的是': '确实是',
  '其实': '实际上',
  '就是': '',
  
  // 感叹词
  '卧槽': '经过评估',
  '我去': '经过处理',
  '天哪': '经分析',
  '我的天': '经分析发现',
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

## 核心原则
1. **保持原意**：只改变表达方式，不改变核心信息
2. **去除情绪**：删除或转化情绪化词汇、感叹词
3. **正式表达**：使用客观、专业、书面的职场语言
4. **结构保留**：保持原有的段落结构和逻辑顺序

## 需要处理的常见情况

### 1. 负面情绪词转化示例
| 输入 | 输出 |
|------|------|
| "这个需求真烦，改了三遍了" | "该需求经过三轮迭代" |
| "累死了加班到凌晨" | "投入额外工作时长完成" |
| "崩溃了，bug修不好" | "该问题需重点关注解决" |
| "头大，需求又变了" | "需求复杂度较高" |
| "无语，文档又写错了" | "存在文档偏差，需澄清" |
| "心塞，被客户投诉了" | "收到客户反馈，需改进" |
| "郁闷，方案被否了" | "方案需调整优化" |
| "气死了，甩锅给我" | "责任边界需明确" |

### 2. 吐槽表达转化示例
| 输入 | 输出 |
|------|------|
| "这个坑太深了" | "存在较大风险点" |
| "又要扯皮了" | "需多方协调" |
| "谁在甩锅" | "责任归属需明确" |
| "天天摸鱼也行" | "高效完成工作" |
| "又开始划水" | "灵活调整工作方式" |
| "这个功能太恶心了" | "存在不符合预期的状况" |

### 3. 口语化动词转化示例
| 输入 | 输出 |
|------|------|
| "终于搞定了" | "已完成" |
| "代码撸完了" | "代码编写完成" |
| "需求怼上去了" | "需求已推进" |
| "肝了两天" | "投入两天开发" |
| "今天整了个新功能" | "今天完成了新功能开发" |
| "赶紧催一下" | "请跟进确认" |
| "催命啊" | "紧急跟进" |

### 4. 积极夸赞词转化示例
| 输入 | 输出 |
|------|------|
| "这个方案牛逼" | "该方案质量较高" |
| "太厉害了" | "表现优异" |
| "YYDS" | "堪称典范" |
| "绝了" | "效果极佳" |
| "卷王无疑" | "投入度较高" |

### 5. 标点符号处理
- 删除连续感叹号 "！！！" → "。"
- 删除无意义的语气词

## 输出要求
- 直接输出清洗后的文本，不要添加任何解释或说明
- 如果文本已足够正式，可保持原样输出
- 保留重要的技术术语和数据`

    try {
      const result = await callDoubaoAPI(systemPrompt, text)
      if (result) return result
    } catch (error) {
      const errorMessage = error instanceof AIError 
        ? getAIErrorMessage(error)
        : 'AI 清洗失败'
      console.warn(`${errorMessage}，使用本地模拟实现`)
    }
  }

  // 未配置 API 或发生错误，使用模拟实现
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
        throw new AIError(AIErrorType.PARSE_ERROR, 'API 返回为空')
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
      if (error instanceof AIError) {
        console.warn(`${getAIErrorMessage(error)}，使用本地模拟实现`)
      } else {
        console.warn('AI 标签生成失败，使用本地模拟实现')
      }
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

## 周报结构（严格按照以下顺序输出）

### 1. 概述（必填）
- 一句话概括本周整体工作
- 包含关键数据和亮点

### 2. 本周重点（3-5条）
- 每条一行，简洁有力
- 按重要程度排序
- 使用动词开头

### 3. 主要成果（量化优先）
- 优先列出可量化的成果
- 包含具体数字、比例、完成率
- 如无数据，可用"完成XX阶段"表述

### 4. 问题与解决（可选）
- 简述遇到的问题
- 重点说明解决方案
- 体现解决问题的能力

### 5. 下周计划（2-4条）
- 明确的预期目标
- 可执行的具体任务
- 预计完成时间

## 语言规范
- 正式、客观、专业
- 避免情绪化表达
- 数据说话，成果导向
- 控制在200-400字

## 输出格式（必须是有效JSON）
{
  "title": "第X周工作周报 - YYYY年MM月DD日",
  "summary": "本周工作概述（1-2句话）",
  "highlights": ["重点1 - 包含数字", "重点2", "重点3"],
  "achievements": ["成果1 - 量化数据", "成果2"],
  "problems": ["问题描述 → 解决方案"],
  "nextWeek": ["计划1 - 目标", "计划2 - 目标"]
}

## 注意事项
- 只输出JSON对象，不要添加任何说明文字
- 如果笔记内容不足以生成某项，填入"暂无"或空数组
- 确保JSON格式正确，可被解析`

    try {
      const result = await callDoubaoAPI(
        systemPrompt,
        `时间范围：${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n笔记内容：\n${notesContent}`,
        { max_tokens: 1500 }
      )
      
      if (!result) {
        throw new AIError(AIErrorType.PARSE_ERROR, 'API 返回为空')
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
      if (error instanceof AIError) {
        console.warn(`${getAIErrorMessage(error)}，使用本地模拟实现`)
      } else if (error instanceof SyntaxError) {
        console.warn('AI 周报格式解析失败，使用本地模拟实现')
      } else {
        console.warn('AI 周报生成失败，使用本地模拟实现')
      }
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
        throw new AIError(AIErrorType.PARSE_ERROR, 'API 返回为空')
      }
      
      const insights = JSON.parse(result)
      return {
        coreConclusion: insights.coreConclusion || '',
        keyInsights: insights.keyInsights || [],
      }
    } catch (error) {
      if (error instanceof AIError) {
        console.warn(`${getAIErrorMessage(error)}，使用本地模拟实现`)
      } else if (error instanceof SyntaxError) {
        console.warn('AI 洞察格式解析失败，使用本地模拟实现')
      } else {
        console.warn('AI 洞察提炼失败，使用本地模拟实现')
      }
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
