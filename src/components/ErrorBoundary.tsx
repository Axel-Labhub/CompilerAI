/**
 * ErrorBoundary 组件
 * React 错误边界，用于捕获子组件的 JavaScript 错误
 */

import React, { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode
  /** 错误回调 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** 自定义错误 fallback 组件 */
  fallback?: ReactNode | ((error: Error, errorInfo: React.ErrorInfo) => ReactNode)
  /** 是否显示错误详情（生产环境建议关闭） */
  showDetails?: boolean
  /** 错误恢复回调 */
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * 错误边界组件
 * 
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error) => console.error(error)}
 *   fallback={({ error, reset }) => (
 *     <div>
 *       <p>出错了: {error.message}</p>
 *       <button onClick={reset}>重试</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新 state 以便下次渲染可以显示 fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // 调用错误回调
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    this.props.onReset?.()
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, showDetails = false } = this.props

    if (hasError && error) {
      // 使用自定义 fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, errorInfo!)
        }
        return fallback
      }

      // 默认 fallback
      return (
        <DefaultErrorFallback 
          error={error} 
          errorInfo={errorInfo}
          showDetails={showDetails}
          onReset={this.resetError}
        />
      )
    }

    return children
  }
}

// ==================== 默认错误 Fallback ====================

interface DefaultErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo | null
  showDetails: boolean
  onReset: () => void
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  errorInfo,
  showDetails,
  onReset,
}) => {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6 bg-red-950/20 border border-red-900/30 rounded-lg">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">组件渲染出错</h3>
        <p className="text-sm text-gray-400 mb-4">
          抱歉，此组件发生了错误。请尝试刷新或重试操作。
        </p>
        
        {showDetails && error && (
          <details className="text-left mb-4 p-3 bg-black/30 rounded-lg">
            <summary className="text-xs text-gray-500 cursor-pointer mb-2">
              错误详情（仅开发环境可见）
            </summary>
            <div className="text-xs font-mono text-red-300 overflow-auto max-h-40">
              <p className="font-bold">{error.name}: {error.message}</p>
              {errorInfo && (
                <p className="mt-2 text-gray-400">
                  Component Stack:<br />
                  {errorInfo.componentStack}
                </p>
              )}
            </div>
          </details>
        )}

        <button
          onClick={onReset}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  )
}

// ==================== Hook 版本的 Error Boundary ====================

/**
 * useErrorHandler Hook
 * 用于在函数组件中抛出错误
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((err: Error | string) => {
    if (err instanceof Error) {
      setError(err)
    } else {
      setError(new Error(err))
    }
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  if (error) {
    throw error
  }

  return { handleError, resetError }
}

// ==================== 异步错误处理 Hook ====================

export interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

/**
 * useAsyncError Hook
 * 用于处理异步操作的错误状态
 */
export function useAsyncError() {
  const [state, setState] = React.useState<AsyncOperationState<unknown>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = React.useCallback(async <T,>(asyncFn: () => Promise<T>): Promise<T | null> => {
    setState({ data: null, loading: true, error: null })
    
    try {
      const result = await asyncFn()
      setState({ data: result, loading: false, error: null })
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState({ data: null, loading: false, error })
      return null
    }
  }, [])

  const reset = React.useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

export default ErrorBoundary
