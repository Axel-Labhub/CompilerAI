/**
 * AI 功能增强模块
 * - 带重试机制的 AI 调用
 * - 友好的错误处理
 * - 操作状态管理
 */

import { AIError, AIErrorType, getAIErrorMessage } from './ai'

// ==================== 类型定义 ====================

export interface RetryableAIOptions {
  /** 最大重试次数 */
  maxRetries?: number
  /** 初始重试延迟(ms) */
  initialDelay?: number
  /** 重试倍数 */
  backoffMultiplier?: number
  /** 是否在重试时显示提示 */
  showRetryToast?: boolean
}

export interface AIErrorContext {
  /** 操作名称 */
  operation: string
  /** 错误 */
  error: AIError | Error
  /** 是否显示用户提示 */
  showUserToast?: boolean
}

export interface AIErrorResult {
  message: string
  suggestion: string
  canRetry: boolean
}

// ==================== 带重试的 AI 调用 ====================

/**
 * 带重试机制的 AI 调用包装函数
 * 
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => callDoubaoAPI(systemPrompt, content),
 *   { maxRetries: 3, showRetryToast: true }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryableAIOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    showRetryToast = false,
  } = options

  let lastError: Error | null = null
  let currentDelay = initialDelay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // 检查是否应该重试
      if (error instanceof AIError && !error.isRetryable) {
        throw error
      }

      if (attempt < maxRetries) {
        if (showRetryToast) {
          console.log(`AI 调用失败，第 ${attempt} 次尝试，${currentDelay}ms 后重试...`)
        }
        await new Promise(resolve => setTimeout(resolve, currentDelay))
        currentDelay *= backoffMultiplier
      }
    }
  }

  throw lastError || new Error('AI 调用失败')
}

/**
 * 创建带重试的 AI 操作包装器
 */
export function createRetryableOperation<T extends (...args: unknown[]) => Promise<unknown>>(
  aiFunction: T,
  options?: RetryableAIOptions
): (...args: Parameters<T>) => Promise<unknown> {
  return (...args: Parameters<T>) => {
    return withRetry(
      () => aiFunction(...args),
      options
    )
  }
}

// ==================== 错误处理增强 ====================

/**
 * 处理 AI 操作错误
 * 返回用户友好的错误信息和恢复建议
 */
export function handleAIError(context: AIErrorContext): AIErrorResult {
  const { operation, error } = context

  if (error instanceof AIError) {
    const baseMessage = getAIErrorMessage(error)
    
    switch (error.type) {
      case AIErrorType.NOT_CONFIGURED:
        return {
          message: `${operation}失败：AI 功能尚未配置`,
          suggestion: '请在设置中配置 API Key',
          canRetry: false,
        }
      case AIErrorType.NETWORK_ERROR:
        return {
          message: `${operation}失败：网络连接异常`,
          suggestion: '请检查网络连接后重试',
          canRetry: true,
        }
      case AIErrorType.TIMEOUT:
        return {
          message: `${operation}失败：请求超时`,
          suggestion: 'AI 响应较慢，请稍后重试',
          canRetry: true,
        }
      case AIErrorType.RATE_LIMIT:
        return {
          message: `${operation}失败：请求过于频繁`,
          suggestion: '请稍后再试，或联系管理员提高 API 配额',
          canRetry: true,
        }
      case AIErrorType.AUTH_ERROR:
        return {
          message: `${operation}失败：API 认证失败`,
          suggestion: '请检查 API Key 是否正确',
          canRetry: false,
        }
      case AIErrorType.SERVER_ERROR:
        return {
          message: `${operation}失败：AI 服务暂时不可用`,
          suggestion: '请稍后重试',
          canRetry: true,
        }
      default:
        return {
          message: `${operation}失败：${baseMessage}`,
          suggestion: '请重试或联系技术支持',
          canRetry: true,
        }
    }
  }

  // 非 AIError 的错误
  return {
    message: `${operation}失败：${error.message}`,
    suggestion: '请重试或联系技术支持',
    canRetry: true,
  }
}

// ==================== 操作状态 Hook ====================

export interface AsyncAIState<T> {
  data: T | null
  loading: boolean
  error: AIErrorResult | null
}

/**
 * 创建 AI 操作的 Promise 包装
 */
export function wrapAIOperation<T>(
  promise: Promise<T>,
  operationName: string
): Promise<{ data: T | null; error: AIErrorResult | null }> {
  return promise
    .then(data => ({ data, error: null }))
    .catch(error => {
      const errorResult = handleAIError({
        operation: operationName,
        error: error instanceof Error ? error : new Error(String(error)),
      })
      return { data: null, error: errorResult }
    })
}

// ==================== 默认配置 ====================

export const DEFAULT_RETRY_OPTIONS: Required<RetryableAIOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  showRetryToast: false,
}
