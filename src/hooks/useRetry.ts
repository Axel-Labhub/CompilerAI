/**
 * useRetry Hook
 * 带重试机制的异步操作封装
 */

import { useState, useCallback, useRef } from 'react'
import { showToastGlobal } from '../lib/toast'

export interface RetryOptions {
  /** 最大重试次数，默认 3 */
  maxRetries?: number
  /** 重试延迟(ms)，默认 1000 */
  delay?: number
  /** 重试倍数，默认 2（指数退避） */
  backoffMultiplier?: number
  /** 是否显示重试提示 */
  showToast?: boolean
  /** 自定义重试条件 */
  shouldRetry?: (error: Error, attempt: number) => boolean
}

export interface UseRetryReturn<T> {
  /** 执行带重试的操作 */
  execute: (fn: () => Promise<T>) => Promise<T | null>
  /** 是否正在执行 */
  isLoading: boolean
  /** 当前重试次数 */
  attemptCount: number
  /** 当前错误 */
  error: Error | null
  /** 重置状态 */
  reset: () => void
}

/**
 * 带重试机制的 Hook
 */
export function useRetry<T>(options: RetryOptions = {}): UseRetryReturn<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    showToast = true,
    shouldRetry,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true)
    setError(null)
    setAttemptCount(0)

    abortControllerRef.current = new AbortController()

    let lastError: Error | null = null
    let currentDelay = delay

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      setAttemptCount(attempt)

      try {
        const result = await fn()
        setIsLoading(false)
        if (showToast && attempt > 1) {
          showToastGlobal(`操作成功 (第 ${attempt} 次尝试)`, 'success')
        }
        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        // 检查是否应该重试
        const shouldRetryNow = shouldRetry 
          ? shouldRetry(lastError, attempt)
          : attempt <= maxRetries

        if (!shouldRetryNow) {
          setError(lastError)
          setIsLoading(false)
          return null
        }

        // 显示重试提示
        if (showToast && attempt <= maxRetries) {
          showToastGlobal(
            `操作失败，${currentDelay / 1000}秒后重试... (${attempt}/${maxRetries})`,
            'warning'
          )
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, currentDelay))
        currentDelay *= backoffMultiplier
      }
    }

    setError(lastError)
    setIsLoading(false)
    if (showToast) {
      showToastGlobal(`操作失败: ${lastError?.message || '未知错误'}`, 'error')
    }
    return null
  }, [maxRetries, delay, backoffMultiplier, showToast, shouldRetry])

  const reset = useCallback(() => {
    setIsLoading(false)
    setAttemptCount(0)
    setError(null)
    abortControllerRef.current?.abort()
  }, [])

  return {
    execute,
    isLoading,
    attemptCount,
    error,
    reset,
  }
}

/**
 * useRetryAction Hook
 * 用于用户操作的简单重试
 */
export function useRetryAction<T>(
  action: () => Promise<T>,
  options: {
    maxRetries?: number
    onSuccess?: (result: T) => void
    onError?: (error: Error) => void
  } = {}
) {
  const { maxRetries = 2, onSuccess, onError } = options
  const [isRetrying, setIsRetrying] = useState(false)
  const retryCountRef = useRef(0)

  const execute = useCallback(async () => {
    setIsRetrying(true)
    retryCountRef.current = 0

    while (retryCountRef.current < maxRetries) {
      try {
        const result = await action()
        setIsRetrying(false)
        retryCountRef.current = 0
        onSuccess?.(result)
        return result
      } catch (err) {
        retryCountRef.current++
        
        if (retryCountRef.current >= maxRetries) {
          setIsRetrying(false)
          const error = err instanceof Error ? err : new Error(String(err))
          onError?.(error)
          throw error
        }

        // 指数退避
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retryCountRef.current) * 500)
        )
      }
    }

    return null
  }, [action, maxRetries, onSuccess, onError])

  return {
    execute,
    isRetrying,
    retryCount: retryCountRef.current,
  }
}

export default useRetry
