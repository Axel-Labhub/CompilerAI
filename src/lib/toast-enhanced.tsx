/**
 * Toast 系统增强版
 * - 更多 Toast 类型(success/error/warning/info/loading)
 * - 自动消失时间配置
 * - 操作反馈(可带操作按钮)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { setGlobalToastCallback } from './toast'

// ==================== 类型定义 ====================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastAction {
  /** 按钮文本 */
  label: string
  /** 点击回调 */
  onClick: () => void
  /** 按钮样式变体 */
  variant?: 'primary' | 'secondary' | 'danger'
}

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number  // 0 表示不自动消失
  action?: ToastAction
  title?: string  // 可选的标题
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string  // 返回 toast id
  hideToast: (id: string) => void
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void
  // 便捷方法
  success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => string
  error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => string
  warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => string
  info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => string
  loading: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => string
}

// ==================== 上下文 ====================

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// ==================== Provider ====================

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  // 生成唯一 ID
  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // 显示 Toast
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId()
    const newToast: Toast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // 自动消失
    const duration = toast.duration ?? (toast.type === 'loading' ? 0 : 3000)
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [generateId])

  // 隐藏 Toast
  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // 更新 Toast
  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ))
  }, [])

  // 便捷方法
  const success = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
    return showToast({ message, type: 'success', ...options })
  }, [showToast])

  const error = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
    return showToast({ message, type: 'error', duration: options?.duration ?? 5000, ...options })
  }, [showToast])

  const warning = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
    return showToast({ message, type: 'warning', duration: options?.duration ?? 4000, ...options })
  }, [showToast])

  const info = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
    return showToast({ message, type: 'info', ...options })
  }, [showToast])

  const loading = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
    return showToast({ message, type: 'loading', duration: 0, ...options })
  }, [showToast])

  // 设置全局 Toast 回调（兼容旧代码）
  useEffect(() => {
    const globalCallback = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
      showToast({ message, type })
    }
    setGlobalToastCallback(globalCallback)
    return () => setGlobalToastCallback(null)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ 
      toasts, 
      showToast, 
      hideToast, 
      updateToast,
      success,
      error,
      warning,
      info,
      loading,
    }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  )
}

// ==================== 样式配置 ====================

const toastStyles: Record<ToastType, { bg: string; icon: string; iconBg: string }> = {
  success: {
    bg: 'bg-gradient-to-r from-green-600 to-emerald-600 border border-green-500/50',
    icon: '✓',
    iconBg: 'bg-green-500/30',
  },
  error: {
    bg: 'bg-gradient-to-r from-red-600 to-rose-600 border border-red-500/50',
    icon: '✕',
    iconBg: 'bg-red-500/30',
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-600 to-orange-600 border border-yellow-500/50',
    icon: '⚠',
    iconBg: 'bg-yellow-500/30',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-600 to-cyan-600 border border-blue-500/50',
    icon: 'ℹ',
    iconBg: 'bg-blue-500/30',
  },
  loading: {
    bg: 'bg-gradient-to-r from-gray-600 to-gray-700 border border-gray-500/50',
    icon: '⟳',
    iconBg: 'bg-gray-500/30',
  },
}

// ==================== Toast 容器 ====================

const ToastContainer: React.FC<{ toasts: Toast[]; onHide: (id: string) => void }> = ({ toasts, onHide }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={() => onHide(toast.id)} />
      ))}
    </div>
  )
}

// ==================== 单个 Toast 项 ====================

const ToastItem: React.FC<{ toast: Toast; onHide: () => void }> = React.memo(({ toast, onHide }) => {
  const style = toastStyles[toast.type]
  const actionVariantClasses = {
    primary: 'bg-white/20 hover:bg-white/30 text-white',
    secondary: 'bg-transparent hover:bg-white/10 text-white/80',
    danger: 'bg-red-500 hover:bg-red-400 text-white',
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white pointer-events-auto max-w-md animate-slide-in-right ${style.bg}`}
      role="alert"
      aria-live="polite"
    >
      {/* 图标 */}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
        {toast.type === 'loading' ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        ) : (
          <span className="text-sm font-bold">{style.icon}</span>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="text-sm font-semibold mb-0.5">{toast.title}</div>
        )}
        <div className="text-sm font-medium">{toast.message}</div>
        
        {/* 操作按钮 */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick()
              onHide()
            }}
            className={`mt-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
              actionVariantClasses[toast.action.variant || 'primary']
            }`}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={onHide}
        className="p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
        aria-label="关闭提示"
        disabled={toast.type === 'loading'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
})

ToastItem.displayName = 'ToastItem'

// ==================== 带操作的 Toast Hook ====================

export interface UseToastActionOptions {
  /** 成功消息 */
  message: string
  /** 操作按钮配置 */
  action: ToastAction
  /** Toast 类型 */
  type?: ToastType
  /** 自动消失时间 */
  duration?: number
}

/**
 * 带操作的 Toast Hook
 */
export function useToastAction() {
  const { showToast, hideToast } = useToast()

  const showActionToast = useCallback((options: UseToastActionOptions) => {
    const id = showToast({
      message: options.message,
      type: options.type || 'info',
      duration: options.duration ?? 0,
      action: options.action,
    })
    return id
  }, [showToast])

  return {
    showActionToast,
    hideToast,
  }
}

export default ToastProvider
