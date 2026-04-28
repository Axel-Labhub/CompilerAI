/**
 * AI API 配置文件
 * 
 * 支持的 AI 服务商：
 * 1. 豆包（火山引擎，推荐）
 * 2. DeepSeek
 * 
 * 使用方法：
 * 1. 选择一个服务商，获取 API Key
 * 2. 豆包: https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey
 * 3. DeepSeek: https://platform.deepseek.com/api_keys
 * 4. 在 .env 文件中填入 API Key 和服务商选择
 */

import type { AIProvider } from '../types'

// 获取配置
const provider = (import.meta.env.VITE_AI_PROVIDER || 'douban') as AIProvider
const apiKey = import.meta.env.VITE_AI_API_KEY || ''
const model = import.meta.env.VITE_AI_MODEL || ''

// DeepSeek 配置（推荐）
const DEEPSEEK_CONFIG = {
  apiKey,
  model: model || 'deepseek-chat',
  baseURL: 'https://api.deepseek.com',
  defaultParams: {
    temperature: 0.3,
    max_tokens: 1000,
  }
}

// 豆包配置（火山引擎，推荐）
const DOUBAN_CONFIG = {
  apiKey,
  model: model || 'doubao-seed-2.0-lite',
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  defaultParams: {
    temperature: 0.3,
    max_tokens: 1000,
  }
}

// 根据提供商获取配置
export function getAIConfig() {
  switch (provider) {
    case 'douban':
      return DOUBAN_CONFIG
    case 'deepseek':
    default:
      return DEEPSEEK_CONFIG
  }
}

// 导出当前使用的配置（兼容旧代码）
export const AI_CONFIG = getAIConfig()

/**
 * 检查配置是否完整
 */
export function isAIConfigured(): boolean {
  return AI_CONFIG.apiKey !== '' && AI_CONFIG.model !== ''
}

/**
 * 获取配置信息（不包含敏感信息）
 */
export function getAIConfigInfo() {
  return {
    isConfigured: isAIConfigured(),
    provider,
    model: AI_CONFIG.model,
    baseURL: AI_CONFIG.baseURL,
  }
}

/**
 * 支持的 AI 提供商列表
 */
export const AI_PROVIDERS: Record<AIProvider, { name: string; docsUrl: string }> = {
  deepseek: {
    name: 'DeepSeek',
    docsUrl: 'https://platform.deepseek.com/docs'
  },
  douban: {
    name: '豆包（火山引擎）',
    docsUrl: 'https://www.volcengine.com/docs/82379/1399008'
  }
}
