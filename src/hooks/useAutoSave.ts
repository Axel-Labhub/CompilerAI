/**
 * useAutoSave Hook
 * 自动保存逻辑封装
 */

import { useEffect, useRef, useCallback } from 'react'
import { showToastGlobal } from '../lib/toast'

export interface UseAutoSaveOptions {
  /** 是否启用自动保存 */
  enabled?: boolean
  /** 自动保存延迟(ms) */
  delay?: number
  /** 保存函数 */
  onSave: () => Promise<void>
  /** 依赖项数组 */
  dependencies: unknown[]
}

export interface UseAutoSaveReturn {
  /** 手动触发保存 */
  triggerSave: () => void
  /** 是否正在保存 */
  isSaving: boolean
}

/**
 * 自动保存 Hook
 */
export function useAutoSave(options: UseAutoSaveOptions): UseAutoSaveReturn {
  const {
    enabled = true,
    delay = 1000,
    onSave,
    dependencies,
  } = options

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)

  const triggerSave = useCallback(async () => {
    if (isSavingRef.current) return

    isSavingRef.current = true
    try {
      await onSave()
    } finally {
      isSavingRef.current = false
    }
  }, [onSave])

  useEffect(() => {
    if (!enabled) return

    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // 设置新的定时器
    timerRef.current = setTimeout(() => {
      triggerSave()
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [enabled, delay, triggerSave, ...dependencies])

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    triggerSave,
    isSaving: isSavingRef.current,
  }
}

/**
 * useManualSave Hook
 * 手动保存（快捷键触发）
 */
export function useManualSave(options: {
  onSave: () => Promise<void>
  enabled?: boolean
}): void {
  const { onSave, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave()
        showToastGlobal('笔记已保存', 'success')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave, enabled])
}
