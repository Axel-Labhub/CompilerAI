/**
 * 全局 Toast 事件总线
 * 用于在任意位置显示 Toast 通知，避免通过 props 层层传递
 */

type ToastCallback = (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
let globalToastCallback: ToastCallback | null = null

export function setGlobalToastCallback(callback: ToastCallback | null) {
  globalToastCallback = callback
}

export function showToastGlobal(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
  globalToastCallback?.(message, type)
}
